# Architecture Documentation

## System Overview

```mermaid
graph TD
    A[React 19 SPA] -->|Axios / JWT| B[Express REST API]
    B --> C[(PostgreSQL)]
    B --> D[Sequelize ORM]
    D --> C
    B --> E[Winston Logger]
    B --> F[PDFKit - Payslip PDFs]
    B --> G[JSON2CSV - Report Exports]
```

## Backend Layering

```mermaid
graph LR
    Route --> Middleware
    Middleware --> Controller
    Controller --> Service
    Service --> Model
    Model --> Database[(PostgreSQL)]
```

- **Routes** — declare endpoints, wire up validators and role guards, delegate to controllers
- **Middleware** — authentication (JWT verify), authorization (role check), validation (express-validator results), centralized error handling, audit logging
- **Controllers** — thin HTTP layer: parse request, call service, format response via `ApiResponse`
- **Services** — business logic (payroll calculations, employee lifecycle, report aggregation) — framework-agnostic, easily unit-testable
- **Models** — Sequelize definitions + associations, one file per table

## Auth Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API
    participant D as Database

    U->>F: Enter credentials
    F->>A: POST /api/auth/login
    A->>D: Find user + verify bcrypt hash
    D-->>A: User record
    A-->>F: Access token (JSON) + Refresh token (httpOnly cookie)
    F->>F: Store access token in memory/localStorage
    F->>A: Subsequent requests with Bearer token
    A-->>F: 401 if expired
    F->>A: POST /api/auth/refresh (cookie sent automatically)
    A-->>F: New access token
```

## Payroll Generation Flow

```mermaid
sequenceDiagram
    participant Finance as Finance Officer
    participant API as Payroll API
    participant Engine as Payroll Engine
    participant DB as Database

    Finance->>API: POST /api/payroll/generate {month, year}
    API->>DB: Fetch active employees + allowances/deductions
    API->>Engine: For each employee: compute PAYE, NAPSA, NHIMA
    Engine-->>API: grossPay, deductions, netPay
    API->>DB: Insert Payroll + PayrollItem rows (transaction)
    API-->>Finance: Payroll batch result
    Finance->>API: PATCH /api/payroll/:id/approve
    Finance->>API: POST /api/payslips/generate/:payrollId
    API->>API: Render PDF via PDFKit
    API-->>Finance: Payslip record + downloadable PDF
```

## Security Measures

- Passwords hashed with bcrypt (cost factor 12)
- JWT access tokens (short-lived) + refresh tokens (httpOnly, sameSite cookie)
- Role-based authorization on every protected route (`Administrator`, `HR Officer`, `Finance Officer`)
- `helmet` for secure HTTP headers, `cors` locked to the configured client origin
- Rate limiting on the login endpoint (20 requests / 15 min)
- express-validator on all mutating endpoints
- Centralized error handler normalizes Sequelize/JWT errors into consistent API responses without leaking stack traces in production
- Full audit trail (`audit_logs`) for create/update/delete/login/logout/payroll-run actions
