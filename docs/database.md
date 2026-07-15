# Database Documentation

## ER Diagram

```mermaid
erDiagram
    ROLES ||--o{ USERS : has
    USERS ||--o{ AUDIT_LOGS : performs
    USERS ||--o{ PAYROLLS : processes
    DEPARTMENTS ||--o{ EMPLOYEES : contains
    EMPLOYEES ||--o{ PAYROLLS : has
    EMPLOYEES ||--o{ EMPLOYEE_ALLOWANCES : has
    EMPLOYEES ||--o{ EMPLOYEE_DEDUCTIONS : has
    EMPLOYEES ||--o{ PAYSLIPS : owns
    ALLOWANCES ||--o{ EMPLOYEE_ALLOWANCES : "assigned via"
    DEDUCTIONS ||--o{ EMPLOYEE_DEDUCTIONS : "assigned via"
    PAYROLLS ||--o{ PAYROLL_ITEMS : contains
    PAYROLLS ||--|| PAYSLIPS : generates

    ROLES {
        uuid id PK
        string name
        string description
    }
    USERS {
        uuid id PK
        string firstName
        string lastName
        string email
        string password
        uuid roleId FK
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

## Statutory Calculations (illustrative defaults)

- **NAPSA**: 5% of basic salary, capped at a monthly ceiling (`NAPSA_CEILING` in `config/constants.js`)
- **NHIMA**: 1% of gross pay
- **PAYE**: progressive bands stored in `tax_rates`, seeded with placeholder Zambian-style bands

> These are configurable, illustrative defaults — verify current ZRA/NAPSA/NHIMA rates before using in a real payroll run, and update the `tax_rates` table (or seed data) accordingly.
