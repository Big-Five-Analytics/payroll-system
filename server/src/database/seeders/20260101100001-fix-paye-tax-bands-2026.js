'use strict';
// Corrected ZRA PAYE bands (monthly), replacing the ones seeded in
// 20250101100004-seed-tax-rates.js which did not match ZRA's published structure
// (that seeder used 25%/30%/37% at 5,100/9,200/18,000 - a mismatched set of bands).
//
// Current ZRA monthly PAYE bands (as published, effective 2026):
//   0%   on income up to K5,100
//   20%  on income from K5,100.01 to K7,100
//   30%  on income from K7,100.01 to K9,200
//   37%  on income above K9,200
//
// Deactivates the old (incorrect) bands rather than deleting them, preserving the
// TaxRate model's effectiveFrom/isActive versioning so historical payroll runs that
// used the old bands remain auditable.
const { randomUUID } = require('crypto');

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    const effectiveFrom = '2026-01-01';

    await queryInterface.bulkUpdate(
      'tax_rates',
      { isActive: false, effectiveTo: effectiveFrom, updatedAt: now },
      { isActive: true }
    );

    await queryInterface.bulkInsert('tax_rates', [
      { id: randomUUID(), bandName: 'Band 1 (0%)', minAmount: 0, maxAmount: 5100, rate: 0, effectiveFrom, isActive: true, createdAt: now, updatedAt: now },
      { id: randomUUID(), bandName: 'Band 2 (20%)', minAmount: 5100.01, maxAmount: 7100, rate: 0.20, effectiveFrom, isActive: true, createdAt: now, updatedAt: now },
      { id: randomUUID(), bandName: 'Band 3 (30%)', minAmount: 7100.01, maxAmount: 9200, rate: 0.30, effectiveFrom, isActive: true, createdAt: now, updatedAt: now },
      { id: randomUUID(), bandName: 'Band 4 (37%)', minAmount: 9200.01, maxAmount: null, rate: 0.37, effectiveFrom, isActive: true, createdAt: now, updatedAt: now },
    ]);
  },
  down: async (queryInterface) => {
    const effectiveFrom = '2026-01-01';
    await queryInterface.bulkDelete('tax_rates', { effectiveFrom });
    await queryInterface.bulkUpdate(
      'tax_rates',
      { isActive: true, effectiveTo: null },
      { effectiveFrom: '2025-01-01' }
    );
  },
};
