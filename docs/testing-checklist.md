# Testing Checklist

Import `postman_collection.json` into Postman, then walk through this order (each step depends on the previous one's output — copy IDs from responses into the collection variables as you go).

## 1. Auth
- [ ] `POST /auth/login` with seeded admin credentials returns `200` + `accessToken` + user object
- [ ] `POST /auth/login` with wrong password returns `401`
- [ ] `GET /auth/me` without a token returns `401`
- [ ] `GET /auth/me` with a valid token returns the admin user
- [ ] Hit `/auth/login` 21 times quickly → the 21st returns `429` (rate limiter)

## 2. Departments
- [ ] `GET /departments` returns the 5 seeded departments
- [ ] `POST /departments` with a duplicate name returns `409`
- [ ] `POST /departments` with a new name returns `201`

## 3. Employees
- [ ] `POST /employees` with a valid payload returns `201` with an auto-generated `employeeNumber`
- [ ] `POST /employees` with a duplicate email/nationalId returns `409`
- [ ] `POST /employees` with a missing required field returns `400` with field-level errors
- [ ] `GET /employees?search=<name>` returns matching results
- [ ] `PUT /employees/:id` updates fields correctly
- [ ] `POST /employees/:id/allowances` assigns a Housing Allowance amount
- [ ] `DELETE /employees/:id` sets status to `terminated` rather than removing the row

## 4. Payroll Engine
- [ ] `POST /payroll/generate` with no active tax bands configured returns `400` (shouldn't happen if seeders ran, but worth knowing the error path)
- [ ] `POST /payroll/generate {month, year}` returns `201` with one `Payroll` record per active employee
- [ ] Running `generate` again for the same period returns `count: 0` — no duplicates created (verify the unique index is doing its job)
- [ ] Spot-check the math on one payroll record: `grossPay = basicSalary + allowances`, `netPay = grossPay - totalDeductions`
- [ ] `PATCH /payroll/:id/approve` on a `processed` record succeeds; on a `draft`/`paid` record returns `400`
- [ ] `PATCH /payroll/:id/mark-paid` only succeeds after `approve`

## 5. Payslips
- [ ] `POST /payslips/generate/:payrollId` returns `201` with a `payslipNumber` and creates a PDF under `server/storage/payslips/`
- [ ] `GET /payslips/:id/download` returns a valid PDF file (open it — check employee name, amounts match the payroll record)
- [ ] Calling `generate` twice for the same payroll returns the same payslip record, not a duplicate

## 6. Reports
- [ ] `GET /reports/monthly-summary` totals match the sum of individual payroll `netPay` values for that period
- [ ] `GET /reports/export/csv` downloads a valid CSV, openable in Excel/Sheets

## 7. Authorization
- [ ] Log in as a non-Admin role (create one via `/users` first) and confirm `/users` and `/admin/audit-logs` routes return `403`
- [ ] Confirm an HR Officer can manage employees but gets `403` on `/payroll/generate`
- [ ] Confirm a Finance Officer can run payroll but gets `403` on `POST /employees`

## 8. Audit Trail
- [ ] After logging in, creating an employee, and running payroll, `GET /audit-logs` shows `LOGIN`, `CREATE`, and `PAYROLL_RUN` entries with correct `userId`

## 9. Employee Self-Service Accounts
- [ ] `POST /users` with `roleId` = Employee and no `employeeId` returns `400`
- [ ] `POST /users` with `roleId` = Employee and a valid `employeeId` returns `201` with a `defaultPassword` in the response
- [ ] Creating a second Employee-role account for the same `employeeId` returns `409`
- [ ] `GET /employees/without-account` no longer lists an employee once they have a linked account
- [ ] Log in as the new Employee account with the default password — response includes `mustChangePassword: true`
- [ ] `POST /auth/change-password` succeeds and subsequent `GET /auth/me` shows `mustChangePassword: false`

## 10. Leave Applications
- [ ] Logged in as Employee: `POST /leave` with `endDate` before `startDate` returns `400`
- [ ] `POST /leave` with a valid range returns `201` with a correctly computed `numberOfDays`
- [ ] `GET /leave/my` shows only this employee's own applications
- [ ] Logged in as HR: `GET /leave?status=pending` shows the new application
- [ ] `PATCH /leave/:id/review {status: "approved"}` succeeds; reviewing the same application again returns `400`
- [ ] Logged in as Finance Officer: `GET /leave` returns `403` (not HR's domain)
- [ ] Logged in as Employee: `GET /leave` (the staff listing) returns `403`

## 11. Salary Advance Applications
- [ ] Logged in as Employee: `POST /salary-advances {amountRequested, reason}` returns `201`
- [ ] `GET /salary-advances/my` shows only this employee's own requests
- [ ] Logged in as Finance Officer: `GET /salary-advances?status=pending` shows it; `PATCH /salary-advances/:id/review` approves/rejects it
- [ ] Logged in as HR Officer: `GET /salary-advances` returns `403` (not HR's domain)

## 12. Employee Payslip Self-Service
- [ ] Logged in as Employee, before any payroll for them is marked `paid`: `GET /payslips/my` returns an empty list
- [ ] After Finance runs payroll → approves → marks paid → generates the payslip: `GET /payslips/my` now includes it
- [ ] `GET /payslips/:id/download` for that payslip succeeds for the owning employee
- [ ] A *different* Employee account requesting the same `/payslips/:id/download` gets `403`
- [ ] An Employee account requesting a payslip whose payroll is still `approved` (not yet `paid`) gets `403`

## 13. Corrected Tax Calculation
- [ ] For an employee with basic salary K10,000 and no allowances: NAPSA = K500 (5% of gross), NHIMA = K100 (1% of basic), taxable income = K9,400
- [ ] PAYE on K9,400 taxable income: K0 (first K5,100) + K1,025 (25% of the K4,100 from K5,100.01–K9,200) + K60 (30% of the remaining K200 from K9,200.01–K9,400) = **K1,085 total**
- [ ] Confirm the payslip PDF and payroll record both reflect this breakdown

## 14. Termination Archive
- [ ] `DELETE /employees/:id` with a linked Employee-role login: confirm that login can no longer authenticate afterward
- [ ] After termination, `GET /employees` (default) no longer includes them; `GET /employees/terminated` does
- [ ] Dashboard `employeeCount` decreases by one after termination
- [ ] Confirm the employee's historical payroll/payslip records are still retrievable (e.g. via `GET /reports/employee/:employeeId/history`) after termination
- [ ] Attempting to terminate the same employee twice returns `400`

## 15. HR/Finance as Employees
- [ ] Create an HR Officer or Finance Officer account and link it to an employee record via the optional dropdown
- [ ] Log in as that account: confirm both the staff sidebar links (Employees, Payroll, etc.) and self-service links (My Leave, My Payslips) appear
- [ ] Submit a leave application from that account, then confirm the *same* account gets `403` if it tries to review its own application
- [ ] Confirm that account is included in a payroll run like any other active employee

## 16. Auto-Linked Salary Advance Recovery
- [ ] Employee requests an advance, Finance approves it — confirm `GET /salary-advances/my` shows `recovered: false`
- [ ] Run payroll for that employee's next period — confirm a "Salary Advance Recovery" line item appears in `PayrollItem`, `netPay` is reduced by the full advance amount, and `GET /salary-advances/my` now shows `recovered: true` with `recoveredInPayrollId` set
- [ ] Run payroll again for a following period — confirm the advance is **not** deducted a second time

## 17. Bank Payment File Export
- [ ] `GET /reports/export/bank-file` for a period with an employee missing `bankName`/`bankAccountNumber` returns `400` naming them
- [ ] After filling in bank details, the same request downloads a valid `.xlsx` with one row per paid/approved employee and a total row
- [ ] Confirm HR Officer accounts get `403` on this endpoint (Admin/Finance only)

## 18. Department Deletion
- [ ] Deleting a department with employees currently assigned returns `400`
- [ ] Deleting an empty department succeeds and it disappears from the list

## 19. Attendance / Virtual Log Book
- [ ] With no office networks configured (or all inactive): `POST /attendance/clock-in` returns `403` with a "not configured yet" message
- [ ] Add an office network covering your test IP (or use the seeded `127.0.0.1`/`::1` for local dev) - clock-in now succeeds
- [ ] Clock in before 08:00 (or adjust `WORK_START_HOUR` for testing): `lateMinutes` is `0`
- [ ] Clock in after 08:00: `lateMinutes` reflects the actual delay
- [ ] Calling `POST /attendance/clock-in` again the same day returns `400`
- [ ] `POST /attendance/clock-out` before clocking in returns `400`
- [ ] Clock out after 17:00: `overtimeMinutes` reflects the actual delay; before 17:00 it's `0`
- [ ] `GET /attendance/today` reflects the day's record correctly, and `null` before any clock-in
- [ ] `GET /attendance/my` shows only the logged-in account's own history
- [ ] Logged in as HR: `GET /attendance/summary?month=&year=` aggregates correctly across employees
- [ ] Logged in as Finance Officer: `GET /attendance` and `GET /attendance/summary` return `403` (not Finance's domain)
- [ ] From a different, non-allowlisted network: clock-in/out both return `403` naming the detected IP

## 20. Employee Role / Role Dropdown
- [ ] `GET /users/roles` returns all four roles: Administrator, HR Officer, Finance Officer, Employee
- [ ] If it doesn't, run `npx sequelize-cli db:seed` from `server/` to pick up any seeders not yet applied

## Frontend Smoke Test
- [ ] Log in via the UI with seeded admin credentials
- [ ] Dashboard loads stats without console errors
- [ ] Add an employee via the modal, see it appear in the table
- [ ] From User Management, create an Employee-role account linked to that employee — confirm the one-time credential modal shows a generated password
- [ ] Generate a payroll run, see records appear with `processed` status
- [ ] Approve → Mark Paid → Generate Payslip → Download PDF, all from the Payroll page
- [ ] Search for that employee under Payslips, confirm the payslip is listed and downloadable
- [ ] Run a monthly report and export the CSV
- [ ] Log out, log back in as the new Employee account with the generated password
- [ ] Confirm the "default password" reminder banner shows, and the sidebar only shows self-service links
- [ ] Submit a leave application and a salary advance request from the Employee account
- [ ] Confirm the payslip generated earlier now appears under "My Payslips" and downloads correctly
- [ ] Log in as HR, approve/reject the leave application from Leave Approvals
- [ ] Log in as Finance, approve/reject the salary advance from Advance Approvals
- [ ] Change the Employee account's password from the Change Password page, confirm the reminder banner disappears
- [ ] Log in as a non-Admin user and confirm the sidebar hides Admin-only links
