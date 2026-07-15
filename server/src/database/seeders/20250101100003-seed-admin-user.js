'use strict';
const { randomUUID } = require('crypto');
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    const [roles] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE name = 'Administrator' LIMIT 1;`
    );
    if (!roles.length) {
      throw new Error('Administrator role not found - run the roles seeder first.');
    }
    const hashedPassword = await bcrypt.hash('Admin@12345', 12);

    await queryInterface.bulkInsert('users', [
      {
        id: randomUUID(),
        firstName: 'System',
        lastName: 'Administrator',
        email: 'admin@bigfive.com',
        password: hashedPassword,
        roleId: roles[0].id,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);
  },
  down: async (queryInterface) =>
    queryInterface.bulkDelete('users', { email: 'admin@bigfive.com' }, {}),
};
