'use strict';
// Seeds a "Local Development" entry covering localhost so the attendance feature is
// testable out of the box. Replace/deactivate this and add your real office IP or CIDR
// range (ask your ISP/network admin for the office's public IP, or the internal range if
// clocking in over a VPN) before using this in production - otherwise nobody outside
// localhost will be able to clock in.
const { randomUUID } = require('crypto');

module.exports = {
  up: async (queryInterface) => {
    const now = new Date();
    await queryInterface.bulkInsert('office_networks', [
      { id: randomUUID(), label: 'Local Development (localhost)', ipRange: '127.0.0.1', isActive: true, createdAt: now, updatedAt: now },
      { id: randomUUID(), label: 'Local Development (IPv6 localhost)', ipRange: '::1', isActive: true, createdAt: now, updatedAt: now },
    ]);
  },
  down: async (queryInterface) => queryInterface.bulkDelete('office_networks', null, {}),
};
