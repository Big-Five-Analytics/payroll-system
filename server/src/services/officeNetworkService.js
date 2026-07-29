const { OfficeNetwork } = require('../models');
const ApiError = require('../utils/ApiError');

const listOfficeNetworks = () => OfficeNetwork.findAll({ order: [['createdAt', 'ASC']] });

const createOfficeNetwork = (data) => OfficeNetwork.create(data);

const updateOfficeNetwork = async (id, data) => {
  const network = await OfficeNetwork.findByPk(id);
  if (!network) throw ApiError.notFound('Office network entry not found');
  await network.update(data);
  return network;
};

const deleteOfficeNetwork = async (id) => {
  const network = await OfficeNetwork.findByPk(id);
  if (!network) throw ApiError.notFound('Office network entry not found');
  await network.destroy();
};

module.exports = { listOfficeNetworks, createOfficeNetwork, updateOfficeNetwork, deleteOfficeNetwork };
