const { Department, Employee } = require('../models');
const ApiError = require('../utils/ApiError');

const listDepartments = () =>
  Department.findAll({
    order: [['name', 'ASC']],
  });

const createDepartment = async (data) => {
  const existing = await Department.findOne({ where: { name: data.name } });
  if (existing) throw ApiError.conflict('A department with this name already exists');
  return Department.create(data);
};

const updateDepartment = async (id, data) => {
  const department = await Department.findByPk(id);
  if (!department) throw ApiError.notFound('Department not found');
  await department.update(data);
  return department;
};

const deleteDepartment = async (id) => {
  const employeeCount = await Employee.count({ where: { departmentId: id } });
  if (employeeCount > 0) {
    throw ApiError.badRequest('Cannot delete a department that still has employees assigned');
  }
  const department = await Department.findByPk(id);
  if (!department) throw ApiError.notFound('Department not found');
  await department.destroy();
};

module.exports = { listDepartments, createDepartment, updateDepartment, deleteDepartment };
