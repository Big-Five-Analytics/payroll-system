const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const { Op } = require('sequelize');
const { Payroll, Employee, Department, sequelize } = require('../models');
const ApiError = require('../utils/ApiError');

const monthlyPayrollSummary = async (month, year) => {
  const payrolls = await Payroll.findAll({
    where: { payPeriodMonth: month, payPeriodYear: year },
    include: [{ model: Employee, as: 'employee', include: [{ model: Department, as: 'department' }] }],
  });

  const totals = payrolls.reduce(
    (acc, p) => {
      acc.grossPay += Number(p.grossPay);
      acc.payeTax += Number(p.payeTax);
      acc.napsaContribution += Number(p.napsaContribution);
      acc.nhimaContribution += Number(p.nhimaContribution);
      acc.netPay += Number(p.netPay);
      return acc;
    },
    { grossPay: 0, payeTax: 0, napsaContribution: 0, nhimaContribution: 0, netPay: 0 }
  );

  const byDepartment = {};
  for (const p of payrolls) {
    const deptName = p.employee.department ? p.employee.department.name : 'Unassigned';
    if (!byDepartment[deptName]) byDepartment[deptName] = { count: 0, grossPay: 0, netPay: 0 };
    byDepartment[deptName].count += 1;
    byDepartment[deptName].grossPay += Number(p.grossPay);
    byDepartment[deptName].netPay += Number(p.netPay);
  }

  return { month, year, employeeCount: payrolls.length, totals, byDepartment, payrolls };
};

const payrollHistoryForEmployee = (employeeId) =>
  Payroll.findAll({
    where: { employeeId },
    order: [['payPeriodYear', 'DESC'], ['payPeriodMonth', 'DESC']],
  });

const exportPayrollCsv = (payrolls) => {
  const fields = [
    { label: 'Employee Number', value: 'employee.employeeNumber' },
    { label: 'First Name', value: 'employee.firstName' },
    { label: 'Last Name', value: 'employee.lastName' },
    { label: 'Department', value: 'employee.department.name' },
    { label: 'Month', value: 'payPeriodMonth' },
    { label: 'Year', value: 'payPeriodYear' },
    { label: 'Basic Salary', value: 'basicSalary' },
    { label: 'Total Allowances', value: 'totalAllowances' },
    { label: 'Gross Pay', value: 'grossPay' },
    { label: 'PAYE Tax', value: 'payeTax' },
    { label: 'NAPSA', value: 'napsaContribution' },
    { label: 'NHIMA', value: 'nhimaContribution' },
    { label: 'Other Deductions', value: 'otherDeductions' },
    { label: 'Total Deductions', value: 'totalDeductions' },
    { label: 'Net Pay', value: 'netPay' },
    { label: 'Status', value: 'status' },
  ];
  const parser = new Parser({ fields });
  return parser.parse(payrolls.map((p) => p.toJSON()));
};

module.exports = { monthlyPayrollSummary, payrollHistoryForEmployee, exportPayrollCsv, generateBankPaymentFile };

// Builds an .xlsx "bank advice" file: one row per employee being paid that period, with
// exactly what a bank needs to process a salary batch payment (account details + net pay).
// Only approved/paid payroll records are included - a draft/processed-but-unapproved
// run shouldn't go anywhere near the bank yet.
async function generateBankPaymentFile(month, year) {
  const payrolls = await Payroll.findAll({
    where: {
      payPeriodMonth: month,
      payPeriodYear: year,
      status: { [Op.in]: ['approved', 'paid'] },
    },
    include: [{ model: Employee, as: 'employee', include: [{ model: Department, as: 'department' }] }],
    order: [[{ model: Employee, as: 'employee' }, 'lastName', 'ASC']],
  });

  const missingBankDetails = payrolls.filter(
    (p) => !p.employee.bankName || !p.employee.bankAccountNumber
  );
  if (missingBankDetails.length) {
    const names = missingBankDetails
      .map((p) => `${p.employee.firstName} ${p.employee.lastName}`)
      .join(', ');
    throw ApiError.badRequest(
      `The following employees are missing bank details and were excluded - update their records first: ${names}`
    );
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Big Five Investments Payroll System';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(`Bank Payment ${month}-${year}`);

  sheet.columns = [
    { header: 'Employee Number', key: 'employeeNumber', width: 18 },
    { header: 'Full Name', key: 'fullName', width: 28 },
    { header: 'National ID', key: 'nationalId', width: 18 },
    { header: 'Department', key: 'department', width: 20 },
    { header: 'Bank Name', key: 'bankName', width: 22 },
    { header: 'Account Number', key: 'accountNumber', width: 22 },
    { header: 'Net Pay (ZMW)', key: 'netPay', width: 16 },
  ];
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5EDFF' } };

  let totalNetPay = 0;
  for (const p of payrolls) {
    const emp = p.employee;
    totalNetPay += Number(p.netPay);
    sheet.addRow({
      employeeNumber: emp.employeeNumber,
      fullName: `${emp.firstName} ${emp.lastName}`,
      nationalId: emp.nationalId,
      department: emp.department ? emp.department.name : 'Unassigned',
      bankName: emp.bankName,
      accountNumber: emp.bankAccountNumber,
      netPay: Number(p.netPay),
    });
  }

  sheet.getColumn('netPay').numFmt = '#,##0.00';

  const totalRow = sheet.addRow({ fullName: 'TOTAL', netPay: totalNetPay });
  totalRow.font = { bold: true };
  sheet.getColumn('netPay').alignment = { horizontal: 'right' };

  return workbook.xlsx.writeBuffer();
}
