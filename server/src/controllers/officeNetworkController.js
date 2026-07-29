const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const officeNetworkService = require('../services/officeNetworkService');

const listOfficeNetworks = asyncHandler(async (req, res) => {
  const networks = await officeNetworkService.listOfficeNetworks();
  ApiResponse.send(res, 200, networks, 'Office networks retrieved');
});

const createOfficeNetwork = asyncHandler(async (req, res) => {
  const network = await officeNetworkService.createOfficeNetwork(req.body);
  ApiResponse.send(res, 201, network, 'Office network added');
});

const updateOfficeNetwork = asyncHandler(async (req, res) => {
  const network = await officeNetworkService.updateOfficeNetwork(req.params.id, req.body);
  ApiResponse.send(res, 200, network, 'Office network updated');
});

const deleteOfficeNetwork = asyncHandler(async (req, res) => {
  await officeNetworkService.deleteOfficeNetwork(req.params.id);
  ApiResponse.send(res, 200, null, 'Office network removed');
});

module.exports = { listOfficeNetworks, createOfficeNetwork, updateOfficeNetwork, deleteOfficeNetwork };
