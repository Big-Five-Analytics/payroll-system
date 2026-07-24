# API Reference

Base URL: `http://localhost:5000/api`

All protected routes require `Authorization: Bearer <accessToken>`.
All responses follow this shape:
```json
{ "success": true, "statusCode": 200, "message": "...", "data": {} }
```

## Auth

| Method | URL | Purpose | Body | Roles |
|---|---|---|---|---|
| POST | `/auth/login` | Log in | `{ email, password }` | Public |
| POST | `/auth/refresh` | Get a new access token from the refresh cookie | - | Public (cookie required) |
| POST | `/auth/logout` | Invalidate refresh token | - | Authenticated |
| GET | `/auth/me` | Get current user | - | Authenticated |
| POST | `/auth/change-password` | Change own password | `{ currentPassword, newPassword }` | Authenticated |

## Employees

| Method | URL | Purpose | Roles |
|---|---|---|---|
| GET | `/employees?search=&departmentId=&status=&page=&limit=&includeTerminated=` | List/search employees - **excludes terminated staff by default** | Admin, HR, Finance |
| GET | `/employees/without-account` | List active employees with no linked user login (for linking any new user account, any role) | Admin |
| GET | `/employees/terminated?page=&limit=` | List the terminated-employee archive | Admin, HR |
| GET | `/employees/:id` | Get one employee | Admin, HR, Finance |
| POST | `/employees` | Create employee | Admin, HR |
| PUT | `/employees/:id` | Update employee | Admin, HR |
| DELETE | `/employees/:id` | Terminate employee - body: `{ reason? }` | Admin, HR |
| POST | `/employees/:id/allowances` | Assign/update an allowance `{ allowanceId, amount }` | Admin, HR |
| POST | `/employees/:id/deductions` | Assign/update a deduction `{ deductionId, amount }` | Admin, HR |

