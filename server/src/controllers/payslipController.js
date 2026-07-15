const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const payslipService = require('../services/payslipService');
const fs = require('fs');

const generatePayslip = asyncHandler(async (req, res) => {
  const payslip = await payslipService.generatePayslip(req.params.payrollId);
  ApiResponse.send(res, 201, payslip, 'Payslip generated successfully');
});

const getPayslip = asyncHandler(async (req, res) => {
  const payslip = await payslipService.getPayslipById(req.params.id);
  ApiResponse.send(res, 200, payslip, 'Payslip retrieved');
});

const downloadPayslip = asyncHandler(async (req, res) => {
  const payslip = await payslipService.getPayslipById(req.params.id);
  if (!payslip.pdfPath || !fs.existsSync(payslip.pdfPath)) {
    throw ApiError.notFound('Payslip PDF file not found');
  }
  res.download(payslip.pdfPath, `${payslip.payslipNumber}.pdf`);
});

const listMyPayslips = asyncHandler(async (req, res) => {
  const payslips = await payslipService.listPayslipsForEmployee(req.params.employeeId);
  ApiResponse.send(res, 200, payslips, 'Payslips retrieved');
});

module.exports = { generatePayslip, getPayslip, downloadPayslip, listMyPayslips };
