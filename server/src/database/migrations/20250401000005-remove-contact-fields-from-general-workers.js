'use strict';
module.exports = {
  up: async (queryInterface) => {
    await queryInterface.removeColumn('general_workers', 'nationalId');
    await queryInterface.removeColumn('general_workers', 'workerNumber');
    await queryInterface.removeColumn('general_workers', 'phone');
    await queryInterface.removeColumn('general_workers', 'nextOfKinName');
    await queryInterface.removeColumn('general_workers', 'nextOfKinPhone');
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('general_workers', 'nationalId', { type: Sequelize.STRING(30), allowNull: true, unique: true });
    await queryInterface.addColumn('general_workers', 'workerNumber', { type: Sequelize.STRING(30), allowNull: true });
    await queryInterface.addColumn('general_workers', 'phone', { type: Sequelize.STRING(20), allowNull: true });
    await queryInterface.addColumn('general_workers', 'nextOfKinName', { type: Sequelize.STRING(150), allowNull: true });
    await queryInterface.addColumn('general_workers', 'nextOfKinPhone', { type: Sequelize.STRING(20), allowNull: true });
    await queryInterface.addIndex('general_workers', ['site', 'workerNumber'], {
      unique: true,
      name: 'general_workers_site_worker_number_unique',
    });
  },
};
