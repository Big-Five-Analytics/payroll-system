// Central place for enums / fixed values used across the app.
// Keeping these here avoids "magic strings" scattered through controllers/services.

module.exports = {
  ROLES: {
    ADMIN: 'Administrator',
    HR: 'HR Officer',
    FINANCE: 'Finance Officer',
  },

  PAYROLL_STATUS: {
    DRAFT: 'draft',
    PROCESSED: 'processed',
    APPROVED: 'approved',
    PAID: 'paid',
  },

  EMPLOYMENT_STATUS: {
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    TERMINATED: 'terminated',
  },

  // Zambian statutory rates - configurable via TaxRates table, these are fallback defaults
  NAPSA_RATE: 0.05,       // 5% employee contribution
  NAPSA_CEILING: 1451.10, // monthly ceiling (example figure, verify against current NAPSA regs)
  NHIMA_RATE: 0.01,       // 1% employee contribution

  AUDIT_ACTIONS: {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    PAYROLL_RUN: 'PAYROLL_RUN',
  },
};
