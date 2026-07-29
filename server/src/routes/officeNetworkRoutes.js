const express = require('express');
const router = express.Router();
const officeNetworkController = require('../controllers/officeNetworkController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { upsertOfficeNetworkValidator, idParamValidator } = require('../validators/officeNetworkValidator');
const { ROLES } = require('../config/constants');

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/', officeNetworkController.listOfficeNetworks);
router.post('/', upsertOfficeNetworkValidator, validate, officeNetworkController.createOfficeNetwork);
router.put('/:id', idParamValidator, upsertOfficeNetworkValidator, validate, officeNetworkController.updateOfficeNetwork);
router.delete('/:id', idParamValidator, validate, officeNetworkController.deleteOfficeNetwork);

module.exports = router;
