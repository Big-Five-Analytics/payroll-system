'use strict';
const { randomUUID } = require('crypto');

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    await queryInterface.bulkInsert('allowances', [
      { id: randomUUID(), name: 'Housing Allowance', isTaxable: true, description: 'Monthly housing allowance', createdAt: now, updatedAt: now },
      { id: randomUUID(), name: 'Transport Allowance', isTaxable: true, description: 'Monthly transport allowance', createdAt: now, updatedAt: now },
      { id: randomUUID(), name: 'Medical Allowance', isTaxable: false, description: 'Medical cover contribution', createdAt: now, updatedAt: now },
      { id: randomUUID(), name: 'Airtime Allowance', isTaxable: true, description: 'Communication allowance', createdAt: now, updatedAt: now },
    ]);

    await queryInterface.bulkInsert('deductions', [
      { id: randomUUID(), name: 'Staff Loan Repayment', description: 'Deduction for staff loan installments', createdAt: now, updatedAt: now },
      { id: randomUUID(), name: 'Union Dues', description: 'Monthly union membership dues', createdAt: now, updatedAt: now },
      { id: randomUUID(), name: 'Salary Advance Recovery', description: 'Recovery of salary advance', createdAt: now, updatedAt: now },
    ]);
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('allowances', null, {});
    await queryInterface.bulkDelete('deductions', null, {});
  },
};
