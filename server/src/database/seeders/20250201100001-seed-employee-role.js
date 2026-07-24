'use strict';
const { randomUUID } = require('crypto');

module.exports = {
  up: async (queryInterface) => {
    const [existing] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE name = 'Employee' LIMIT 1;`
    );
    if (existing.length) return; // already seeded

    const now = new Date();
    await queryInterface.bulkInsert('roles', [
      { id: randomUUID(), name: 'Employee', description: 'Self-service access: leave, salary advances, payslips', createdAt: now, updatedAt: now },
    ]);
  },
  down: async (queryInterface) => queryInterface.bulkDelete('roles', { name: 'Employee' }, {}),
};
