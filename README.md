# TSR CMS

A web-based College Management System for TSR, built with Next.js (App Router), TypeScript, Tailwind CSS and Supabase.

## Features

Modules covering the academic and administrative side of a college:

- **Students** — admission records, roll numbers, documents, profile
- **Faculty** — employee records, departments, designations, workload
- **Attendance** — class-wise marking, register, shortage tracking, reports
- **Exams** — schedule, internal assessment, marks entry, results, SGPA
- **Fees** — fee structures, collection, receipts, Razorpay payment
- **Library** — book catalogue, issue/return, overdue fines
- **Hostel** — blocks, rooms, student allocation
- **Transport** — routes, stops, student allocation
- **Payroll** — salary components, monthly salary processing
- **Notifications** — email / SMS / WhatsApp / in-app templates
- **Reports & export** — attendance and fee reports, Google Sheets export

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router), TypeScript |
| UI | Tailwind CSS, shadcn/ui-style components, Radix |
| Database | Supabase (PostgreSQL) with row-level security |
| Auth | Supabase Auth (email + password) |
| Mobile | Capacitor (Android/iOS wrapper) |

## Getting Started

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase keys
npm run dev
```

Open http://localhost:3000.

### Database setup

The schema lives in `supabase/schema.sql` and reference data in
`supabase/seed.sql`.

```bash
npm run db:push     # apply schema to a linked Supabase project
npm run db:seed     # load departments, programs, college settings
```

## Environment Variables

See `.env.example` for the full list. The three you must set to run the app:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (safe for the browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side only, bypasses row-level security |

## Default credentials

There are no hardcoded default accounts. Accounts are created through the app, and
passwords are set per-user:

- Students are created with their **roll number** as the initial password.
- Faculty are created with their **employee ID** as the initial password.

Both should be changed by the user after first login.

## Security notes

- `.env.local` is gitignored. Never commit it.
- `SUPABASE_SERVICE_ROLE_KEY` bypasses row-level security — it must only ever be
  used in server code.
- Row-level security is enabled per table in `supabase/schema.sql`; review the
  policies before adding a new table.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | Lint |
| `npm run db:push` | Push schema to Supabase |
| `npm run db:seed` | Load seed data |
| `npm run cap:sync` | Sync the Capacitor mobile wrapper |

## License

See the repository for licensing terms.