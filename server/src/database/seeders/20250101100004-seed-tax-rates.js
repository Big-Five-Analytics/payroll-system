'use strict';
// 2025 ZRA PAYE bands (monthly), per ZRA's published tax structure:
//   0%  on income up to K5,100
//   25% on income from K5,101 to K9,200
//   30% on income from K9,201 to K18,000
//   37% on income above K18,000
const { randomUUID } = require('crypto');

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    const effectiveFrom = '2025-01-01';

    await queryInterface.bulkInsert('tax_rates', [
      { id: randomUUID(), bandName: 'Band 1 (0%)', minAmount: 0, maxAmount: 5100, rate: 0, effectiveFrom, isActive: true, createdAt: now, updatedAt: now },
      { id: randomUUID(), bandName: 'Band 2 (25%)', minAmount: 5100.01, maxAmount: 9200, rate: 0.25, effectiveFrom, isActive: true, createdAt: now, updatedAt: now },
      { id: randomUUID(), bandName: 'Band 3 (30%)', minAmount: 9200.01, maxAmount: 18000, rate: 0.30, effectiveFrom, isActive: true, createdAt: now, updatedAt: now },
      { id: randomUUID(), bandName: 'Band 4 (37%)', minAmount: 18000.01, maxAmount: null, rate: 0.37, effectiveFrom, isActive: true, createdAt: now, updatedAt: now },
    ]);
  },
  down: async (queryInterface) => queryInterface.bulkDelete('tax_rates', null, {}),
};
