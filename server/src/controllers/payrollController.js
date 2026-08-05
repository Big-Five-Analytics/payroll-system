const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const payrollService = require('../services/payrollService');
const payslipService = require('../services/payslipService');
const notificationService = require('../services/notificationService');
const { AUDIT_ACTIONS, NOTIFICATION_TYPES } = require('../config/constants');
const { logAudit } = require('../middleware/auditLogger');

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

  // If a payslip was already generated for this payroll (ahead of it being marked
  // paid), this is the point it actually becomes visible to the employee - notify now.
  // If no payslip exists yet, the notification instead fires from payslipController
  // once one is generated (which will see payroll.status === 'paid' at that point).
  const payslip = await payslipService.getPayslipByPayrollId(payroll.id);
  if (payslip) {
    await notificationService.notifyEmployeeUser(payroll.employeeId, {
      type: NOTIFICATION_TYPES.PAYSLIP_READY,
      title: 'Payslip available',
      message: `Your payslip for ${payroll.payPeriodMonth}/${payroll.payPeriodYear} is now available.`,
      link: '/my-payslips',
      entityType: 'Payslip',
      entityId: payslip.id,
    });
  }

  ApiResponse.send(res, 200, payroll, 'Payroll marked as paid');
});

module.exports = { generatePayroll, listPayrolls, getPayroll, approvePayroll, markPaid };
