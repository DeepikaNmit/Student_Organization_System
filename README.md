# Student_Organization_System
Student Organization System is a centralized platform for managing college club activities. It streamlines membership registration, event planning, ticket sales, announcements, merchandise orders, volunteer tasks, and financial tracking, helping student organizations improve efficiency, transparency, and coordination.

# Clustro — Everything Your Organization Needs, Together

Frontend only (React + TypeScript + Vite + Tailwind). All data is demo data in `src/mocks`, saved to localStorage.

## Run in VS Code
1. Install Node.js 20+.
2. Open this folder in VS Code, then open a terminal (Ctrl+`).
3. `npm install`
4. `npm run dev` and open the printed URL (http://localhost:5173).

Other scripts: `npm run build` (typecheck + production build), `npm run preview`.

## Demo logins
- Admin: admin@clustro.demo / Admin@1234
- Member (Event Organizer): member@clustro.demo / Member@1234
- Non-Member: guest@clustro.demo / Guest@1234

To reset demo data, clear this site's localStorage (keys start with `clustro.demo.`).

## Features Added in This Phase
- **Account Approvals**: New registrations are put in a `PENDING` state. Admins have a dedicated dashboard to approve or reject registrations. Login is disabled for pending accounts.
- **Merchandise**: A full merchandise store accessible to members and non-members. Includes product variants, cart logic, checkout (simulated payment), stock validation, member discounts, and order history.
- **Treasury**: Admin and Treasurer roles can view a financial summary dashboard, track income/expenses, view budgets, manage fundraisers, and view simulated CSV exports.
- **Volunteering**: Members can view active tasks, and Admins can assign tasks, track hours, and reimburse expenses.
- **ClubMemory**: Historical records, reusable event templates, semester reports, and leadership handovers.
- **Settings & Audit Log**: Configurable organization preferences and a timestamped audit log of all critical actions.
- **UI Polish**: Updated login screen with an atmospheric background image.

*(Note: Data is saved to localStorage. "Coming Soon" placeholders for Clubs and Campaigns remain as stubs.)*

## Structure
- `src/api/*.ts` typed API modules (one per module). Mock-backed now; `VITE_API_URL` in `.env` is the base URL for the future Express `/api/v1`.
- `src/types` shared types, `src/mocks` seed data + localStorage store.
- `src/pages`, `src/components`, `src/context`, `src/lib` UI, auth, schemas (Zod), nav.
