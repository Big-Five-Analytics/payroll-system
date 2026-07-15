const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const payrollService = require('../services/payrollService');
const { logAudit } = require('../middleware/auditLogger');
const { AUDIT_ACTIONS } = require('../config/constants');

const generatePayroll = asyncHandler(async (req, res) => {
  const { month, year, employeeIds } = req.body;
  const payrolls = await payrollService.generatePayroll({
    month,
    year,
    employeeIds,
    processedBy: req.user.id,
  });

  await logAudit({
    userId: req.user.id,
    action: AUDIT_ACTIONS.PAYROLL_RUN,
    entityType: 'Payroll',
    details: { month, year, count: payrolls.length },
    ipAddress: req.ip,
  });

  ApiResponse.send(res, 201, { count: payrolls.length, payrolls }, 'Payroll processed successfully');
});

const listPayrolls = asyncHandler(async (req, res) => {
  const result = await payrollService.listPayrolls(req.query);
  ApiResponse.send(res, 200, result, 'Payroll records retrieved');
});

const getPayroll = asyncHandler(async (req, res) => {
  const payroll = await payrollService.getPayrollById(req.params.id);
  ApiResponse.send(res, 200, payroll, 'Payroll record retrieved');
});

const approvePayroll = asyncHandler(async (req, res) => {
  const payroll = await payrollService.approvePayroll(req.params.id);

  await logAudit({
    userId: req.user.id,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'Payroll',
    entityId: payroll.id,
    details: { status: 'approved' },
    ipAddress: req.ip,
  });

  ApiResponse.send(res, 200, payroll, 'Payroll approved');
});

const markPaid = asyncHandler(async (req, res) => {
  const payroll = await payrollService.markPayrollPaid(req.params.id);

  await logAudit({
    userId: req.user.id,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'Payroll',
    entityId: payroll.id,
    details: { status: 'paid' },
    ipAddress: req.ip,
  });

  ApiResponse.send(res, 200, payroll, 'Payroll marked as paid');
});

module.exports = { generatePayroll, listPayrolls, getPayroll, approvePayroll, markPaid };
