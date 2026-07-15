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

## Frontend Smoke Test
- [ ] Log in via the UI with seeded admin credentials
- [ ] Dashboard loads stats without console errors
- [ ] Add an employee via the modal, see it appear in the table
- [ ] Generate a payroll run, see records appear with `processed` status
- [ ] Approve → Mark Paid → Generate Payslip → Download PDF, all from the Payroll page
- [ ] Search for that employee under Payslips, confirm the payslip is listed and downloadable
- [ ] Run a monthly report and export the CSV
- [ ] Log in as a non-Admin user and confirm the sidebar hides Admin-only links
