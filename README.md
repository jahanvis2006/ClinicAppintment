# ClinicFlow

**Conflict-free clinic appointment scheduling.**

## Overview

ClinicFlow is a front-desk appointment management system for a small clinic with a
handful of doctors. It solves the exact problem described in the brief: front-desk
staff were accidentally double-booking doctors, letting two patients grab the same
slot, and manually (and inconsistently) applying a cancellation fee. ClinicFlow
enforces scheduling correctness on the **backend** — never the frontend — so a
doctor cannot be double-booked through the API, and cancellation fees are always
calculated the same way, on the server, based on how much notice the patient gave.

## Features

- Receptionist registration and login (JWT-based)
- Doctor management (add / list doctors)
- Patient management (add / list / search patients)
- Appointment booking with **server-enforced** doctor-overlap prevention
- Doctor daily schedule (chronological view of one doctor's day)
- Patient-name search across appointments (case-insensitive, server-side)
- Filtering by doctor, date and status
- Sorting by appointment time, patient name, or newest
- Pagination
- Automatic, backend-calculated cancellation fees (free vs. ₹200 late fee)
- One-page marketing landing page
- Dashboard with live summary counts pulled from the real database

## Tech Stack

**Frontend:** React 18, Vite, React Router, Tailwind CSS
**Backend:** Node.js, Express.js
**Database:** SQLite
**ORM:** Prisma
**Auth:** JWT + bcryptjs password hashing

## Architecture

```text
Frontend (React/Vite) → REST API (Express) → Prisma ORM → SQLite database
```

The client (`/client`) is a standalone Vite SPA that talks only to the REST API
over `fetch`. The server (`/server`) is a standalone Express app; all business
rules (overlap prevention, cancellation fee calculation) live there, never in the
frontend. The frontend may show helpful hints, but the server response is always
the source of truth.

## Database Schema

- **User** — receptionist accounts (`id`, `name`, `email` [unique], `passwordHash`, `createdAt`)
- **Doctor** — `id`, `name`, `specialization`, `createdAt`
- **Patient** — `id`, `name`, `phone`, `email`, `createdAt`
- **Appointment** — `id`, `doctorId` (FK), `patientId` (FK), `startTime`, `endTime`,
  `status` (`SCHEDULED` | `CANCELLED` | `COMPLETED`), `cancellationFee`, `createdAt`, `updatedAt`

Indexes: `Appointment(doctorId, startTime)` for fast overlap/schedule lookups,
`Appointment(patientId)`, `Appointment(status)`, and `name` indexes on `Doctor`
and `Patient` for search. Passwords are never stored in plaintext — only a
bcrypt hash.

## Business Rules

### 1. No overlapping appointments for the same doctor

Enforced in `POST /api/appointments` on the server, against active
(non-cancelled) appointments only. The exact predicate lives in one place,
`server/src/utils/overlap.js`, and is imported by both the route and the
test suite so the tests always exercise the real rule:

```text
newStart < existingEnd
AND
newEnd > existingStart
```

If any active appointment for that doctor satisfies this condition, the new
booking is rejected with `409 Conflict`. Appointments that merely touch at a
boundary (one ends exactly when the other starts) are **allowed**. Cancelled
appointments never block a new booking. The conflict check and the insert
happen inside a single Prisma transaction, so two near-simultaneous booking
requests for the same doctor can't both pass the check before either one
writes (SQLite itself has no exclusion/overlap constraint to fall back on,
so this transaction is the actual safeguard).

### 2. Cancellation policy

The brief didn't specify an exact threshold, so ClinicFlow defines and documents
one clearly:

- **More than 2 hours** before the appointment start → **₹0** (free)
- **2 hours or less** before the appointment start → **₹200** (late fee)
- **Exactly 2 hours remaining** counts as **late** (₹200)
- If the appointment's start time has **already passed**, it cannot be
  cancelled through the normal cancel action (the API returns `400`)

This is implemented once, server-side, in `server/src/utils/cancellation.js`,
and used by the `PATCH /api/appointments/:id/cancel` route — the frontend only
displays whatever the server decides.

## API Endpoints

All endpoints return JSON. Protected endpoints require an `Authorization: Bearer <token>`
header (obtained from register/login).

### Auth

```text
POST /api/auth/register      Register a new receptionist account.        Public
POST /api/auth/login         Authenticate and receive a JWT.             Public
GET  /api/auth/me            Get the current authenticated user.         Protected
```

### Doctors

```text
GET  /api/doctors                  List doctors (optional ?search=name)  Protected
POST /api/doctors                  Create a doctor                       Protected
GET  /api/doctors/:id              Get one doctor                        Protected
GET  /api/doctors/:id/schedule     Doctor's appointments for a date       Protected
                                    ?date=YYYY-MM-DD (required)
```

### Patients

```text
GET  /api/patients            List patients (optional ?search=name)      Protected
POST /api/patients            Create a patient                          Protected
GET  /api/patients/:id        Get one patient                           Protected
```

### Appointments

```text
GET   /api/appointments                 List appointments                Protected
                                         ?search=name        (patient name, case-insensitive)
                                         &doctorId=1
                                         &date=YYYY-MM-DD
                                         &status=SCHEDULED|CANCELLED|COMPLETED
                                         &sort=startTime|patientName|createdAt
                                         &order=asc|desc
                                         &page=1&limit=10
POST  /api/appointments                 Book a new appointment            Protected
                                         body: { doctorId, patientId, date, startTime, endTime }
                                         409 if it overlaps an existing appointment
                                         for the same doctor
GET   /api/appointments/:id             Get one appointment               Protected
PATCH /api/appointments/:id/cancel      Cancel an appointment and         Protected
                                         compute the cancellation fee
```

### Status codes used throughout

`200` success · `201` created · `400` invalid input · `401` auth error ·
`404` not found · `409` appointment conflict · `500` unexpected server error

## Search

Patient-name search is server-side and case-insensitive (`?search=rahul` matches
"Rahul Sharma"). It's surfaced prominently at the top of the Appointments page,
directly answering the brief's requirement to "find a patient's appointment by
name." Doctor and patient lists also support the same `?search=` pattern.

## Pagination

`GET /api/appointments` accepts `page` (default `1`) and `limit` (default `10`,
capped at `100`). The response includes a `pagination` object:
`{ page, limit, total, totalPages }`, which the Appointments page uses to render
a "Showing X–Y of Z" summary and page controls.

## Sorting

Supported `sort` values: `startTime` (default), `patientName`, `createdAt`.
Combine with `order=asc|desc`. The Appointments page exposes these as a single
dropdown (e.g. "Appointment Time (earliest first)").

## Authentication

Registration hashes the password with bcrypt (`bcryptjs`, 10 salt rounds) and
never stores or returns the plaintext password or the hash. Login verifies the
hash and issues a signed JWT (`JWT_SECRET`, default expiry `7d`, both
configurable via environment variables). All clinic-management endpoints
(doctors, patients, appointments) require a valid `Authorization: Bearer <token>`
header; missing or invalid tokens return `401`.

## Setup

Requires Node.js 18+. Works in GitHub Codespaces out of the box.

```bash
# From the project root
npm install          # installs the root dev tooling (concurrently)
npm run install:all  # installs server + client dependencies
npm run setup        # generates the Prisma client, creates/syncs the SQLite
                      # schema (via `prisma db push`), and seeds demo data
npm run dev           # runs the API and the Vite dev server together
```

`npm run setup` is equivalent to running, in order: `npm run install:all`,
`npm run db:push` (creates `server/prisma/dev.db` and its tables directly
from `schema.prisma`), and `npm run seed`. This project intentionally uses
`prisma db push` for the automated setup path instead of checked-in
migration files, so a fresh clone always gets a correctly-shaped database
with zero manual steps. If you'd rather have a versioned migration history
(e.g. to practice a production-style workflow), you can run
`npm run prisma:migrate --prefix server` once instead of `npm run db:push` —
both produce the same schema.

Environment variables are provided with working defaults in
`server/.env.example` and `client/.env.example`; copy them if you want to
customize anything:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

`npm run dev` (root) starts the API on **http://localhost:4000** and the
Vite dev server on **http://localhost:5173** together, using `concurrently`
so both processes' logs are labeled and a single Ctrl+C stops both — the
more common `a & b` shell trick used by some Node projects only backgrounds
the first process and doesn't reliably clean it up when you stop the second,
and behaves inconsistently across shells. If you prefer two terminals, the
per-app scripts still work: `npm run dev:server` and `npm run dev:client`.

Demo login (created by the seed script): **reception@clinicflow.test** / **password123**

> If running in GitHub Codespaces, make sure the forwarded port for the client
> is set to "Public" if you need to access it outside the Codespace, and update
> `client/.env` (`VITE_API_URL`) and `server/.env` (`CLIENT_ORIGIN`) to match the
> forwarded URLs if you don't use the default localhost ports.

## Environment Variables

**server/.env**

| Variable | Purpose |
|---|---|
| `PORT` | Port the Express API listens on (default `4000`) |
| `DATABASE_URL` | SQLite connection string used by Prisma (`file:./dev.db`) |
| `JWT_SECRET` | Secret used to sign/verify JWTs — change in production |
| `JWT_EXPIRES_IN` | JWT expiry, e.g. `7d` |
| `CLIENT_ORIGIN` | Allowed CORS origin(s) for the frontend |

**client/.env**

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the backend REST API |

## Date/Time Handling

The clinic operates in India. All appointment timestamps are stored in the
database as real UTC instants (Prisma `DateTime`). The frontend sends a wall-clock
`date` (`YYYY-MM-DD`) and `time` (`HH:mm`) that represent India local time; the
server combines them with a fixed `+05:30` offset (`server/src/utils/time.js`)
into a genuine `Date` instant before storing or comparing anything. Because all
comparisons (overlap checks, cancellation-window checks) operate on real instants
rather than strings, they are correct regardless of the server's own timezone.
Display formatting on the frontend explicitly uses the `Asia/Kolkata` timezone.

"Search by date" (`GET /api/appointments?date=...` and the doctor schedule
endpoint) uses `getISTDayRange()`, which resolves a calendar date to
`[00:00:00.000 IST that day, 00:00:00.000 IST the next day)` — an exclusive
upper bound — rather than assuming the day ends at `23:59`. That distinction
matters: a naive `"23:59"` cutoff silently drops any appointment starting in
the last minute of the day (e.g. 23:59:30); the exclusive next-day boundary
doesn't have that gap.

## Testing

### Automated tests

```bash
npm test              # from the project root, runs the server's test suite
# or
cd server && npm test
```

Uses Node's built-in test runner (`node --test`) — no extra test framework
dependency. Covers, against the actual production functions (not copies of
the logic):

- **Overlap predicate** (`src/utils/overlap.js`, used by `POST /api/appointments`):
  touching boundaries allowed, true overlaps rejected, plus the exact
  scenarios from the assignment brief (A, C, F, G, H — new-inside-existing,
  new-containing-existing, and both back-to-back boundary cases).
- **Cancellation fee calculation** (`src/utils/cancellation.js`):
  more-than-2-hours (free), exactly-2-hours (late fee), less-than-2-hours
  (late fee), and already-started.
- **Full cancellation decision** (`canCancel`, also in `src/utils/cancellation.js`,
  used by `PATCH /api/appointments/:id/cancel`): the fee-based outcomes above,
  plus rejecting an already-cancelled or already-completed appointment
  regardless of timing.

Scenarios B, D and E from the brief (same-doctor back-to-back booking
succeeding, two different doctors booked for the identical slot, and a
cancelled appointment's old slot being re-bookable) depend on status
filtering and doctor-id scoping that live in the route/database layer rather
than in a pure function, so they're exercised via the manual API test plan
below instead of a unit test.

### Manual test scenarios

Run these with `npm run dev` up and a token from `/api/auth/login` (or just
click through the UI — every one of these has a corresponding screen).

1. **Book a valid appointment** — Appointments → Book Appointment → fill form → succeeds.
2. **Overlapping appointment, same doctor (A/C)** — book a second appointment for the
   same doctor with a time range that overlaps an existing one → rejected with
   a `409` and a friendly "Dr. X is already booked..." message.
3. **Back-to-back, same doctor (B)** — book 10:30–11:00 right after an existing
   10:00–10:30 for the same doctor → succeeds (boundaries touch, no overlap).
4. **Same time, different doctor (D)** — book the same time slot for a different
   doctor → succeeds.
5. **Re-book a cancelled slot (E)** — cancel an appointment, then book a new
   appointment for the same doctor in the exact same slot → succeeds, because
   cancelled appointments never block a slot.
6. **Cancel > 2 hours before** — cancel an appointment more than two hours out
   → fee shown as ₹0.
7. **Cancel within 2 hours** — cancel an appointment starting soon → fee shown
   as ₹200.
8. **Cancel an already-cancelled or already-started appointment** — both are
   rejected by the server with a `400` and a clear message.
9. **Search** — type a patient's first name into the Appointments search box →
   only their appointments appear, case-insensitively.
10. **Pagination** — with more than 10 appointments, page through results and
    confirm the "Showing X–Y of Z" counts and rows change.
11. **Sorting** — switch the sort dropdown between appointment time, patient
    name, and newest, and confirm row order changes accordingly.

## Notes on Seed Data

The seed script (`server/prisma/seed.js`) creates one demo user, 3 doctors,
10 patients, and appointments spread across today and tomorrow — including one
cancelled and one completed appointment — deliberately built with **no
overlapping times for the same doctor**, so the app demonstrates cleanly out of
the box.

## Three Features That Could Be Built Next

1. Automated SMS/email appointment reminders
2. Patient self-service online booking
3. Doctor availability / working-hours management
