# Database Documentation

## ER Diagram

```mermaid
erDiagram
    ROLES ||--o{ USERS : has
    USERS ||--o{ AUDIT_LOGS : performs
    USERS ||--o{ PAYROLLS : processes
    USERS ||--o{ LEAVE_APPLICATIONS : reviews
    USERS ||--o{ SALARY_ADVANCE_APPLICATIONS : reviews
    DEPARTMENTS ||--o{ EMPLOYEES : contains
    EMPLOYEES ||--o| USERS : "has login (Employee role)"
    EMPLOYEES ||--o{ PAYROLLS : has
    EMPLOYEES ||--o{ EMPLOYEE_ALLOWANCES : has
    EMPLOYEES ||--o{ EMPLOYEE_DEDUCTIONS : has
    EMPLOYEES ||--o{ PAYSLIPS : owns
    EMPLOYEES ||--o{ LEAVE_APPLICATIONS : submits
    EMPLOYEES ||--o{ SALARY_ADVANCE_APPLICATIONS : submits
    EMPLOYEES ||--o| TERMINATED_EMPLOYEES : "archived on termination"
    EMPLOYEES ||--o{ ATTENDANCE_LOGS : "clocks in/out"
    ALLOWANCES ||--o{ EMPLOYEE_ALLOWANCES : "assigned via"
    DEDUCTIONS ||--o{ EMPLOYEE_DEDUCTIONS : "assigned via"
    PAYROLLS ||--o{ PAYROLL_ITEMS : contains
    PAYROLLS ||--|| PAYSLIPS : generates

    ROLES {
        uuid id PK
        string name "Administrator | HR Officer | Finance Officer | Employee"
        string description
    }
    USERS {
        uuid id PK
        string firstName
        string lastName
        string email
        string password
        uuid roleId FK
        uuid employeeId FK "nullable, set for Employee-role accounts"
        boolean mustChangePassword
        boolean isActive
    }
    DEPARTMENTS {
        uuid id PK
        string name
        string description
    }
    EMPLOYEES {
        uuid id PK
        string employeeNumber
        string firstName
        string lastName
        string email
        string nationalId
        uuid departmentId FK
        string jobTitle
        decimal basicSalary
        string status
    }
    ALLOWANCES {
        uuid id PK
        string name
        boolean isTaxable
    }
    EMPLOYEE_ALLOWANCES {
        uuid id PK
        uuid employeeId FK
        uuid allowanceId FK
        decimal amount
    }
    DEDUCTIONS {
        uuid id PK
        string name
    }
    EMPLOYEE_DEDUCTIONS {
        uuid id PK
        uuid employeeId FK
        uuid deductionId FK
        decimal amount
    }
    TAX_RATES {
        uuid id PK
        string bandName
        decimal minAmount
        decimal maxAmount
        decimal rate
    }
    PAYROLLS {
        uuid id PK
        uuid employeeId FK
        int payPeriodMonth
        int payPeriodYear
        decimal grossPay
        decimal netPay
        string status
        uuid processedBy FK
    }
    PAYROLL_ITEMS {
        uuid id PK
        uuid payrollId FK
        string type
        string label
        decimal amount
    }
    PAYSLIPS {
        uuid id PK
        uuid payrollId FK
        uuid employeeId FK
        string payslipNumber
        string pdfPath
    }
    LEAVE_APPLICATIONS {
        uuid id PK
        uuid employeeId FK
        string leaveType
        date startDate
        date endDate
        int numberOfDays
        string status "pending | approved | rejected"
        uuid reviewedBy FK
    }
    SALARY_ADVANCE_APPLICATIONS {
        uuid id PK
        uuid employeeId FK
        decimal amountRequested
        string status "pending | approved | rejected"
        uuid reviewedBy FK
        boolean recovered "set true once deducted from a payroll run"
        uuid recoveredInPayrollId FK
    }
    TERMINATED_EMPLOYEES {
        uuid id PK
        uuid employeeId FK "points back to the original employees row"
        string employeeNumber
        string firstName
        string lastName
        date terminationDate
        decimal lastBasicSalary
        string reason
        uuid terminatedBy FK
    }
    ATTENDANCE_LOGS {
        uuid id PK
        uuid employeeId FK
        date logDate
        datetime clockInAt
        string clockInIp
        int lateMinutes
        datetime clockOutAt
        string clockOutIp
        int overtimeMinutes
    }
    OFFICE_NETWORKS {
        uuid id PK
        string label
        string ipRange "single IP or CIDR block"
        boolean isActive
    }
    AUDIT_LOGS {
        uuid id PK
        uuid userId FK
        string action
        string entityType
        uuid entityId
        jsonb details
    }
```

