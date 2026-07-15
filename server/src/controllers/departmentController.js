const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const departmentService = require('../services/departmentService');

const listDepartments = asyncHandler(async (req, res) => {
  const departments = await departmentService.listDepartments();
  ApiResponse.send(res, 200, departments, 'Departments retrieved');
});

const createDepartment = asyncHandler(async (req, res) => {
  const department = await departmentService.createDepartment(req.body);
  ApiResponse.send(res, 201, department, 'Department created');
});

const updateDepartment = asyncHandler(async (req, res) => {
  const department = await departmentService.updateDepartment(req.params.id, req.body);
  ApiResponse.send(res, 200, department, 'Department updated');
});

const deleteDepartment = asyncHandler(async (req, res) => {
  await departmentService.deleteDepartment(req.params.id);
  ApiResponse.send(res, 200, null, 'Department deleted');
});

module.exports = { listDepartments, createDepartment, updateDepartment, deleteDepartment };
