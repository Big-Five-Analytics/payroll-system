const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const reportService = require('../services/reportService');

const monthlySummary = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const summary = await reportService.monthlyPayrollSummary(Number(month), Number(year));
  ApiResponse.send(res, 200, summary, 'Monthly payroll summary retrieved');
});

const employeeHistory = asyncHandler(async (req, res) => {
  const history = await reportService.payrollHistoryForEmployee(req.params.employeeId);
  ApiResponse.send(res, 200, history, 'Employee payroll history retrieved');
});

const exportCsv = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const summary = await reportService.monthlyPayrollSummary(Number(month), Number(year));
  const csv = reportService.exportPayrollCsv(summary.payrolls);

  res.header('Content-Type', 'text/csv');
  res.attachment(`payroll-report-${year}-${month}.csv`);
  res.send(csv);
});

module.exports = { monthlySummary, employeeHistory, exportCsv };
