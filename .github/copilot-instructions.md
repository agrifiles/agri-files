# Copilot Instructions for Agri Files Project

## Project Overview
Agri Files is a full-stack agricultural file management system with:
- **Frontend**: Next.js (App Router), React 19, Tailwind CSS, in `frontend/`
- **Backend**: Node.js/Express, PostgreSQL (Neon), in `backend/`

## Architecture & Data Flow
- **Frontend**: Uses Next.js App Router. Pages are in `src/app/`, with subfolders for features (e.g., `bill/`, `files/`, `products/`). Language switching is via context (`LangProvider.js`).
- **Backend**: Express REST API, routes in `backend/routes/`. Handles auth, product, file, and bill management. DB connection in `db.js`.
- **API Communication**: Frontend calls backend via REST; base URL in `frontend/src/lib/utils.js` (`API_BASE`).
- **Authentication**: JWT-based, with OTP for registration/login (`backend/routes/auth.js`).

## Developer Workflows
- **Start Frontend**: `npm run dev` in `frontend/` (Next.js on port 3000)
- **Start Backend**: `node server.js` in `backend/` (Express on port 5006)
- **Environment**: Backend expects `.env` for DB and secrets (see `db.js`).
- **API Endpoints**: Auth (`/auth/*`), Products (`/products/*`), Files (`/api/files/*`), Bills (`/api/bills/*`).
- **Deployment**: Frontend is Vercel-ready; backend deployable to Render/Node hosts.

## Project-Specific Patterns
- **Language/Translation**: Managed via `LangProvider.js` and `translations.js` (see `src/app/components/`).
- **Protected Routes**: Use `ProtectedRoute` for client-side auth checks.
- **Data Mapping**: Backend maps frontend form fields to DB columns (see `mapFormToDb` in `routes/files.js`).
- **Rate Limiting**: Auth endpoints use `express-rate-limit` (`auth.js`).
- **PDF/Canvas**: Uses `pdfmake`, `jspdf`, `konva`, `fabric` for document/canvas features.
- **CORS**: Backend CORS allows local and Vercel frontend URLs.

## Conventions & Examples
- **Frontend**: Use functional components/hooks. New pages go in `src/app/feature/page.js` (Next.js routing).
- **Backend**: Use async/await for DB/API. Business logic stays in route handlers.
- **Manual Testing**: No formal test scripts; test via API/UI.

## Key Files & Directories
- `frontend/src/app/layout.js`: App-wide layout, language context
- `frontend/src/app/components/translations.js`: Translation strings
- `frontend/src/lib/utils.js`: API base, user helpers
- `backend/server.js`: Express entry point
- `backend/db.js`: PostgreSQL connection
- `backend/routes/`: API route handlers

---
For unclear patterns, review referenced files or ask for clarification. Update this file as the project evolves.
