const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const generalWorkerService = require('../services/generalWorkerService');
const { logAudit } = require('../middleware/auditLogger');
const { AUDIT_ACTIONS } = require('../config/constants');

const listGeneralWorkers = asyncHandler(async (req, res) => {
  const result = await generalWorkerService.listGeneralWorkers(req.query);
  ApiResponse.send(res, 200, result, 'General workers retrieved');
});

const listSites = asyncHandler(async (req, res) => {
  const sites = await generalWorkerService.listSites();
  ApiResponse.send(res, 200, sites, 'Sites retrieved');
});

const listExpiringContracts = asyncHandler(async (req, res) => {
  const workers = await generalWorkerService.getExpiringContracts(req.query.days);
  ApiResponse.send(res, 200, workers, 'Expiring contracts retrieved');
});

const getGeneralWorker = asyncHandler(async (req, res) => {
  const worker = await generalWorkerService.getGeneralWorkerById(req.params.id);
  ApiResponse.send(res, 200, worker, 'General worker retrieved');
});

const createGeneralWorker = asyncHandler(async (req, res) => {
  const worker = await generalWorkerService.createGeneralWorker(req.body);

  await logAudit({
    userId: req.user.id,
    action: AUDIT_ACTIONS.CREATE,
    entityType: 'GeneralWorker',
    entityId: worker.id,
    ipAddress: req.ip,
  });

  ApiResponse.send(res, 201, worker, 'General worker created successfully');
});

const updateGeneralWorker = asyncHandler(async (req, res) => {
  const before = await generalWorkerService.getGeneralWorkerById(req.params.id);
  const previousLeaveBalance = before.leaveBalance;

  const worker = await generalWorkerService.updateGeneralWorker(req.params.id, req.body);

  const details = {};
  if (req.body.leaveBalance !== undefined && Number(previousLeaveBalance) !== Number(worker.leaveBalance)) {
    details.leaveBalance = { from: previousLeaveBalance, to: worker.leaveBalance };
  }

  await logAudit({
    userId: req.user.id,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'GeneralWorker',
    entityId: worker.id,
    details,
    ipAddress: req.ip,
  });

  ApiResponse.send(res, 200, worker, 'General worker updated successfully');
});

const deleteGeneralWorker = asyncHandler(async (req, res) => {
  const worker = await generalWorkerService.deleteGeneralWorker(req.params.id);

  await logAudit({
    userId: req.user.id,
    action: AUDIT_ACTIONS.DELETE,
    entityType: 'GeneralWorker',
    entityId: worker.id,
    ipAddress: req.ip,
  });

  ApiResponse.send(res, 200, worker, 'General worker deleted successfully');
});

const uploadPreview = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('A spreadsheet file is required');
  const preview = await generalWorkerService.previewUpload(req.file.buffer);
  ApiResponse.send(res, 200, preview, 'Spreadsheet parsed successfully');
});

const uploadCommit = asyncHandler(async (req, res) => {
  const { site, mapping, rows, fileName } = req.body;
  const result = await generalWorkerService.importWorkers({ site, mapping, rows, sourceFileName: fileName });

  await logAudit({
    userId: req.user.id,
    action: AUDIT_ACTIONS.BULK_UPLOAD,
    entityType: 'GeneralWorker',
    entityId: null,
    details: { site, fileName, ...result, errorCount: result.errors.length },
    ipAddress: req.ip,
  });

  ApiResponse.send(res, 200, result, 'Spreadsheet imported successfully');
});

module.exports = {
  listGeneralWorkers,
  listSites,
  listExpiringContracts,
  getGeneralWorker,
  createGeneralWorker,
  updateGeneralWorker,
  deleteGeneralWorker,
  uploadPreview,
  uploadCommit,
};
