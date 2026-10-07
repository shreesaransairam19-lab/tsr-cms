# TSR CMS - Project Report
## College Management System for TSR

---

## 1. Project Overview

**Project Name:** TSR CMS (College Management System)
**Client:** TSR
**Live URL:** https://tsr-cms.vercel.app
**GitHub Repository:** https://github.com/shreesaransairam19-lab/tsr-cms
**Project Start Date:** August 21, 2026
**Report Date:** August 22, 2026

---

## 2. Scope & Departments

The system covers all **10 departments** of the college:

| Code  | Department                                         | Short Name |
|-------|----------------------------------------------------|------------|
| AIDS  | Artificial Intelligence and Data Science            | AI&DS      |
| BIO   | Biotechnology                                       | BTech      |
| CHEM  | Chemical Engineering                                | ChemE      |
| CSE   | Computer Science and Engineering                    | CSE        |
| CSEBS | Computer Science and Engineering - Business Systems | CSE-BS     |
| ECE   | Electronics and Communication Engineering           | ECE        |
| EEE   | Electrical and Electronics Engineering              | EEE        |
| IT    | Information Technology                              | IT         |
| MECH  | Mechanical Engineering                              | ME         |
| MBA   | Master of Business Administration                   | MBA        |

---

## 3. Technology Stack

### Frontend
- **Framework:** Next.js 15.5.23 (App Router, React 19)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** Custom shadcn-style component library (37 components)
- **Charts:** Recharts
- **Forms:** React Hook Form + Zod validation
- **Theme:** next-themes (Light/Dark/System toggle)
- **Icons:** Lucide React

### Backend
- **Runtime:** Next.js API Routes (35 routes)
- **Authentication:** Supabase Auth (SSR with cookie-based sessions)
- **Authorization:** Custom role-based access (admin, faculty, student, super_admin)
- **Database:** PostgreSQL via Supabase (34 tables)
- **Email:** Nodemailer (SMTP)

### Mobile
- **Framework:** Capacitor 7
- **Platform:** Android APK
- **APK Size:** ~4MB
- **Location:** ~/Desktop/TSR-CMS.apk

### Deployment
- **Hosting:** Vercel (Free Tier)
- **CI/CD:** Vercel CLI direct deploy (production)
- **Domain:** tsr-cms.vercel.app (aliased)

### External Integrations
- Google Sheets import/export
- PDF generation (jsPDF + jspdf-autotable)
- Excel import/export (xlsx)
- CSV parsing (papaparse)
- File uploads (sharp for image processing)

---

## 4. Codebase Statistics

| Metric                     | Count    |
|----------------------------|----------|
| Total TypeScript/TSX files | 141      |
| Lines of Code              | 27,452   |
| Pages (UI)                 | 46       |
| API Routes                 | 35       |
| React Components           | 37       |
| Database Tables            | 34       |
| Dependencies (runtime)     | 23       |
| Dependencies (dev)         | 11       |

---

## 5. Module Breakdown

### 5.1 Authentication & Authorization
**Pages:** Login, Register, Forgot Password, Reset Password
**API Routes:** `/api/auth/login`, `/api/auth/logout`, `/api/auth/register`
**Features:**
- Email or Roll Number login
- Role-based access control (Admin, Faculty, Student)
- Session management via Supabase SSR cookies
- Auto-confirm emails (Supabase config)
- Secure logout with full cookie clearing

### 5.2 Student Management
**Pages:** Student List, Student Detail, Student Profile
**API Routes:** `/api/students`, `/api/students/[id]`
**Features:**
- CRUD operations (Create, Read, Update, Delete)
- Search, filter by department/program/batch/status
- Sortable data table with pagination
- Department and program associations

### 5.3 Faculty Management
**Pages:** Faculty List, Faculty Detail
**API Routes:** `/api/faculty`, `/api/faculty/[id]`
**Features:**
- Faculty CRUD
- Employee ID management
- Department assignment

