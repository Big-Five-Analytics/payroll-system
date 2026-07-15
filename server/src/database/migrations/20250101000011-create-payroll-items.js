'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payroll_items', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      payrollId: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'payrolls', key: 'id' }, onDelete: 'CASCADE',
      },
      type: { type: Sequelize.ENUM('allowance', 'deduction', 'statutory'), allowNull: false },
      label: { type: Sequelize.STRING(100), allowNull: false },
      amount: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('payroll_items', ['payrollId']);
  },
  down: async (queryInterface) => queryInterface.dropTable('payroll_items'),
};
