const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const employeeService = require('../services/employeeService');
const { logAudit } = require('../middleware/auditLogger');
const { AUDIT_ACTIONS } = require('../config/constants');

const listEmployees = asyncHandler(async (req, res) => {
  const result = await employeeService.listEmployees(req.query);
  ApiResponse.send(res, 200, result, 'Employees retrieved');
});

const listEmployeesWithoutAccount = asyncHandler(async (req, res) => {
  const employees = await employeeService.getEmployeesWithoutAccount();
  ApiResponse.send(res, 200, employees, 'Employees without a user account retrieved');
});

const listTerminatedEmployees = asyncHandler(async (req, res) => {
  const result = await employeeService.listTerminatedEmployees(req.query);
  ApiResponse.send(res, 200, result, 'Terminated employees retrieved');
});

const getEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.getEmployeeById(req.params.id);
  ApiResponse.send(res, 200, employee, 'Employee retrieved');
});

const createEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.createEmployee(req.body);

  await logAudit({
    userId: req.user.id,
    action: AUDIT_ACTIONS.CREATE,
    entityType: 'Employee',
    entityId: employee.id,
    details: { employeeNumber: employee.employeeNumber },
    ipAddress: req.ip,
  });

  ApiResponse.send(res, 201, employee, 'Employee created successfully');
});

const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.updateEmployee(req.params.id, req.body);

  await logAudit({
    userId: req.user.id,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'Employee',
    entityId: employee.id,
    ipAddress: req.ip,
  });

  ApiResponse.send(res, 200, employee, 'Employee updated successfully');
});

const deleteEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.deleteEmployee(req.params.id, {
    terminatedBy: req.user.id,
    reason: req.body?.reason,
  });

  await logAudit({
    userId: req.user.id,
    action: AUDIT_ACTIONS.DELETE,
    entityType: 'Employee',
    entityId: employee.id,
    details: { reason: req.body?.reason },
    ipAddress: req.ip,
  });

  ApiResponse.send(res, 200, employee, 'Employee terminated successfully');
});

const setAllowance = asyncHandler(async (req, res) => {
  const { allowanceId, amount } = req.body;
  const record = await employeeService.setEmployeeAllowance(req.params.id, allowanceId, amount);
  ApiResponse.send(res, 200, record, 'Employee allowance set');
});

const setDeduction = asyncHandler(async (req, res) => {
  const { deductionId, amount } = req.body;
  const record = await employeeService.setEmployeeDeduction(req.params.id, deductionId, amount);
  ApiResponse.send(res, 200, record, 'Employee deduction set');
});

module.exports = {
  listEmployees,
  listEmployeesWithoutAccount,
  listTerminatedEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  setAllowance,
  setDeduction,
};
