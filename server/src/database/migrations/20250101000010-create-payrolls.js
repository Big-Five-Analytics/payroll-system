'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('payrolls', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      employeeId: {
        type: Sequelize.UUID, allowNull: false,
        references: { model: 'employees', key: 'id' }, onDelete: 'RESTRICT',
      },
      payPeriodMonth: { type: Sequelize.INTEGER, allowNull: false },
      payPeriodYear: { type: Sequelize.INTEGER, allowNull: false },
      basicSalary: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      totalAllowances: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      grossPay: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      payeTax: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      napsaContribution: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      nhimaContribution: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      otherDeductions: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      totalDeductions: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      netPay: { type: Sequelize.DECIMAL(12, 2), allowNull: false },
      status: {
        type: Sequelize.ENUM('draft', 'processed', 'approved', 'paid'),
        defaultValue: 'draft',
      },
      processedBy: {
        type: Sequelize.UUID, allowNull: true,
        references: { model: 'users', key: 'id' }, onDelete: 'SET NULL',
      },
      processedAt: { type: Sequelize.DATE },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex('payrolls', ['employeeId', 'payPeriodMonth', 'payPeriodYear'], { unique: true });
    await queryInterface.addIndex('payrolls', ['payPeriodYear', 'payPeriodMonth']);
    await queryInterface.addIndex('payrolls', ['status']);
  },
  down: async (queryInterface) => queryInterface.dropTable('payrolls'),
};
