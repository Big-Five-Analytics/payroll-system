# Big Five Investments — Payroll Management System

A secure, role-based payroll management system for Big Five Investments Ltd.
Manages employees, processes payroll (PAYE, NAPSA, NHIMA), generates payslips, and produces reports.

## Tech Stack

**Frontend:** React 19, Vite, React Router, Tailwind CSS, Axios, React Hook Form
**Backend:** Node.js, Express.js, Sequelize ORM
**Database:** PostgreSQL
**Auth:** JWT (access + refresh tokens), bcrypt password hashing

## Project Structure

```
payroll-system/
├── client/          # React frontend
├── server/          # Express backend
├── docs/            # Architecture & API docs
└── README.md
```

## Quick Start

### 1. Database
```bash
psql -U postgres -c "CREATE DATABASE payroll_db;"
```

### 2. Backend
```bash
cd server
cp .env.example .env      # then fill in your DB password + JWT secrets
npm install
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
npm run dev
```
API runs at `http://localhost:5000`

### 3. Frontend
```bash
cd client
cp .env.example .env
npm install
npm run dev
```
App runs at `http://localhost:5173`

### Default seeded login
```
Email:    admin@bigfive.com
Password: Admin@12345
```
**Change this password immediately after first login in a real deployment.**

## Roles
- **Administrator** — full system access, user & role management, audit logs
- **HR Officer** — employee management, department management, leave approvals
- **Finance Officer** — payroll processing, payslips, reports, salary advance approvals
- **Employee** — self-service: apply for leave, request salary advances, download own payslips once paid

HR Officers, Finance Officers, and Admins are frequently employees of the company too - any staff
account can optionally be linked to an employee record (not just the `Employee` role), which gives
them the same self-service access alongside their staff duties, and includes them in payroll and headcount.

## Employee Self-Service Accounts

User accounts of any role are created by the Administrator from **User Management**, optionally
linked to an existing employee record (required for the `Employee` role, optional for others). On
creation, the system generates a random default password (shown once) for the admin to share with
the user. After first login, they see a reminder banner prompting them to change it — from
**Change Password** in the sidebar.

## Payroll Calculation (ZRA method)

```
grossPay      = basicSalary + all allowances
NAPSA         = 5% of grossPay
NHIMA         = 1% of basicSalary
taxableIncome = grossPay - NAPSA - NHIMA
PAYE          = progressive tax on taxableIncome (0% to K5,100 / 25% to K9,200 / 30% to K18,000 / 37% above)
```
Approved salary advances are automatically deducted in full on the employee's next payroll run —
no manual deduction setup needed. See `docs/database.md` for the full breakdown.

## Employee Termination

Terminating an employee archives a snapshot to a dedicated **Terminated Employees** table (visible
to HR/Admin), deactivates their login if they had one, and excludes them from headcount and the
active employee directory. Their original record is retained internally so historical payroll,
payslips, leave, and salary advance records stay intact — see `docs/database.md` for why.

## Bank Payment Export

Finance/Admin can export an `.xlsx` bank payment batch (employee number, name, bank name, account
number, net pay) for any payroll period from the **Reports** page — includes only `approved`/`paid`
records, and will flag any employee missing bank details before generating the file.

## Documentation
See `/docs` for:
- `architecture.md` — system architecture & diagrams
- `database.md` — ER diagram & table definitions
- `api.md` — full REST API reference
- `postman_collection.json` — importable Postman collection
- `testing-checklist.md` — manual QA checklist

## License
Proprietary — Big Five Investments Ltd.