## Normalization Notes

- **Allowances/Deductions are catalogs**, separate from `EmployeeAllowance`/`EmployeeDeduction` join tables — this avoids repeating allowance names/tax rules on every employee row and lets HR add a new allowance type once, globally.
- **PayrollItem** stores a line-item snapshot at the moment payroll was run. Even if an employee's allowance amount changes later, historical payslips remain accurate because the amount was copied into `payroll_items`, not re-derived from `employee_allowances`.
- **TaxRate** is a versioned table (`effectiveFrom`/`effectiveTo`/`isActive`) so PAYE bands can change year to year without losing history of what rates applied to past payroll runs.
- **Payroll** has a unique composite index on `(employeeId, payPeriodMonth, payPeriodYear)` — the database itself prevents double-processing the same employee for the same period.
- **AuditLog** uses `entityType` + `entityId` as a generic polymorphic reference rather than a separate audit table per entity, since audit requirements are the same shape for every entity.
- **Users ↔ Employees is a nullable one-to-one, open to any role.** Any staff account (Admin/HR/Finance) can optionally link `employeeId` too — not just the `Employee` role — since HR/Finance/Admin staff are frequently employees of the company as well. Only the `Employee` role *requires* the link (an Employee-role account with no linked record couldn't do anything). The unique constraint on `users.employeeId` guarantees at most one login per employee — the API enforces this at creation time, not just the DB.
- **LeaveApplication/SalaryAdvanceApplication** intentionally mirror the same shape (`status`, `reviewedBy`, `reviewedAt`, `reviewComment`) even though they're reviewed by different roles (HR vs Finance) — kept as separate tables rather than one polymorphic "request" table because their domain-specific fields (`leaveType`/date range vs `amountRequested`) differ enough that a shared table would need a lot of nullable columns. `SalaryAdvanceApplication` additionally tracks `recovered`/`recoveredInPayrollId` so the payroll engine can automatically apply it exactly once as a payroll deduction.
- **TerminatedEmployee is an archive, not a replacement for the employees row.** Terminating an employee writes a snapshot here (for HR record-keeping) and flips `employees.status` to `terminated` - it does **not** delete the `employees` row. That row is still the foreign-key target for the employee's historical `Payroll`, `Payslip`, `LeaveApplication`, and `SalaryAdvanceApplication` records; deleting it would either be rejected (FK constraint) or cascade-delete years of payroll history, neither of which is acceptable for a payroll system. "Removed from the active list" is enforced at the query level instead - default employee listings and the dashboard headcount both filter out `status = 'terminated'`.
- **AttendanceLog is one row per employee per day**, not one row per clock action. Clock-in creates it, clock-out fills in the rest - this makes "did they clock out?" a single nullable-column check (`clockOutAt IS NULL`) instead of needing to pair up rows from an event-log table. `lateMinutes`/`overtimeMinutes` are computed once and stored (not derived on read), so a later change to the standard work-hours config doesn't rewrite history.
- **OfficeNetwork is deliberately a table, not an env var.** IP allowlisting needs to be editable by an Administrator without a redeploy (offices move, IPs change, a company might add a second location or a VPN range) - `isActive` lets an entry be disabled without losing the record of what it was.

## Statutory Calculations (ZRA method)

```
grossPay      = basicSalary + all allowances
NAPSA         = 5% of grossPay
NHIMA         = 1% of basicSalary
taxableIncome = grossPay - NAPSA - NHIMA
PAYE          = progressive tax on taxableIncome, per the active tax_rates bands
```

- **NAPSA**: 5% of gross earnings (basic + all allowances). No statutory ceiling is currently modeled - real NAPSA registration does apply one to pensionable earnings; add it back in `payrollCalculator.js` if your organization needs it.
- **NHIMA**: 1% of basic salary only (allowances are excluded from this one).
- **PAYE**: progressive bands stored in `tax_rates`, seeded with the 2025 ZRA bands: 0% to K5,100, 25% to K9,200, 30% to K18,000, 37% above.

> Verify current ZRA/NAPSA/NHIMA rates periodically — these change with government budget cycles — and update the `tax_rates` table (or seed data) accordingly. If you've already run the original seeders against a live database, re-seed `tax_rates` to pick up the corrected bands: `npx sequelize-cli db:seed:undo --seed 20250101100004-seed-tax-rates.js && npx sequelize-cli db:seed --seed 20250101100004-seed-tax-rates.js`.
