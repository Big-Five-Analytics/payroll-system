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

  // Standard work hours for the attendance log book - clock-ins after WORK_START and
  // clock-outs after WORK_END are flagged as late / overtime respectively. Computed
  // against the server's local time, so the server should run in Africa/Lusaka (or the
  // deployment should otherwise account for timezone) for these to be meaningful.
  WORK_START_HOUR: 8,  // 08:00
  WORK_END_HOUR: 17,   // 17:00

  ATTENDANCE_ACTIONS: {
    CLOCK_IN: 'CLOCK_IN',
    CLOCK_OUT: 'CLOCK_OUT',
  },

  GENERAL_WORKER_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
  },

  PAY_RATE_TYPE: {
    HOURLY: 'hourly',
    DAILY: 'daily',
    MONTHLY: 'monthly',
  },

  REPAYMENT_PLANS: {
    FULL: 'full',
    TWO_MONTHS: 'two_months',
    THREE_MONTHS: 'three_months',
  },

  NOTIFICATION_TYPES: {
    LEAVE_STATUS: 'leave_status',
    SALARY_ADVANCE_STATUS: 'salary_advance_status',
    PAYSLIP_READY: 'payslip_ready',
  },

  // Zambian statutory rates - see server/src/utils/payrollCalculator.js for how these are applied
  NAPSA_RATE: 0.05, // 5% of gross earnings (basic salary + all allowances)
  // NAPSA ceiling is the statutory pensionable-earnings cap, revised annually by NAPSA
  // in line with National Average Earnings. Currently K37,236/month effective 1 Jan 2026,
  // capping the employee contribution at K1,861.80. Update this when NAPSA issues a new notice.
  NAPSA_CEILING: 37236,
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
    CLOCK_IN: 'CLOCK_IN',
    CLOCK_OUT: 'CLOCK_OUT',
    BULK_UPLOAD: 'BULK_UPLOAD',
  },
};
