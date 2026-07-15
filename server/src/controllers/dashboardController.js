const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const dashboardService = require('../services/dashboardService');

const getStats = asyncHandler(async (req, res) => {
  const stats = await dashboardService.getDashboardStats();
  ApiResponse.send(res, 200, stats, 'Dashboard statistics retrieved');
});

module.exports = { getStats };
