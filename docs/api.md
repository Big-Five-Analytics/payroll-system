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
| GET | `/employees?search=&departmentId=&status=&page=&limit=` | List/search employees | Any authenticated |
| GET | `/employees/:id` | Get one employee | Any authenticated |
| POST | `/employees` | Create employee | Admin, HR |
| PUT | `/employees/:id` | Update employee | Admin, HR |
| DELETE | `/employees/:id` | Terminate employee (soft delete) | Admin, HR |
| POST | `/employees/:id/allowances` | Assign/update an allowance `{ allowanceId, amount }` | Admin, HR |
| POST | `/employees/:id/deductions` | Assign/update a deduction `{ deductionId, amount }` | Admin, HR |

**Errors:** `400` validation failure · `404` not found · `409` duplicate email/national ID

## Departments

| Method | URL | Purpose | Roles |
|---|---|---|---|
| GET | `/departments` | List departments | Any authenticated |
| POST | `/departments` | Create `{ name, description }` | Admin, HR |
| PUT | `/departments/:id` | Update | Admin, HR |
| DELETE | `/departments/:id` | Delete (blocked if employees assigned) | Admin, HR |

## Payroll

| Method | URL | Purpose | Body | Roles |
|---|---|---|---|---|
| POST | `/payroll/generate` | Run payroll for a period | `{ month, year, employeeIds? }` | Admin, Finance |
| GET | `/payroll?month=&year=&status=&page=` | List payroll records | - | Any authenticated |
| GET | `/payroll/:id` | Get one payroll record with line items | - | Any authenticated |
| PATCH | `/payroll/:id/approve` | Approve a processed payroll | - | Admin, Finance |
| PATCH | `/payroll/:id/mark-paid` | Mark an approved payroll as paid | - | Admin, Finance |

**Errors:** `400` — e.g. no active tax bands configured, invalid status transition · `404` not found

## Payslips

| Method | URL | Purpose | Roles |
|---|---|---|---|
| POST | `/payslips/generate/:payrollId` | Generate PDF payslip for a payroll record | Admin, Finance |
| GET | `/payslips/:id` | Get payslip metadata | Any authenticated |
| GET | `/payslips/:id/download` | Download the PDF (binary) | Any authenticated |
| GET | `/payslips/employee/:employeeId` | List an employee's payslips | Any authenticated |

## Reports

| Method | URL | Purpose | Roles |
|---|---|---|---|
| GET | `/reports/monthly-summary?month=&year=` | Aggregate totals + department breakdown | Admin, Finance, HR |
| GET | `/reports/employee/:employeeId/history` | Full payroll history for one employee | Admin, Finance, HR |
| GET | `/reports/export/csv?month=&year=` | Download CSV of that period's payroll | Admin, Finance, HR |

## Dashboard

| Method | URL | Purpose | Roles |
|---|---|---|---|
| GET | `/dashboard/stats` | Employee counts, current month totals, department chart data | Any authenticated |

## Users & Roles (Administration)

| Method | URL | Purpose | Roles |
|---|---|---|---|
| GET | `/users` | List system users | Admin |
| GET | `/users/roles` | List roles | Admin |
| POST | `/users` | Create a system user | Admin |
| PUT | `/users/:id` | Update a user | Admin |
| PATCH | `/users/:id/deactivate` | Deactivate a user | Admin |
| PATCH | `/users/:id/reactivate` | Reactivate a user | Admin |

## Audit Logs

| Method | URL | Purpose | Roles |
|---|---|---|---|
| GET | `/audit-logs?action=&entityType=&page=` | Paginated audit trail | Admin |
