const { Parser } = require('json2csv');
const { Op } = require('sequelize');
const { Payroll, Employee, Department, sequelize } = require('../models');

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

module.exports = { monthlyPayrollSummary, payrollHistoryForEmployee, exportPayrollCsv };
