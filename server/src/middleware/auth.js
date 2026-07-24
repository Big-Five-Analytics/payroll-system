const { verifyAccessToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { User, Role, Employee } = require('../models');

// Verifies the JWT and attaches the authenticated user (with role + linked employee, if any) to req.user
const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('No authentication token provided');
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token); // throws JsonWebTokenError/TokenExpiredError if invalid

  const user = await User.findByPk(decoded.id, {
    include: [
      { model: Role, as: 'role' },
      { model: Employee, as: 'employee' },
    ],
  });

  if (!user) throw ApiError.unauthorized('User no longer exists');
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');

  req.user = user;
  next();
});

// Role-based authorization - usage: authorize('Administrator', 'HR Officer')
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) throw ApiError.unauthorized();
  if (!allowedRoles.includes(req.user.role.name)) {
    throw ApiError.forbidden('You do not have permission to perform this action');
  }
  next();
};

module.exports = { authenticate, authorize };
