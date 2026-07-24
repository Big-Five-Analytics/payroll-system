// Central place for enums / fixed values used across the app.
// Keeping these here avoids "magic strings" scattered through controllers/services.

module.exports = {
  ROLES: {
    ADMIN: 'Administrator',
    HR: 'HR Officer',
    FINANCE: 'Finance Officer',
    EMPLOYEE: 'Employee',
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

  REQUEST_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
  },

  LEAVE_TYPES: ['annual', 'sick', 'maternity', 'paternity', 'unpaid', 'compassionate', 'other'],

  // Zambian statutory rates - see server/src/utils/payrollCalculator.js for how these are applied
  NAPSA_RATE: 0.05, // 5% of gross earnings (basic salary + all allowances)
  NHIMA_RATE: 0.01, // 1% of basic salary only

  AUDIT_ACTIONS: {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    PAYROLL_RUN: 'PAYROLL_RUN',
    APPROVE: 'APPROVE',
    REJECT: 'REJECT',
  },
};
