'use strict';
const { randomUUID } = require('crypto');

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    await queryInterface.bulkInsert('roles', [
      { id: randomUUID(), name: 'Administrator', description: 'Full system access', createdAt: now, updatedAt: now },
      { id: randomUUID(), name: 'HR Officer', description: 'Manages employees and departments', createdAt: now, updatedAt: now },
      { id: randomUUID(), name: 'Finance Officer', description: 'Processes payroll and reports', createdAt: now, updatedAt: now },
    ]);
  },
  down: async (queryInterface) => queryInterface.bulkDelete('roles', null, {}),
};
