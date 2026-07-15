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
} = require('../models');
const ApiError = require('../utils/ApiError');
const { calculatePAYE, calculateNAPSA, calculateNHIMA, round2 } = require('../utils/payrollCalculator');

/**
 * Core payroll engine. For each active employee (or a given subset), computes:
 *   grossPay = basicSalary + taxable allowances + non-taxable allowances
 *   PAYE     = progressive tax on (basicSalary + taxable allowances)
 *   NAPSA    = 5% of basic salary, capped at the statutory ceiling
 *   NHIMA    = 1% of gross pay
 *   netPay   = grossPay - PAYE - NAPSA - NHIMA - other deductions
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

      let taxableAllowances = 0;
      let nonTaxableAllowances = 0;
      const allowanceItems = [];
      for (const ea of employee.allowances) {
        const amount = Number(ea.amount);
        if (ea.allowance.isTaxable) taxableAllowances += amount;
        else nonTaxableAllowances += amount;
        allowanceItems.push({ label: ea.allowance.name, amount });
      }

      let otherDeductions = 0;
      const deductionItems = [];
      for (const ed of employee.deductions) {
        const amount = Number(ed.amount);
        otherDeductions += amount;
        deductionItems.push({ label: ed.deduction.name, amount });
      }

      const totalAllowances = round2(taxableAllowances + nonTaxableAllowances);
      const grossPay = round2(basicSalary + totalAllowances);
      const taxableIncome = round2(basicSalary + taxableAllowances);

      const payeTax = calculatePAYE(taxableIncome, activeBands);
      const napsaContribution = calculateNAPSA(basicSalary);
      const nhimaContribution = calculateNHIMA(grossPay);

      const totalDeductions = round2(payeTax + napsaContribution + nhimaContribution + otherDeductions);
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
          otherDeductions,
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
      await PayrollItem.bulkCreate(items, { transaction: t });

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
