const express = require('express');
const multer = require('multer');
const router = express.Router();
const generalWorkerController = require('../controllers/generalWorkerController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createGeneralWorkerValidator,
  updateGeneralWorkerValidator,
  idParamValidator,
  uploadPreviewValidator,
  uploadCommitValidator,
} = require('../validators/generalWorkerValidator');
const { ROLES } = require('../config/constants');
const ApiError = require('../utils/ApiError');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(ApiError.badRequest('Only .xlsx or .xls files are accepted'));
    }
    return cb(null, true);
  },
});

// General workers (no system login) - HR/Admin only, no self-service angle.
router.use(authenticate, authorize(ROLES.ADMIN, ROLES.HR));

router.get('/sites', generalWorkerController.listSites);
router.get('/expiring', generalWorkerController.listExpiringContracts);
router.get('/', generalWorkerController.listGeneralWorkers);
router.get('/:id', idParamValidator, validate, generalWorkerController.getGeneralWorker);

router.post('/', createGeneralWorkerValidator, validate, generalWorkerController.createGeneralWorker);
router.put('/:id', updateGeneralWorkerValidator, validate, generalWorkerController.updateGeneralWorker);
router.delete('/:id', idParamValidator, validate, generalWorkerController.deleteGeneralWorker);

router.post(
  '/upload/preview',
  upload.single('file'),
  uploadPreviewValidator,
  validate,
  generalWorkerController.uploadPreview
);
router.post('/upload/commit', uploadCommitValidator, validate, generalWorkerController.uploadCommit);

module.exports = router;
