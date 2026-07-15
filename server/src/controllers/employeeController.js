const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const employeeService = require('../services/employeeService');
const { logAudit } = require('../middleware/auditLogger');
const { AUDIT_ACTIONS } = require('../config/constants');

const listEmployees = asyncHandler(async (req, res) => {
  const result = await employeeService.listEmployees(req.query);
  ApiResponse.send(res, 200, result, 'Employees retrieved');
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
  const employee = await employeeService.deleteEmployee(req.params.id);

  await logAudit({
    userId: req.user.id,
    action: AUDIT_ACTIONS.DELETE,
    entityType: 'Employee',
    entityId: employee.id,
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
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  setAllowance,
  setDeduction,
};