### 5.4 Attendance Management
**Pages:** Attendance Overview, Attendance Marking
**API Routes:** `/api/attendance`, `/api/attendance/report`
**Features:**
- Mark daily attendance by class/subject
- Attendance reports and analytics
- Percentage calculations

### 5.5 Examination Management
**Pages:** Exams, Marks Entry, Results, Exam Schedule
**API Routes:** `/api/exams`, `/api/exams/results`
**Features:**
- Exam scheduling and management
- Marks entry and grade calculation
- SGPA/CGPA calculation (10-point grading)
- Results publication

### 5.6 Fee Management
**Pages:** Fee Dashboard, Fee Collection, Fee Structure
**API Routes:** `/api/fees`, `/api/fees/collect`, `/api/fees/structure`, `/api/fees/receipt/[id]`
**Features:**
- Fee structure definition per program
- Payment collection and tracking
- Receipt generation (PDF)
- Pending fee alerts

### 5.7 Library Management
**Pages:** Library Dashboard, Book Management, Issue/Return
**API Routes:** `/api/library/books`, `/api/library/issue`
**Features:**
- Book inventory management
- Issue and return tracking
- Overdue management

### 5.8 Hostel Management
**Pages:** Hostel Overview, Student Hostel
**API Routes:** `/api/hostel`, `/api/hostel/allocate`
**Features:**
- Room allocation
- Occupancy tracking

### 5.9 Transport Management
**Pages:** Transport Overview, Student Transport
**API Routes:** `/api/transport`, `/api/transport/allocate`
**Features:**
- Bus/route management
- Student transport allocation

### 5.10 Notification System
**Pages:** Notifications
**API Routes:** `/api/notifications`, `/api/notifications/send`
**Features:**
- Send notifications via email/in-app
- Notification history
- Read/unread tracking

### 5.11 Reports & Analytics
**Pages:** Reports Dashboard, Attendance Reports, Fee Reports
**API Routes:** `/api/reports`
**Features:**
- Attendance analytics with charts (Recharts)
- Fee collection reports
- Exportable data

### 5.12 Settings & Administration
**Pages:** Settings, Departments, Programs, Academic Years, Email Config, Import/Export, Notifications Config
**API Routes:** `/api/settings`, `/api/settings/departments`, `/api/settings/programs`, `/api/settings/email`, `/api/settings/email/test`
**Features:**
- Department and program management
- Academic year configuration
- Email SMTP configuration with test
- Data import (Google Sheets, CSV, Excel)
- Data export (Google Sheets, PDF, Excel)

### 5.13 Payroll
**Pages:** Payroll Dashboard, Process Payroll
**API Routes:** `/api/payroll`
**Features:**
- Salary structure management
- Monthly payroll processing
- Graceful handling when tables are missing

### 5.14 Documents
**Pages:** Document List, Document Upload
**API Routes:** `/api/documents`, `/api/documents/upload`
**Features:**
- File upload and storage
- Document categorization

### 5.15 Subjects
**Pages:** Subject Management
**API Routes:** `/api/subjects`
**Features:**
- Subject CRUD (Add/Edit/Delete)
- Department-wise subject listing

### 5.16 User Profile
**Pages:** Admin/Faculty Profile, Student Profile
**Features:**
- Role-aware profile display (admin/faculty go to `/profile`, students go to `/student/profile`)
- Account details with avatar, name, email, role

---

## 6. Database Schema (34 Tables)

Core tables: `users`, `students`, `faculty`, `admin_staff`, `departments`, `programs`, `academic_years`, `subjects`, `attendance`, `exams`, `exam_results`, `fees`, `fee_payments`, `fee_structures`, `library_books`, `library_issues`, `hostel_blocks`, `hostel_rooms`, `hostel_allocations`, `transport_routes`, `transport_vehicles`, `transport_allocations`, `notifications`, `documents`, `payroll`, `salary_components`, `monthly_salaries`, `settings`, and more.

