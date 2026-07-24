const { Op } = require('sequelize');
const {
  sequelize,
  Payroll,
  PayrollItem,
  Employee,
  Department,
  EmployeeAllowance,
  EmployeeDeduction,
  Allowance,
  Deduction,
  TaxRate,
  SalaryAdvanceApplication,
} = require('../models');
const ApiError = require('../utils/ApiError');
const { calculatePAYE, calculateNAPSA, calculateNHIMA, round2 } = require('../utils/payrollCalculator');

/**
 * Core payroll engine. For each active employee (or a given subset), computes pay
 * using the ZRA method:
 *   grossPay      = basicSalary + all allowances
 *   NAPSA         = 5% of grossPay
 *   NHIMA         = 1% of basicSalary
 *   taxableIncome = grossPay - NAPSA - NHIMA
 *   PAYE          = progressive tax on taxableIncome
 *   netPay        = grossPay - PAYE - NAPSA - NHIMA - other deductions - salary advance recovery
 *
 * Any approved-but-not-yet-recovered salary advance for the employee is automatically
 * pulled in as a one-time deduction on their next payroll run, then marked recovered -
 * it is never a standing deduction that would repeat on subsequent runs.
 *
 * Runs inside a transaction: either the whole batch commits, or none of it does,
 * so a failure partway through never leaves a half-processed payroll period.
 */
const generatePayroll = async ({ month, year, employeeIds, processedBy }) => {
  const activeBands = await TaxRate.findAll({
    where: { isActive: true },
    order: [['minAmount', 'ASC']],
  });
  if (!activeBands.length) {
    throw ApiError.badRequest('No active PAYE tax bands configured - set these up before running payroll');
  }

  const employeeWhere = { status: 'active' };
  if (employeeIds && employeeIds.length) employeeWhere.id = { [Op.in]: employeeIds };

  const employees = await Employee.findAll({
    where: employeeWhere,
    include: [
      { model: EmployeeAllowance, as: 'allowances', include: [{ model: Allowance, as: 'allowance' }] },
      { model: EmployeeDeduction, as: 'deductions', include: [{ model: Deduction, as: 'deduction' }] },
    ],
  });

  if (!employees.length) {
    throw ApiError.badRequest('No active employees found to process payroll for');
  }

  const results = [];

  await sequelize.transaction(async (t) => {
    for (const employee of employees) {
      const existing = await Payroll.findOne({
        where: { employeeId: employee.id, payPeriodMonth: month, payPeriodYear: year },
        transaction: t,
      });
      if (existing) {
        // Skip already-processed periods rather than failing the whole batch
        continue;
      }

      const basicSalary = Number(employee.basicSalary);

      const allowanceItems = employee.allowances.map((ea) => ({
        label: ea.allowance.name,
        amount: Number(ea.amount),
      }));
      const totalAllowances = round2(allowanceItems.reduce((sum, a) => sum + a.amount, 0));

      const deductionItems = employee.deductions.map((ed) => ({
        label: ed.deduction.name,
        amount: Number(ed.amount),
      }));
      const otherDeductions = round2(deductionItems.reduce((sum, d) => sum + d.amount, 0));

      // Pull in any approved, not-yet-recovered salary advances for this employee -
      // one-time deduction, applied exactly once on the next payroll run.
      const pendingAdvances = await SalaryAdvanceApplication.findAll({
        where: { employeeId: employee.id, status: 'approved', recovered: false },
        transaction: t,
      });
      const advanceRecovery = round2(pendingAdvances.reduce((sum, a) => sum + Number(a.amountRequested), 0));

      const grossPay = round2(basicSalary + totalAllowances);
      const napsaContribution = calculateNAPSA(grossPay);
      const nhimaContribution = calculateNHIMA(basicSalary);
      const taxableIncome = round2(grossPay - napsaContribution - nhimaContribution);
      const payeTax = calculatePAYE(taxableIncome, activeBands);

      const totalDeductions = round2(
        payeTax + napsaContribution + nhimaContribution + otherDeductions + advanceRecovery
      );
      const netPay = round2(grossPay - totalDeductions);

      const payroll = await Payroll.create(
        {
          employeeId: employee.id,
          payPeriodMonth: month,
          payPeriodYear: year,
          basicSalary,
          totalAllowances,
          grossPay,
          payeTax,
          napsaContribution,
          nhimaContribution,
          otherDeductions: round2(otherDeductions + advanceRecovery),
          totalDeductions,
          netPay,
          status: 'processed',
          processedBy,
          processedAt: new Date(),
        },
        { transaction: t }
      );

      const items = [
        ...allowanceItems.map((a) => ({ payrollId: payroll.id, type: 'allowance', label: a.label, amount: a.amount })),
        ...deductionItems.map((d) => ({ payrollId: payroll.id, type: 'deduction', label: d.label, amount: d.amount })),
        { payrollId: payroll.id, type: 'statutory', label: 'PAYE Tax', amount: payeTax },
        { payrollId: payroll.id, type: 'statutory', label: 'NAPSA Contribution', amount: napsaContribution },
        { payrollId: payroll.id, type: 'statutory', label: 'NHIMA Contribution', amount: nhimaContribution },
      ];
      if (advanceRecovery > 0) {
        items.push({
          payrollId: payroll.id,
          type: 'deduction',
          label: 'Salary Advance Recovery',
          amount: advanceRecovery,
        });
      }
      await PayrollItem.bulkCreate(items, { transaction: t });

      if (pendingAdvances.length) {
        await SalaryAdvanceApplication.update(
          { recovered: true, recoveredInPayrollId: payroll.id },
          { where: { id: { [Op.in]: pendingAdvances.map((a) => a.id) } }, transaction: t }
        );
      }

      results.push(payroll);
    }
  });

  return results;
};

