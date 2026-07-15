'use strict';
const { randomUUID } = require('crypto');

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    await queryInterface.bulkInsert('departments', [
      { id: randomUUID(), name: 'Finance', description: 'Finance and Accounting', createdAt: now, updatedAt: now },
      { id: randomUUID(), name: 'Human Resources', description: 'HR and People Operations', createdAt: now, updatedAt: now },
      { id: randomUUID(), name: 'Investments', description: 'Investment Management', createdAt: now, updatedAt: now },
      { id: randomUUID(), name: 'IT', description: 'Information Technology', createdAt: now, updatedAt: now },
      { id: randomUUID(), name: 'Administration', description: 'General Administration', createdAt: now, updatedAt: now },
    ]);
  },
  down: async (queryInterface) => queryInterface.bulkDelete('departments', null, {}),
};