**Security:** Row-Level Security (RLS) enabled on all tables with policies for admin, faculty, and student roles.

---

## 7. UI/UX Design

### Light Mode
- **Sidebar:** Black background with white text
- **Content Area:** Light gray background (`oklch(0.97 0 0)`) with white card containers
- **Primary Accent:** Teal (`oklch(0.30 0.04 180)`) for buttons, links, and interactive elements
- **Borders:** Visible gray borders on cards and inputs
- **Profile:** Clean card layout with gray icon circles, no colored banners

### Dark Mode
- **Sidebar:** Dark gray background
- **Content Area:** Pure black/gray palette
- **Cards:** Pop-out contrast (slightly lighter than background with subtle borders)
- **Primary:** Blue/purple accent
- **Toggle:** Light/Dark/System toggle in header

### Layout Structure
- Fixed sidebar (264px) with collapsible mobile drawer
- Sticky header with search bar, notifications, theme toggle, and user dropdown
- Main content area with responsive padding (`p-4 sm:p-6 lg:p-8`)
- Cards with proper spacing and visual separation

---

## 8. Security

- All 35 API routes use `requireAuth`, `requireAdmin`, or `requireFacultyOrAdmin` middleware
- Auth helpers include try-catch blocks for graceful error handling
- Missing database tables return empty data instead of crashing
- Supabase Row-Level Security (RLS) enabled on all 34 tables
- Role-based access control enforced at both API and UI levels
- Vercel deployment protection disabled for API route access

---

## 9. Deployment History (Git Log)

| Date       | Commit Message                                                        |
|------------|-----------------------------------------------------------------------|
| 2026-08-21 | TSR CMS: College Management System with dark theme + Capacitor config|
| 2026-08-21 | Security: Add auth to all 31 API routes + dark theme + Capacitor config|
| 2026-08-21 | Security + dark theme + Capacitor + chart fix                         |
| 2026-08-21 | Fix: Quick Actions now navigate to correct pages                      |
| 2026-08-21 | Fix: Logout now properly clears cookies and redirects to login        |
| 2026-08-21 | Fix: Bulletproof logout - clear all cookies client+server + force redirect|
| 2026-08-22 | Fix: Logout clears Supabase cookies via Set-Cookie headers directly  |
| 2026-08-22 | Fix: Robust auth (try-catch), handle missing tables gracefully, add favicon|
| 2026-08-22 | Add subjects management page + API route + sidebar link               |
| 2026-08-22 | Fix: Sidebar logout onClick, favicon, better error handling          |
| 2026-08-22 | Fix logout: plain link nav, GET+POST handlers, Supabase signOut, 302 redirect|
| 2026-08-22 | Fix: dropdown menu, profile page, navy light mode, dark mode reverted, layout spacing|
| 2026-08-22 | Light mode: black/gray/teal, profile blue banner removed, dark mode unchanged|

---

## 10. Accounts & Access

| Email                             | Role   | Notes                    |
|-----------------------------------|--------|--------------------------|
| admin@example.com                 | Admin  | Full system access       |
| student@example.com             | Student| Student portal access    |

---

## 11. Infrastructure

- **Supabase Project:** _(redacted - see .env.example)_
- **Supabase URL:** _(redacted - set NEXT_PUBLIC_SUPABASE_URL locally)_
- **Vercel Project:** tsr-cms
- **GitHub Repo:** shreesaransairam19-lab/tsr-cms
- **Free Tier:** Supabase (database + auth) + Vercel (hosting) = No cost

---

## 12. Known Issues & Future Work

### Current Limitations
- Google Sheets integration requires OAuth setup
- No custom domain configured yet
- APK needs rebuild after each Vercel URL change
- Payroll/salary tables may not be populated in Supabase

### Future Enhancements
- Custom domain (e.g., your-domain.com)
- Push notifications for mobile app
- SMS integration via Twilio
- Multi-language support
- Advanced analytics dashboard
- Parent portal
- Online exam module
- Alumni management
