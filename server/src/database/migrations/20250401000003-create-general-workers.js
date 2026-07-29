'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('general_workers', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      fullName: { type: Sequelize.STRING(150), allowNull: false },
      site: { type: Sequelize.STRING(100), allowNull: false },
      nationalId: { type: Sequelize.STRING(30), allowNull: true, unique: true },
      workerNumber: { type: Sequelize.STRING(30), allowNull: true },
      jobTitle: { type: Sequelize.STRING(100), allowNull: true },
      payRate: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
      payRateType: { type: Sequelize.ENUM('daily', 'monthly'), allowNull: true },
      phone: { type: Sequelize.STRING(20), allowNull: true },
      nextOfKinName: { type: Sequelize.STRING(150), allowNull: true },
      nextOfKinPhone: { type: Sequelize.STRING(20), allowNull: true },
      contractStartDate: { type: Sequelize.DATEONLY, allowNull: true },
      contractEndDate: { type: Sequelize.DATEONLY, allowNull: true },
      leaveBalance: { type: Sequelize.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
      status: { type: Sequelize.ENUM('active', 'inactive'), allowNull: false, defaultValue: 'active' },
      sourceFileName: { type: Sequelize.STRING(255), allowNull: true },
      lastUploadedAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex('general_workers', ['site']);
    await queryInterface.addIndex('general_workers', ['contractEndDate']);
    await queryInterface.addIndex('general_workers', ['site', 'workerNumber'], {
      unique: true,
      name: 'general_workers_site_worker_number_unique',
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('general_workers');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_general_workers_payRateType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_general_workers_status";');
  },
};
