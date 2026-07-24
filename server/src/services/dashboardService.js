const { Op } = require('sequelize');
const { Employee, Payroll, Department, sequelize } = require('../models');

const getDashboardStats = async () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // "Total employees" reflects the current company headcount - terminated staff have
  // effectively moved to the archive and shouldn't inflate this number. It still includes
  // 'suspended' (still employed, just not actively working) alongside 'active'.
  const [employeeCount, activeEmployeeCount, departmentCount] = await Promise.all([
    Employee.count({ where: { status: { [Op.ne]: 'terminated' } } }),
    Employee.count({ where: { status: 'active' } }),
    Department.count(),
  ]);

  const currentMonthPayrolls = await Payroll.findAll({
    where: { payPeriodMonth: month, payPeriodYear: year },
  });

  const currentMonthTotals = currentMonthPayrolls.reduce(
    (acc, p) => {
      acc.grossPay += Number(p.grossPay);
      acc.netPay += Number(p.netPay);
      acc.deductions += Number(p.totalDeductions);
      return acc;
    },
    { grossPay: 0, netPay: 0, deductions: 0 }
  );

  const employeesByDepartment = await Employee.findAll({
    attributes: ['departmentId', [sequelize.fn('COUNT', sequelize.col('Employee.id')), 'count']],
    include: [{ model: Department, as: 'department', attributes: ['name'] }],
    group: ['departmentId', 'department.id', 'department.name'],
    where: { status: 'active' },
  });

  return {
    employeeCount,
    activeEmployeeCount,
    departmentCount,
    currentPayPeriod: { month, year },
    currentMonthPayrollProcessed: currentMonthPayrolls.length,
    currentMonthTotals,
    employeesByDepartment: employeesByDepartment.map((e) => ({
      department: e.department ? e.department.name : 'Unassigned',
      count: Number(e.get('count')),
    })),
  };
};

module.exports = { getDashboardStats };
