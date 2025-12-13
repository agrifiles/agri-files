# Copilot Instructions for Agri Files Project

## Project Overview
Agri Files is a full-stack agricultural file management system built with:
- **Frontend**: Next.js 15.5 (App Router), React 19, Tailwind CSS 4 in `frontend/`
- **Backend**: Express 5 with PostgreSQL (Neon) in `backend/`
- **Primary Features**: File/farm document management, bills, products, user authentication with OTP

## Architecture & Data Flow

### Frontend (Next.js App Router)
- Pages located in `frontend/src/app/` with feature-based subdirectories (`bill/`, `files/`, `products/`)
- `'use client'` components handle interactivity; server components for layout/metadata
- **Language Context**: `LangProvider` wraps app in `layout.js` (Marathi/English via `translations.js`)
- **Protected Routes**: Wrap pages with `ProtectedRoute` component for auth checks (reads localStorage)
- **API Helper**: `frontend/src/lib/utils.js` exports `API_BASE` (auto-switches between localhost and render.com), plus `getCurrentUser()`, `setCurrentUser()`, `clearCurrentUser()`

### Backend (Express on port 5006)
- **Routes** in `backend/routes/`: `auth.js`, `files.js`, `bills.js`, `products.js`
- **Database**: pg Pool in `db.js`, expects env vars: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`
- **Authentication**: JWT tokens + OTP via email (`nodemailer`), rate-limited at 6 req/min on auth endpoints
- **CORS**: Allows localhost:3000, Vercel preview/production URLs (see `server.js` line 6-7)
- **API Path Prefixes**: `/auth/*` (login/register/verify-otp), `/api/files/*`, `/api/bills/*`, `/products/*`

## Developer Workflows

### Starting the Stack
- **Backend**: `node server.js` in `backend/` directory (port 5006, requires `.env`)
- **Frontend**: `npm run dev` in `frontend/` directory (port 3000, Next.js Turbopack)
- **Build Frontend**: `npm run build` and `npm start` (production build)
- **Environment Setup**: Create `.env` in `backend/` with DB credentials and secrets (OTP_EXPIRY_MINUTES, JWT_SECRET)

### Database & User Data
- **User Registration Flow**: Form → `/auth/register` (creates user, sends OTP) → `/auth/verify-otp` (confirms user, returns JWT token)
- **User Object in localStorage**: `{id, name, email, mobile, ...}` — check `utils.js` for field names and accessor functions
- **File Data Model**: Stores form fields (farmerName, cropName, etc.), shapes JSON (Konva canvas data), and owner_id
- **Form-to-DB Mapping**: Use `mapFormToDb()` function in `routes/files.js` to convert camelCase frontend fields to snake_case DB columns

### Key Commands
- Fetch all companies: `GET /api/files/companies/list`
- Create a file: `POST /api/files` with `{title, form, shapes, owner_id}`
- Create a bill: `POST /api/bills`
- List products: `GET /products`
- Test DB: `GET /db-test` (debug endpoint in server.js)

## Project-Specific Patterns

### Component & Page Patterns
- **New Pages**: Add folder with `page.js` in `src/app/` (e.g., `src/app/feature/page.js`)
- **Language Switching**: Use `useContext(LangContext)` to get `{lang, setLang, toggleLang, t}` where `t` is the translation object
- **Fetch Data**: Always check `typeof window !== 'undefined'` for client-only code; use `try/catch` with localStorage

### Canvas & PDF Libraries
- **Canvas Drawing**: Konva (`konva`, `react-konva`) for interactive farm maps on canvas
- **PDF Export**: Multiple libs available — `pdfmake`, `jspdf`, `pdf-lib`, `html2canvas`, `html2pdf.js` (choose per use case)
- **File Export Example**: See `BillInvoice.js` and `pdfmakeClient.js` for invoice generation

### Authentication & User Management
- **OTP Verification**: 6-digit code, expires per `OTP_EXPIRY_MINUTES` env var (default 5 min)
- **JWT Token**: Issued on successful OTP verification, stored client-side (sent in Authorization header)
- **Password Hashing**: bcrypt with SALT_ROUNDS=10
- **Email OTP**: Uses `nodemailer`, configured via env vars

### Data Validation & Error Handling
- **Backend Input Validation**: Use `validator.js` for email/phone checks (see `auth.js` line 43-44)
- **Validator Rules**: Indian mobile must match `/^[6-9]\d{9}$/`, email via `validator.isEmail()`
- **Error Responses**: Return `{error: 'message'}` or `{success: false, error: 'message'}`
- **Success Responses**: Return `{success: true, data}` or relevant fields (e.g., `{ok: true, companies: [...]}`)

### Company Settings Management
- **User Company Links**: Table `company_link` stores user-to-company associations (max 3 per user)
- **Company Slots**: Users can assign companies to slots 1, 2, or 3 with designation & engineer info
- **API Routes**: `/api/company-settings/*` handles all company management operations
- **Designations**: Fixed options—"Sales Engineer", "Sales Representative", "Technical Validator"
- **UI Component**: `CompanySettings.js` provides tab-based interface with 3-slot form layout
- **Frontend**: Company settings accessible from `/settings` page with tab navigation

## Key Files & Conventions

| File | Purpose |
|------|---------|
| `backend/server.js` | Express app setup, route registration, CORS config |
| `backend/db.js` | PostgreSQL Pool with Neon SSL settings |
| `backend/routes/auth.js` | User registration, login, OTP verification (rate-limited) |
| `backend/routes/files.js` | Create/read/update file records with form & shapes data |
| `backend/routes/company-settings.js` | User company link management (CRUD for max 3 companies) |
| `frontend/src/app/layout.js` | Root layout wrapping LangProvider & ProtectedRoute |
| `frontend/src/lib/utils.js` | API_BASE, user getter/setter functions, fetch wrapper |
| `frontend/src/app/components/LangProvider.js` | React Context for language state |
| `frontend/src/app/components/translations.js` | EN/MR translation strings (key-value objects) |
| `frontend/src/app/components/CompanySettings.js` | Company link form component (3-slot UI) |
| `frontend/src/components/ProtectedRoute.js` | Client-side auth guard (checks localStorage) |

## Testing & Debugging
- No automated test suite; test via API client (curl, Postman) and browser
- Enable logging: Check `console.log()` statements in `routes/files.js` for request debugging
- DB test endpoint: `GET /db-test` returns server time (verifies pg connection)
- Rate limit test: Call auth endpoint 7+ times in 60 sec to trigger 429 error

---
**Maintain this file as the project evolves.** When adding new routes, features, or conventions, update relevant sections above.
