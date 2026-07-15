'use strict';
// Example progressive PAYE bands (illustrative - verify against current ZRA rates
// before using in a real payroll run, these change periodically via the Budget).
const { randomUUID } = require('crypto');

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    const effectiveFrom = '2025-01-01';

    await queryInterface.bulkInsert('tax_rates', [
      { id: randomUUID(), bandName: 'Band 1 (0%)', minAmount: 0, maxAmount: 5100, rate: 0, effectiveFrom, isActive: true, createdAt: now, updatedAt: now },
      { id: randomUUID(), bandName: 'Band 2 (20%)', minAmount: 5100.01, maxAmount: 7100, rate: 0.20, effectiveFrom, isActive: true, createdAt: now, updatedAt: now },
      { id: randomUUID(), bandName: 'Band 3 (30%)', minAmount: 7100.01, maxAmount: 9200, rate: 0.30, effectiveFrom, isActive: true, createdAt: now, updatedAt: now },
      { id: randomUUID(), bandName: 'Band 4 (37%)', minAmount: 9200.01, maxAmount: null, rate: 0.37, effectiveFrom, isActive: true, createdAt: now, updatedAt: now },
    ]);
  },
  down: async (queryInterface) => queryInterface.bulkDelete('tax_rates', null, {}),
};