**Termination (`DELETE /employees/:id`):** writes a snapshot to the `terminated_employees` archive
table, deactivates any linked user login, and sets the employee's `status` to `terminated`. The
`employees` row itself is **not** deleted - historical Payroll/Payslip/LeaveApplication/SalaryAdvance
records reference it via foreign key, and removing it would either orphan or cascade-delete that
history. Excluding terminated staff from headcount and directory listings is handled at the query
level instead (default `GET /employees` and the dashboard's employee count both filter them out).

**Errors:** `400` — validation failure, or employee already terminated · `404` not found · `409` duplicate email/national ID

Note: the full employee directory (`GET /employees`, `GET /employees/:id`) is a staff-only function.
Employee-role (and any employee-linked staff) accounts see their own record indirectly, through the
leave/advance/payslip self-service endpoints below.

## Departments

| Method | URL | Purpose | Roles |
|---|---|---|---|
| GET | `/departments` | List departments | Any authenticated |
| POST | `/departments` | Create `{ name, description }` | Admin, HR |
| PUT | `/departments/:id` | Update | Admin, HR |
| DELETE | `/departments/:id` | Delete - **blocked with `400` if any employees are currently assigned** | Admin, HR |

## Payroll

| Method | URL | Purpose | Body | Roles |
|---|---|---|---|---|
| POST | `/payroll/generate` | Run payroll for a period | `{ month, year, employeeIds? }` | Admin, Finance |
| GET | `/payroll?month=&year=&status=&page=` | List payroll records | - | Any authenticated |
| GET | `/payroll/:id` | Get one payroll record with line items | - | Any authenticated |
| PATCH | `/payroll/:id/approve` | Approve a processed payroll | - | Admin, Finance |
| PATCH | `/payroll/:id/mark-paid` | Mark an approved payroll as paid | - | Admin, Finance |

**Errors:** `400` — e.g. no active tax bands configured, invalid status transition · `404` not found

**Calculation method (ZRA):**
```
grossPay      = basicSalary + all allowances
NAPSA         = 5% of grossPay
NHIMA         = 1% of basicSalary
taxableIncome = grossPay - NAPSA - NHIMA
PAYE          = progressive tax on taxableIncome, per the active tax_rates bands
netPay        = grossPay - PAYE - NAPSA - NHIMA - other deductions - salary advance recovery
```
Any employee with an **approved, not-yet-recovered** salary advance automatically has the full
amount deducted as a one-time line item on their next payroll run - see Salary Advance Applications
below. This happens inside the same transaction as payroll generation, so it can never be applied twice.

## Payslips

| Method | URL | Purpose | Roles |
|---|---|---|---|
| POST | `/payslips/generate/:payrollId` | Generate PDF payslip for a payroll record | Admin, Finance |
| GET | `/payslips/my` | The logged-in account's own payslips — **only for periods already marked `paid`** | Any account with a linked employee record |
| GET | `/payslips/employee/:employeeId` | Look up any employee's payslips, any status | Admin, HR, Finance |
| GET | `/payslips/:id` | Get payslip metadata | Any authenticated (ownership + paid-status enforced for the Employee role) |
| GET | `/payslips/:id/download` | Download the PDF (binary) | Any authenticated (ownership + paid-status enforced for the Employee role) |

A pure Employee-role account can only reach `/payslips/:id` and `/payslips/:id/download` for their
own payslips, and only once the underlying payroll record has status `paid` — otherwise `403`.
Staff roles (Admin/HR/Finance) can access any employee's payslips regardless of pay status.

## Reports

| Method | URL | Purpose | Roles |
|---|---|---|---|
| GET | `/reports/monthly-summary?month=&year=` | Aggregate totals + department breakdown | Admin, Finance, HR |
| GET | `/reports/employee/:employeeId/history` | Full payroll history for one employee | Admin, Finance, HR |
| GET | `/reports/export/csv?month=&year=` | Download CSV of that period's payroll | Admin, Finance, HR |
| GET | `/reports/export/bank-file?month=&year=` | Download an `.xlsx` bank payment batch (employee number, name, bank name, account number, net pay) for `approved`/`paid` records that period | Admin, Finance |

`export/bank-file` returns `400` if any included employee is missing `bankName` or
`bankAccountNumber` - update their record before generating the file for that period.

## Dashboard

| Method | URL | Purpose | Roles |
|---|---|---|---|
| GET | `/dashboard/stats` | Employee counts (excludes terminated), current month totals, department chart data | Any authenticated |

## Users & Roles (Administration)

| Method | URL | Purpose | Roles |
|---|---|---|---|
| GET | `/users` | List system users (includes linked employee, if any) | Admin |
| GET | `/users/roles` | List roles | Admin |
| POST | `/users` | Create a system user | Admin |
| PUT | `/users/:id` | Update a user | Admin |
| PATCH | `/users/:id/deactivate` | Deactivate a user | Admin |
| PATCH | `/users/:id/reactivate` | Reactivate a user | Admin |

**`POST /users` body:** `{ firstName, lastName, email, roleId, employeeId? }`
- No `password` field — the server generates a random default password and returns it **once** in the response as `data.defaultPassword`. It cannot be retrieved again after this call.
- `employeeId` is **required** when `roleId` refers to the `Employee` role. It's **optional** for every other role too — HR Officers, Finance Officers, and Admins are frequently employees of the company as well, and linking their account gives them the same self-service access (leave, salary advances, payslips) alongside their staff privileges. Must reference an employee from `GET /employees/without-account`.
- The created user has `mustChangePassword: true`; the frontend shows a reminder banner (not a hard block) until they change it via `POST /auth/change-password`, which clears the flag.

**Errors:** `400` — Employee role selected without an `employeeId`, or the referenced employee doesn't exist · `409` — email already in use, or the target employee already has a linked account

## Leave Applications

| Method | URL | Purpose | Body | Roles |
|---|---|---|---|---|
| POST | `/leave` | Apply for leave (own record) | `{ leaveType, startDate, endDate, reason }` | Any account with a linked employee record |
| GET | `/leave/my` | List own leave applications | - | Any account with a linked employee record |
| GET | `/leave?status=&page=&limit=` | List all leave applications | - | Admin, HR |
| PATCH | `/leave/:id/review` | Approve/reject | `{ status: "approved"|"rejected", reviewComment? }` | Admin, HR |

`leaveType` is one of: `annual`, `sick`, `maternity`, `paternity`, `unpaid`, `compassionate`, `other`.
`numberOfDays` is computed server-side (inclusive of both start and end date). Self-service isn't
gated by the `Employee` role specifically - any account with `employeeId` set can apply, including
HR/Finance/Admin staff who are also employees. A reviewer cannot approve/reject their own application.

**Errors:** `400` — end date before start date, or application already reviewed · `403` — account not linked to an employee record, or reviewing your own application

## Salary Advance Applications

| Method | URL | Purpose | Body | Roles |
|---|---|---|---|---|
| POST | `/salary-advances` | Request a salary advance (own record) | `{ amountRequested, reason }` | Any account with a linked employee record |
| GET | `/salary-advances/my` | List own requests (includes `recovered` status) | - | Any account with a linked employee record |
| GET | `/salary-advances?status=&page=&limit=` | List all requests | - | Admin, Finance |
| PATCH | `/salary-advances/:id/review` | Approve/reject | `{ status: "approved"|"rejected", reviewComment? }` | Admin, Finance |

**Recovery is automatic.** Approving a request does not touch payroll immediately - instead, the
next time payroll is generated for that employee, the payroll engine finds any `approved` +
`recovered: false` advances, deducts the full amount as a one-time "Salary Advance Recovery" line
item, and sets `recovered: true` + `recoveredInPayrollId`. It is never re-applied on a later run.
Employees can check `recovered` via `GET /salary-advances/my` to see whether their approved advance
has been deducted yet.

**Errors:** `400` — application already reviewed · `403` — account not linked to an employee record, or reviewing your own application

## Audit Logs

| Method | URL | Purpose | Roles |
|---|---|---|---|
| GET | `/audit-logs?action=&entityType=&page=` | Paginated audit trail | Admin |
