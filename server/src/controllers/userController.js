const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const userService = require('../services/userService');

const listUsers = asyncHandler(async (req, res) => {
  const result = await userService.listUsers(req.query);
  ApiResponse.send(res, 200, result, 'Users retrieved');
});

const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  const safeUser = user.toJSON();
  delete safeUser.password;
  ApiResponse.send(res, 201, safeUser, 'User created successfully');
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  ApiResponse.send(res, 200, user, 'User updated');
});

const deactivateUser = asyncHandler(async (req, res) => {
  const user = await userService.setUserActive(req.params.id, false);
  ApiResponse.send(res, 200, user, 'User deactivated');
});

const reactivateUser = asyncHandler(async (req, res) => {
  const user = await userService.setUserActive(req.params.id, true);
  ApiResponse.send(res, 200, user, 'User reactivated');
});

const listRoles = asyncHandler(async (req, res) => {
  const roles = await userService.listRoles();
  ApiResponse.send(res, 200, roles, 'Roles retrieved');
});

module.exports = { listUsers, createUser, updateUser, deactivateUser, reactivateUser, listRoles };