const listPayrolls = async ({ page = 1, limit = 20, month, year, status, employeeId }) => {
  const offset = (page - 1) * limit;
  const where = {};
  if (month) where.payPeriodMonth = month;
  if (year) where.payPeriodYear = year;
  if (status) where.status = status;
  if (employeeId) where.employeeId = employeeId;

  const { rows, count } = await Payroll.findAndCountAll({
    where,
    include: [{ model: Employee, as: 'employee', include: [{ model: Department, as: 'department' }] }],
    limit: Number(limit),
    offset,
    order: [['payPeriodYear', 'DESC'], ['payPeriodMonth', 'DESC']],
    distinct: true,
  });

  return { payrolls: rows, total: count, page: Number(page), pages: Math.ceil(count / limit) };
};

const getPayrollById = async (id) => {
  const payroll = await Payroll.findByPk(id, {
    include: [
      { model: Employee, as: 'employee', include: [{ model: Department, as: 'department' }] },
      { model: PayrollItem, as: 'items' },
    ],
  });
  if (!payroll) throw ApiError.notFound('Payroll record not found');
  return payroll;
};

const approvePayroll = async (id) => {
  const payroll = await Payroll.findByPk(id);
  if (!payroll) throw ApiError.notFound('Payroll record not found');
  if (payroll.status !== 'processed') {
    throw ApiError.badRequest(`Cannot approve a payroll record with status "${payroll.status}"`);
  }
  payroll.status = 'approved';
  await payroll.save();
  return payroll;
};

const markPayrollPaid = async (id) => {
  const payroll = await Payroll.findByPk(id);
  if (!payroll) throw ApiError.notFound('Payroll record not found');
  if (payroll.status !== 'approved') {
    throw ApiError.badRequest('Payroll must be approved before it can be marked as paid');
  }
  payroll.status = 'paid';
  await payroll.save();
  return payroll;
};

module.exports = {
  generatePayroll,
  listPayrolls,
  getPayrollById,
  approvePayroll,
  markPayrollPaid,
};
