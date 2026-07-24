'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'mustChangePassword', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn('users', 'employeeId', {
      type: Sequelize.UUID,
      allowNull: true,
      unique: true,
      references: { model: 'employees', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'employeeId');
    await queryInterface.removeColumn('users', 'mustChangePassword');
  },
};
