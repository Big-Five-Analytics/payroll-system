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
- **HR Officer** — employee management, department management
- **Finance Officer** — payroll processing, payslips, reports

## Documentation
See `/docs` for:
- `architecture.md` — system architecture & diagrams
- `database.md` — ER diagram & table definitions
- `api.md` — full REST API reference

## License
Proprietary — Big Five Investments Ltd.
