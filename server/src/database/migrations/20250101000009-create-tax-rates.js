'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tax_rates', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      bandName: { type: Sequelize.STRING(50), allowNull: false },
      minAmount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      maxAmount: { type: Sequelize.DECIMAL(12, 2) },
      rate: { type: Sequelize.DECIMAL(5, 4), allowNull: false },
      effectiveFrom: { type: Sequelize.DATEONLY, allowNull: false },
      effectiveTo: { type: Sequelize.DATEONLY },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('tax_rates', ['isActive']);
  },
  down: async (queryInterface) => queryInterface.dropTable('tax_rates'),
};
