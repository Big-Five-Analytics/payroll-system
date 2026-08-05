const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const payslipService = require('../services/payslipService');
const payrollService = require('../services/payrollService');
const notificationService = require('../services/notificationService');
const fs = require('fs');
const { ROLES, NOTIFICATION_TYPES } = require('../config/constants');

// generatePayslip is idempotent (returns the existing payslip on repeat calls), so we
// check existence beforehand to only notify the first time it's actually created -
// and only once the payroll is paid, since that's the point it becomes visible to the
// employee (see assertCanAccessPayslip below). If it's generated before payout, the
// notification instead fires later from payrollController.markPaid.
const generatePayslip = asyncHandler(async (req, res) => {
  const alreadyExisted = await payslipService.getPayslipByPayrollId(req.params.payrollId);
  const payslip = await payslipService.generatePayslip(req.params.payrollId);

  if (!alreadyExisted) {
    const payroll = await payrollService.getPayrollById(req.params.payrollId);
    if (payroll.status === 'paid') {
      await notificationService.notifyEmployeeUser(payslip.employeeId, {
        type: NOTIFICATION_TYPES.PAYSLIP_READY,
        title: 'Payslip available',
        message: `Your payslip for ${payroll.payPeriodMonth}/${payroll.payPeriodYear} is now available.`,
        link: '/my-payslips',
        entityType: 'Payslip',
        entityId: payslip.id,
      });
    }
  }

  ApiResponse.send(res, 201, payslip, 'Payslip generated successfully');
});

// Employees may only ever see their own payslip, and only once the payroll run is paid.
// Staff roles (Admin/HR/Finance) can see any payslip regardless of pay status.
const assertCanAccessPayslip = (req, payslip) => {
  if (req.user.role.name !== ROLES.EMPLOYEE) return;

  if (!req.user.employeeId || payslip.employeeId !== req.user.employeeId) {
    throw ApiError.forbidden('You can only access your own payslips');
  }
  if (payslip.payroll.status !== 'paid') {
    throw ApiError.forbidden('This payslip is not available yet - it will unlock once payroll has been paid out');
  }
};

const getPayslip = asyncHandler(async (req, res) => {
  const payslip = await payslipService.getPayslipById(req.params.id);
  assertCanAccessPayslip(req, payslip);
  ApiResponse.send(res, 200, payslip, 'Payslip retrieved');
});

const downloadPayslip = asyncHandler(async (req, res) => {
  const payslip = await payslipService.getPayslipById(req.params.id);
  assertCanAccessPayslip(req, payslip);

  if (!payslip.pdfPath || !fs.existsSync(payslip.pdfPath)) {
    throw ApiError.notFound('Payslip PDF file not found');
  }
  res.download(payslip.pdfPath, `${payslip.payslipNumber}.pdf`);
});

// Staff-facing: look up any employee's payslips (all statuses)
const listForEmployee = asyncHandler(async (req, res) => {
  const payslips = await payslipService.listPayslipsForEmployee(req.params.employeeId);
  ApiResponse.send(res, 200, payslips, 'Payslips retrieved');
});

// Self-service: the logged-in employee's own paid payslips only
const listMine = asyncHandler(async (req, res) => {
  if (!req.user.employeeId) {
    throw ApiError.forbidden('This account is not linked to an employee record');
  }
  const payslips = await payslipService.listPaidPayslipsForEmployee(req.user.employeeId);
  ApiResponse.send(res, 200, payslips, 'Your payslips retrieved');
});

module.exports = { generatePayslip, getPayslip, downloadPayslip, listForEmployee, listMine };
