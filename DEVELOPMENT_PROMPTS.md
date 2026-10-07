# TSR CMS - Development Prompts for OpenCode/Antigravity

## How to Use This Document

This document contains detailed prompts for building the TSR College Management System. Use these prompts in sequence with OpenCode/Antigravity AI coding agents.

**Instructions:**
1. Start with Phase 1 prompts
2. Complete each prompt before moving to the next
3. Test each module before proceeding
4. Keep the ARCHITECTURE.md file open for reference

---

## Phase 1: Project Setup (Days 1-3)

### Prompt 1.1: Initialize Next.js Project

```
Create a Next.js 14+ project with App Router for a College Management System called "TSR CMS".

Requirements:
1. Initialize with: npx create-next-app@latest tsr-cms --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
2. Install dependencies:
   - @supabase/supabase-js
   - @supabase/ssr
   - react-hook-form
   - zod
   - @hookform/resolvers
   - shadcn/ui components (button, card, input, label, select, table, dialog, dropdown-menu, toast, tabs, badge, avatar, separator, sheet, tooltip)
   - recharts (for charts)
   - date-fns
   - lucide-react (icons)
   - class-variance-authority
   - clsx
   - tailwind-merge

3. Set up folder structure:
   src/
   ├── app/
   │   ├── (auth)/
   │   ├── (dashboard)/
   │   ├── api/
   │   └── layout.tsx
   ├── components/
   │   ├── ui/
   │   ├── forms/
   │   ├── tables/
   │   └── layout/
   ├── lib/
   │   ├── supabase/
   │   ├── utils/
   │   └── validators/
   ├── hooks/
   ├── types/
   └── styles/

4. Configure tailwind.config.ts with custom colors for the college theme:
   - Primary: #1E3A5F (Navy Blue - college color)
   - Secondary: #E91E63 (Pink - accent color)
   - Background: #F8FAFC
   - Foreground: #1E293B

5. Create .env.local with placeholder values:
   NEXT_PUBLIC_SUPABASE_URL=your-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key

6. Create basic layout with:
   - Responsive sidebar navigation
   - Top header with college logo placeholder
   - Main content area
   - Footer

Output: Complete project structure ready for development.
```

### Prompt 1.2: Supabase Configuration

```
Set up Supabase configuration for the TSR CMS project.

Create the following files:

1. src/lib/supabase/client.ts
   - Browser client initialization
   - Type-safe client with database types

2. src/lib/supabase/server.ts
   - Server client for API routes
   - Cookie-based auth handling

3. src/lib/supabase/middleware.ts
   - Auth middleware for protected routes
   - Role-based route protection

4. src/middleware.ts
   - Next.js middleware setup
   - Protected route definitions:
     - /dashboard/* requires auth
     - /dashboard/admin/* requires admin role
     - /dashboard/faculty/* requires faculty role
     - /dashboard/student/* requires student role

5. src/types/database.ts
   - TypeScript types for all database tables (reference ARCHITECTURE.md section 4)

6. Create a basic Supabase schema file (supabase/schema.sql):
   - All tables from ARCHITECTURE.md section 4
   - Proper constraints and indexes
   - Row Level Security policies

Output: Complete Supabase integration ready for authentication and database operations.
```

### Prompt 1.3: Authentication System

```
Implement complete authentication system for TSR CMS.

Requirements:

1. Create login page (src/app/(auth)/login/page.tsx):
   - Email/password login form
   - Roll number/password login option
   - Remember me checkbox
   - Forgot password link
   - College branding (logo, name, colors)
   - Responsive design
   - Form validation with Zod
   - Error handling with toast notifications

2. Create registration page (src/app/(auth)/register/page.tsx):
   - Student self-registration form
   - Fields: roll_number, email, password, confirm_password, phone
   - Validation rules:
     - Email must be your college domain (e.g., college.edu)
     - Password min 8 chars, 1 uppercase, 1 number, 1 special char
     - Roll number format validation
   - Auto-assign role as 'student'

3. Create forgot password page (src/app/(auth)/forgot-password/page.tsx):
   - Email input form
   - Send reset link button
   - Success/error messages

4. Create password reset page (src/app/(auth)/reset-password/page.tsx):
   - New password form
   - Confirm password
   - Token validation

5. Create auth API routes:
   - POST /api/auth/login
   - POST /api/auth/register
   - POST /api/auth/logout
   - POST /api/auth/forgot-password
   - POST /api/auth/reset-password

6. Create auth hooks:
   - useAuth() - current user, role, login/logout functions
   - useUser() - user profile data

7. Create protected layout (src/app/(dashboard)/layout.tsx):
   - Check auth status
   - Redirect to login if not authenticated
   - Show user info in header
   - Logout functionality

Output: Complete authentication system with login, register, password reset, and route protection.
```

---

## Phase 2: User Management (Days 4-6)

### Prompt 2.1: Student Management Module

```
Build complete Student Management module for TSR CMS.

Requirements:

1. Create student list page (src/app/(dashboard)/students/page.tsx):
   - Data table with columns: Roll No, Name, Department, Program, Semester, Status, Actions
   - Search by name/roll number
   - Filter by department, program, semester, status
   - Pagination (10/25/50/100 per page)
   - Bulk selection with actions
   - Export to Excel/CSV button
   - Add Student button

2. Create student form component (src/components/forms/StudentForm.tsx):
   - Multi-step form with tabs:
     - Personal Info: name, dob, gender, blood_group, nationality, religion, community
     - Contact: address, city, state, pincode, phone, email
     - Academic: department, program, semester, admission_date, batch_year
     - Parent Info: father_name, father_phone, father_occupation, mother_name, mother_phone
     - Documents: photo upload, signature upload
   - Form validation with Zod
   - Auto-generate roll number based on department + batch

3. Create student detail page (src/app/(dashboard)/students/[id]/page.tsx):
   - Profile header with photo, name, roll number
   - Tabs:
     - Overview: personal info, academic info, parent info
     - Attendance: subject-wise attendance with charts
     - Grades: semester-wise results
     - Fees: payment history, outstanding balance
     - Documents: uploaded documents list
   - Edit button (admin only)
   - Print profile button

4. Create student API routes:
   - GET /api/students (list with filters)
   - GET /api/students/:id (detail)
   - POST /api/students (create)
   - PUT /api/students/:id (update)
   - DELETE /api/students/:id (soft delete)
   - POST /api/students/bulk-import (CSV upload)

5. Create student hooks:
   - useStudents(filters) - paginated student list
   - useStudent(id) - single student data
   - useStudentStats() - dashboard statistics

6. Create import functionality:
   - CSV upload component
   - Field mapping interface
   - Validation before import
   - Progress indicator
   - Success/error report

Output: Complete student management with CRUD, search, filter, import, and detailed views.
```

### Prompt 2.2: Faculty Management Module

```
Build complete Faculty Management module for TSR CMS.

Requirements:

1. Create faculty list page (src/app/(dashboard)/faculty/page.tsx):
   - Data table with columns: Emp ID, Name, Department, Designation, Qualification, Experience, Status, Actions
   - Search by name/employee ID
   - Filter by department, designation, employment_type
   - Pagination
   - Add Faculty button

2. Create faculty form (src/components/forms/FacultyForm.tsx):
   - Personal Info: name, dob, gender, phone, email, address
   - Professional: department, designation, qualification, specialization, experience, date_of_joining, employment_type
   - Documents: photo, resume upload
   - Account: email, password (for new faculty)

3. Create faculty detail page (src/app/(dashboard)/faculty/[id]/page.tsx):
   - Profile header
   - Tabs:
     - Profile: personal and professional info
     - Classes: assigned subjects and schedule
     - Attendance: classes taken
     - Students: students under guidance (if HOD)
     - Documents: uploaded documents

4. Create faculty API routes:
   - GET /api/faculty
   - GET /api/faculty/:id
   - POST /api/faculty
   - PUT /api/faculty/:id
   - DELETE /api/faculty/:id
   - GET /api/faculty/:id/classes
   - GET /api/faculty/:id/students

5. Create faculty assignment feature:
   - Assign faculty to subjects
   - Assign class advisor to students
   - Assign HOD to departments

Output: Complete faculty management with CRUD, assignments, and detailed views.
```

### Prompt 2.3: Department & Program Management

```
Build Department and Program management for TSR CMS.

Requirements:

1. Create department page (src/app/(dashboard)/admin/departments/page.tsx):
   - List all departments with stats
   - Add/Edit/Delete department
   - Assign HOD to department
   - View department faculty and students

2. Create program page (src/app/(dashboard)/admin/programs/page.tsx):
   - List all programs grouped by department
   - Add/Edit/Delete program
   - Configure program settings:
     - Duration (years/semesters)
     - Grading system
     - Total credits
     - Maximum intake

3. Create academic year/semester management:
   - Create academic year
   - Create semesters for each program
   - Set semester dates
   - Mark current semester

4. Create subject management:
   - Add/Edit/Delete subjects
   - Assign to programs and semesters
   - Set credits, hours (lecture/tutorial/practical)
   - Mark as elective if applicable

5. Create admin pages:
   - src/app/(dashboard)/admin/page.tsx (admin dashboard)
   - src/app/(dashboard)/admin/departments/
   - src/app/(dashboard)/admin/programs/
   - src/app/(dashboard)/admin/subjects/
   - src/app/(dashboard)/admin/academic-years/

6. Create API routes for all admin operations

Output: Complete academic structure management for departments, programs, semesters, and subjects.
```

---

## Phase 3: Attendance Module (Days 7-9)

### Prompt 3.1: Attendance System

```
Build complete Attendance module for TSR CMS.

Requirements:

1. Create attendance marking page (Faculty):
   - src/app/(dashboard)/faculty/attendance/mark/page.tsx
   - Select: Department → Program → Semester → Subject → Date
   - Display student list with roll numbers and names
   - Toggle buttons for each student: Present (P), Absent (A), Late (L), On Duty (OD)
   - Mark All Present/Assign All buttons
   - Save attendance with confirmation
   - Edit attendance for past dates (admin only)

2. Create attendance view page (Student):
   - src/app/(dashboard)/student/attendance/page.tsx
   - Subject-wise attendance summary
   - Percentage calculation
   - Calendar view of attendance
   - Download attendance report

3. Create attendance report page:
   - src/app/(dashboard)/reports/attendance/page.tsx
   - Filters: department, program, semester, subject, date range
   - Student-wise report
   - Subject-wise report
   - Class-wise report
   - Low attendance alerts (<75%)

4. Create attendance components:
   - AttendanceGrid - interactive grid for marking
   - AttendanceCalendar - calendar view
   - AttendanceChart - visual attendance stats
   - AttendanceReport - printable report

5. Create API routes:
   - GET /api/attendance (list with filters)
   - POST /api/attendance (mark attendance)
   - PUT /api/attendance/:id (update)
   - GET /api/attendance/report (generate report)
   - POST /api/attendance/bulk-import (import from CSV)

6. Create attendance hooks:
   - useAttendance(filters) - get attendance data
   - useAttendanceStats(studentId) - student stats
   - useMarkAttendance() - mutation for marking

Output: Complete attendance system with marking, viewing, reporting, and alerts.
```

### Prompt 3.2: Attendance Bulk Import

```
Build attendance bulk import feature for TSR CMS.

Requirements:

1. Create import page:
   - src/app/(dashboard)/faculty/attendance/import/page.tsx
   - CSV upload with drag-and-drop
   - Template download button
   - Field mapping interface
   - Validation preview
   - Import progress
   - Success/error report

2. CSV Template format:
   roll_number, date, subject_code, status, remarks
   2024CSE001, 2026-08-15, CS101, P,
   2024CSE002, 2026-08-15, CS101, A, Medical leave

3. Validation rules:
   - Roll number must exist
   - Subject code must exist
   - Date must be valid
   - Status must be P/A/L/OD
   - No duplicate entries

4. Import process:
   - Parse CSV
   - Validate all rows
   - Show preview with errors highlighted
   - Confirm import
   - Insert records
   - Show summary (imported/skipped/errors)

5. Create import API:
   - POST /api/attendance/import
   - Accepts CSV file
   - Returns validation results
   - Returns import summary

Output: Complete bulk import with validation, preview, and error handling.
```

---

## Phase 4: Examination & Grades (Days 10-13)

### Prompt 4.1: Exam Management

```
Build Examination Management module for TSR CMS.

Requirements:

1. Create exam schedule page (Admin):
   - src/app/(dashboard)/admin/exams/page.tsx
   - Create exam schedule:
     - Select semester
     - Add exam slots:
       - Subject
       - Exam type (Internal/External/Practical/Viva)
       - Date
       - Time
       - Room
       - Max marks
       - Min marks
   - View/Edit/Delete exams
   - Publish schedule

2. Create internal assessment entry (Faculty):
   - src/app/(dashboard)/faculty/exams/enter-marks/page.tsx
   - Select: Department → Program → Semester → Subject → Assessment Type
   - Enter marks for each student:
     - Test 1 marks
     - Test 2 marks
     - Assignment marks
     - Viva marks
   - Auto-calculate internal marks
   - Save draft / Submit final

3. Create external marks entry (Admin):
   - src/app/(dashboard)/admin/exams/external-marks/page.tsx
   - Import marks from CSV
   - Manual entry option
   - Calculate total marks
   - Calculate grades based on grading system

4. Create grade calculation logic:
   - src/lib/utils/grade-calculator.ts
   - Support multiple grading systems:
     - Marks + Percentage
     - Letter grades (O, A+, A, B+, B, C, F)
     - GPA/CGPA
     - Credit-based
   - Configurable per program

5. Create exam API routes:
   - GET /api/exams
   - POST /api/exams
   - PUT /api/exams/:id
   - DELETE /api/exams/:id
   - POST /api/exams/:id/marks
   - GET /api/exams/:id/results
   - POST /api/exams/:id/results/publish

6. Create exam components:
   - ExamScheduleTable
   - MarksEntryForm
   - GradeCalculator
   - ResultSheet

Output: Complete exam management with scheduling, marks entry, grade calculation, and result publication.
```

### Prompt 4.2: Results & Grade Cards

```
Build Results and Grade Card system for TSR CMS.

Requirements:

1. Create result publication page (Admin):
   - src/app/(dashboard)/admin/exams/results/page.tsx
   - Select semester
   - View all students' results
   - Calculate SGPA/CGPA
   - Publish results
   - Generate grade cards

2. Create student result view:
   - src/app/(dashboard)/student/results/page.tsx
   - Semester-wise results
   - Subject-wise marks and grades
   - SGPA/CGPA display
   - Download grade card PDF

3. Create grade card generation:
   - src/lib/utils/grade-card-generator.ts
   - Generate PDF grade card with:
     - College header and logo
     - Student details
     - Subject-wise marks
     - Grades and credits
     - SGPA/CGPA
     - Result status
     - Signature placeholders

4. Create result API routes:
   - GET /api/results?studentId=&semesterId=
   - POST /api/results/calculate (calculate SGPA/CGPA)
   - POST /api/results/publish
   - GET /api/results/grade-card/:studentId/:semesterId

5. Create result components:
   - ResultTable - displays marks and grades
   - GradeCard - printable grade card
   - SGPAChart - visual CGPA progress

6. Create result hooks:
   - useResults(studentId, semesterId)
   - useCalculateResults()
   - usePublishResults()

Output: Complete results system with calculation, publication, and grade card generation.
```

---

## Phase 5: Fee Management (Days 14-17)

### Prompt 5.1: Fee Structure & Collection

```
Build complete Fee Management module for TSR CMS.

Requirements:

1. Create fee structure page (Admin):
   - src/app/(dashboard)/admin/fees/structure/page.tsx
   - Configure fee structure per program:
     - Tuition fee
     - Lab fee
     - Library fee
     - Exam fee
     - Hostel fee (if applicable)
     - Transport fee (if applicable)
     - Other fees
   - Set amounts and due dates
   - Late fee configuration
   - Copy structure from previous year

2. Create fee collection page:
   - src/app/(dashboard)/admin/fees/collect/page.tsx
   - Search student by roll number
   - Display outstanding fees
   - Select fees to pay
   - Payment options:
     - Cash
     - Online (Razorpay)
     - Cheque/DD
   - Generate receipt
   - Print receipt

3. Create online payment integration:
   - src/app/(dashboard)/student/fees/pay/page.tsx
   - Display student's fee structure
   - Select fees to pay
   - Razorpay checkout integration
   - Payment confirmation
   - Receipt generation

4. Create fee report pages:
   - src/app/(dashboard)/reports/fees/page.tsx
   - Collection summary
   - Outstanding dues
   - Day-wise collection
   - Student-wise fees
   - Department-wise collection

5. Create fee API routes:
   - GET /api/fees/structure
   - POST /api/fees/structure
   - GET /api/fees/student/:id
   - POST /api/fees/collect
   - POST /api/fees/payment/razorpay
   - GET /api/fees/receipt/:id
   - GET /api/fees/reports

6. Create fee components:
   - FeeStructureForm
   - FeeCollectionForm
   - PaymentGateway (Razorpay)
   - FeeReceipt
   - OutstandingTable

Output: Complete fee management with structure, collection, online payment, and reports.
```

### Prompt 5.2: Razorpay Integration

```
Implement Razorpay payment integration for TSR CMS.

Requirements:

1. Create Razorpay utility:
   - src/lib/utils/razorpay.ts
   - Initialize Razorpay with key
   - Create order function
   - Verify payment function
   - Refund function

2. Create payment API routes:
   - POST /api/payment/create-order
   - POST /api/payment/verify
   - POST /api/payment/refund

3. Create payment component:
   - src/components/payment/RazorpayCheckout.tsx
   - Load Razorpay script
   - Open checkout modal
   - Handle success/failure
   - Display receipt

4. Create payment flow:
   - Student selects fees to pay
   - Backend creates Razorpay order
   - Frontend opens Razorpay checkout
   - Student completes payment
   - Backend verifies payment
   - Update fee payment record
   - Generate receipt
   - Send confirmation SMS/email

5. Handle edge cases:
   - Payment timeout
   - Network failure
   - Duplicate payment prevention
   - Refund processing

6. Create payment settings (Admin):
   - Configure Razorpay keys
   - Enable/disable online payment
   - Set payment gateway preferences

Output: Complete Razorpay integration with order creation, verification, and receipt generation.
```

---

## Phase 6: Library Module (Days 18-20)

### Prompt 6.1: Library Management

```
Build Library Management module for TSR CMS.

Requirements:

1. Create book catalog page:
   - src/app/(dashboard)/library/books/page.tsx
   - List all books with details
   - Search by title, author, ISBN
   - Filter by category, department
   - Add/Edit/Delete books
   - View availability

2. Create book issue page:
   - src/app/(dashboard)/library/issue/page.tsx
   - Search student by roll number
   - Display student's current issues
   - Issue new book:
     - Scan/enter book ID
     - Set due date (default: 14 days)
     - Confirm issue
   - Return book:
     - Scan/enter book ID
     - Calculate fine if overdue
     - Process fine payment
     - Update book availability

3. Create student library page:
   - src/app/(dashboard)/student/library/page.tsx
   - View available books
   - My issued books
   - Due dates
   - Fine details
   - Renew books (if no one waiting)

4. Create library reports:
   - Most borrowed books
   - Overdue books
   - Fine collection
   - Book availability summary

5. Create library API routes:
   - GET /api/library/books
   - POST /api/library/books
   - PUT /api/library/books/:id
   - DELETE /api/library/books/:id
   - POST /api/library/issue
   - POST /api/library/return
   - GET /api/library/my-books/:studentId
   - GET /api/library/reports

6. Create library components:
   - BookCatalog
   - IssueForm
   - ReturnForm
   - FineCalculator
   - BookAvailability

Output: Complete library management with catalog, issue/return, fine calculation, and reports.
```

---

## Phase 7: Hostel & Transport (Days 21-23)

### Prompt 7.1: Hostel Management

```
Build Hostel Management module for TSR CMS.

Requirements:

1. Create hostel management page (Admin):
   - src/app/(dashboard)/admin/hostel/page.tsx
   - Manage hostel blocks (Boys/Girls)
   - Manage rooms (number, capacity, type)
   - View occupancy
   - Allocate rooms to students
   - Transfer/deallocate rooms

2. Create student hostel page:
   - src/app/(dashboard)/student/hostel/page.tsx
   - View current allocation
   - Room details
   - Roommate info
   - Hostel fee status
   - Submit complaint

3. Create hostel fee tracking:
   - Configure hostel fees per room type
   - Track payments
   - Generate receipts

4. Create hostel reports:
   - Occupancy report
   - Fee collection
   - Complaint status

5. Create hostel API routes:
   - GET /api/hostel/blocks
   - POST /api/hostel/blocks
   - GET /api/hostel/rooms
   - POST /api/hostel/rooms
   - POST /api/hostel/allocate
   - DELETE /api/hostel/allocate/:id
   - GET /api/hostel/complaints
   - POST /api/hostel/complaints

Output: Complete hostel management with room allocation, tracking, and fee management.
```

### Prompt 7.2: Transport Management

```
Build Transport Management module for TSR CMS.

Requirements:

1. Create transport management page (Admin):
   - src/app/(dashboard)/admin/transport/page.tsx
   - Manage bus routes
   - Manage stops for each route
   - Set fare for each stop
   - Allocate students to routes
   - Track transport fee payments

2. Create student transport page:
   - src/app/(dashboard)/student/transport/page.tsx
   - View available routes
   - View my route allocation
   - Bus schedule
   - Transport fee status

3. Create transport API routes:
   - GET /api/transport/routes
   - POST /api/transport/routes
   - GET /api/transport/routes/:id/stops
   - POST /api/transport/routes/:id/stops
   - POST /api/transport/allocate
   - GET /api/transport/my-route/:studentId

Output: Complete transport management with route management, allocation, and fee tracking.
```

---

## Phase 8: Notifications (Days 24-25)

### Prompt 8.1: Notification System

```
Build Notification System for TSR CMS.

Requirements:

1. Create notification center:
   - src/app/(dashboard)/notifications/page.tsx
   - View all notifications
   - Mark as read/unread
   - Filter by type (SMS, Email, WhatsApp)
   - Filter by status (Sent, Delivered, Failed)

2. Create notification templates:
   - src/app/(dashboard)/admin/notifications/templates/page.tsx
   - Pre-defined templates:
     - Fee reminder
     - Exam schedule
     - Result publication
     - Attendance alert
     - General announcement
   - Custom template creation
   - Variable support ({{student_name}}, {{amount}}, etc.)

3. Create bulk notification:
   - Send to all students
   - Send to specific department/program
   - Send to individual student
   - Schedule notifications

4. Create notification API routes:
   - GET /api/notifications
   - POST /api/notifications/send
   - POST /api/notifications/bulk-send
   - GET /api/notifications/templates
   - POST /api/notifications/templates

5. Create notification integrations:
   - MSG91 for SMS
   - SMTP for Email
   - WhatsApp Business API (optional)

6. Create notification components:
   - NotificationCenter
   - NotificationBell (in header)
   - NotificationForm
   - TemplateEditor

Output: Complete notification system with SMS, Email, templates, and bulk sending.
```

---

## Phase 9: Document Management (Days 26-27)

### Prompt 9.1: Document Management

```
Build Document Management module for TSR CMS.

Requirements:

1. Create document upload page:
   - src/app/(dashboard)/documents/upload/page.tsx
   - Drag-and-drop upload
   - Multiple file support
   - File type validation (PDF, JPG, PNG)
   - File size limit (5MB)
   - Document type selection:
     - ID Proof
     - Photograph
     - Signature
     - certificates
     - Mark sheets
     - Medical documents
   - Upload progress

2. Create document library:
   - src/app/(dashboard)/documents/page.tsx
   - View uploaded documents
   - Filter by type
   - Download documents
   - Delete documents (admin)

3. Create document approval (Admin):
   - src/app/(dashboard)/admin/documents/page.tsx
   - View pending documents
   - Approve/Reject with remarks
   - View document history

4. Create document API routes:
   - GET /api/documents
   - POST /api/documents/upload
   - DELETE /api/documents/:id
   - PUT /api/documents/:id/approve
   - PUT /api/documents/:id/reject

5. Create document components:
   - FileUploader
   - DocumentList
   - DocumentViewer
   - ApprovalWorkflow

Output: Complete document management with upload, storage, and approval workflow.
```

---

## Phase 10: Reports & Analytics (Days 28-30)

### Prompt 10.1: Dashboard & Analytics

```
Build Dashboard and Analytics module for TSR CMS.

Requirements:

1. Create admin dashboard:
   - src/app/(dashboard)/admin/page.tsx
   - Key metrics cards:
     - Total students
     - Total faculty
     - Attendance today
     - Fee collection this month
   - Charts:
     - Student enrollment by department
     - Attendance trend (last 30 days)
     - Fee collection trend
     - Placement statistics
   - Recent activities
   - Quick actions

2. Create faculty dashboard:
   - src/app/(dashboard)/faculty/page.tsx
   - My classes today
   - Pending attendance
   - My students count
   - Recent activities

3. Create student dashboard:
   - src/app/(dashboard)/student/page.tsx
   - Attendance summary
   - Upcoming exams
   - Fee status
   - Recent notifications
   - CGPA progress

4. Create reports page:
   - src/app/(dashboard)/reports/page.tsx
   - Report categories:
     - Academic reports
     - Attendance reports
     - Fee reports
     - Placement reports
     - NAAC/NBA reports

5. Create export functionality:
   - PDF export for all reports
   - Excel/CSV export
   - Print-friendly views

6. Create report components:
   - MetricCard
   - ChartWrapper
   - ReportTable
   - ExportButton

Output: Complete dashboard with analytics, charts, and export functionality.
```

### Prompt 10.2: NAAC/NBA Report Generation

```
Build NAAC/NBA report generation for TSR CMS.

Requirements:

1. Create NAAC report templates:
   - src/lib/reports/naac.ts
   - Criterian-wise data collection:
     - Curricular Aspects
     - Teaching-Learning & Evaluation
     - Research, Innovation & Extension
     - Infrastructure & Learning Resources
     - Student Support & Progression
     - Governance, Leadership & Management
     - Institutional Values & Best Practices

2. Create NBA report templates:
   - src/lib/reports/nba.ts
   - Program outcome assessment
   - Course outcome assessment
   - Performance metrics

3. Create report generation page:
   - src/app/(dashboard)/reports/naac/page.tsx
   - Select academic year
   - Auto-fetch relevant data
   - Generate report in required format
   - Download as PDF/Excel

4. Create data aggregation functions:
   - Student statistics
   - Faculty statistics
   - Academic performance
   - Infrastructure details
   - Research outputs

Output: Complete NAAC/NBA report generation with auto-populated data.
```

---

## Phase 11: Admin Settings (Days 31-32)

### Prompt 11.1: System Configuration

```
Build Admin Settings module for TSR CMS.

Requirements:

1. Create settings page:
   - src/app/(dashboard)/admin/settings/page.tsx
   - Tabbed interface:
     - General: College name, logo, address, contact
     - Academic: Current academic year, grading system
     - Departments: Manage departments
     - Programs: Manage programs
     - Notification: SMS/Email/WhatsApp settings
     - Payment: Razorpay configuration
     - Storage: File upload limits
     - Users: User management settings

2. Create college branding:
   - Upload college logo
   - Set primary/secondary colors
   - Configure footer text

3. Create academic configuration:
   - Set current academic year
   - Configure grading rules per program
   - Set attendance thresholds
   - Configure exam patterns

4. Create notification configuration:
   - MSG91 API key and sender ID
   - SMTP settings
   - WhatsApp API settings
   - Notification templates

5. Create payment configuration:
   - Razorpay key ID and secret
   - Enable/disable online payment
   - Set payment gateway preferences

6. Create settings API routes:
   - GET /api/settings
   - PUT /api/settings
   - GET /api/settings/:key
   - PUT /api/settings/:key

Output: Complete admin settings with all configuration options.
```

---

## Phase 12: Google Sheets Integration (Days 33-34)

### Prompt 12.1: Google Sheets Import/Export

```
Build Google Sheets integration for TSR CMS.

Requirements:

1. Create Google Sheets utility:
   - src/lib/utils/google-sheets.ts
   - Initialize Google Sheets API
   - Read from spreadsheet
   - Write to spreadsheet
   - Format data

2. Create import from Google Sheets:
   - src/app/(dashboard)/admin/import/google-sheets/page.tsx
   - Enter Google Sheet URL
   - Select sheet/tab
   - Field mapping interface
   - Data preview
   - Validation
   - Import with progress

3. Create export to Google Sheets:
   - src/app/(dashboard)/admin/export/google-sheets/page.tsx
   - Select data type (Students, Faculty, etc.)
   - Apply filters
   - Create new sheet or update existing
   - Export with progress

4. Create sync functionality:
   - Auto-sync option
   - Manual sync trigger
   - Sync status tracking
   - Conflict resolution

5. Create import/export API routes:
   - POST /api/import/google-sheets
   - POST /api/export/google-sheets
   - GET /api/sync/status
   - POST /api/sync/trigger

6. Create import/export components:
   - GoogleSheetsUrlInput
   - FieldMapper
   - DataPreview
   - SyncStatus

Output: Complete Google Sheets integration with import, export, and sync.
```

---

## Phase 13: Payroll (Days 35-36)

### Prompt 13.1: Basic Payroll System

```
Build basic Payroll module for TSR CMS.

Requirements:

1. Create salary component configuration:
   - src/app/(dashboard)/admin/payroll/components/page.tsx
   - Add/Edit/Delete salary components:
     - Basic Salary
     - HRA
     - DA
     - TA
     - PF (deduction)
     - ESI (deduction)
     - Professional Tax (deduction)
   - Set calculation type (fixed/percentage)

2. Create monthly salary processing:
   - src/app/(dashboard)/admin/payroll/process/page.tsx
   - Select month/year
   - List all faculty
   - Auto-calculate salary based on components
   - Edit individual salary if needed
   - Process salary (mark as paid)
   - Generate payslips

3. Create payslip generation:
   - src/lib/utils/payslip-generator.ts
   - Generate PDF payslip with:
     - College header
     - Faculty details
     - Earnings breakdown
     - Deductions breakdown
     - Net salary
     - Payment details

4. Create salary reports:
   - Monthly salary report
   - Department-wise salary
   - Year-wise salary summary
   - Tax report

5. Create payroll API routes:
   - GET /api/payroll/components
   - POST /api/payroll/components
   - GET /api/payroll/salary/:month/:year
   - POST /api/payroll/salary/process
   - GET /api/payroll/payslip/:facultyId/:month/:year

6. Create payroll components:
   - SalaryComponentForm
   - SalaryProcessingTable
   - PayslipViewer
   - SalaryReport

Output: Complete basic payroll system with salary components, processing, and payslip generation.
```

---

## Phase 14: Testing & Bug Fixes (Days 37-42)

### Prompt 14.1: Integration Testing

```
Perform comprehensive testing for TSR CMS.

Requirements:

1. Create test cases for each module:
   - Authentication (login, register, logout, password reset)
   - Student CRUD (create, read, update, delete)
   - Faculty CRUD
   - Attendance (mark, view, report)
   - Exams (schedule, marks entry, results)
   - Fees (structure, collection, payment)
   - Library (issue, return, fine)
   - Notifications (send, view)

2. Create test data:
   - Sample students (10 per department)
   - Sample faculty (5 per department)
   - Sample subjects
   - Sample attendance records
   - Sample exam results
   - Sample fee payments

3. Test edge cases:
   - Duplicate roll numbers
   - Invalid dates
   - Negative marks
   - Zero attendance
   - Overdue library books

4. Test performance:
   - Large dataset handling (1000+ students)
   - Concurrent user simulation
   - API response times

5. Create test report:
   - Pass/Fail summary
   - Bug list with severity
   - Performance metrics

Output: Complete test suite with test cases, test data, and test report.
```

---

## Phase 15: Deployment (Days 43-46)

### Prompt 15.1: Production Deployment

```
Deploy TSR CMS to production.

Requirements:

1. Prepare for deployment:
   - Update .env.production with production values
   - Run database migrations
   - Seed initial data (departments, programs, subjects)
   - Create admin user account

2. Deploy Supabase:
   - Create production project
   - Run schema.sql
   - Configure RLS policies
   - Set up storage buckets

3. Deploy Vercel:
   - Connect GitHub repository
   - Configure build settings
   - Set environment variables
   - Deploy to production

4. Post-deployment:
   - Test all critical functions
   - Verify email/SMS sending
   - Verify payment gateway
   - Create backup schedule

5. Documentation:
   - User manual
   - Admin guide
   - API documentation
   - Troubleshooting guide

6. Training:
   - Admin training session
   - Faculty training session
   - Student orientation

Output: Fully deployed and operational TSR CMS.
```

---

## Summary

### Total Prompts: 15 phases, ~30 detailed prompts

### Estimated Tokens per Phase:
- Phase 1-2 (Setup): ~80K tokens
- Phase 3-4 (Academic): ~100K tokens
- Phase 5-6 (Finance): ~80K tokens
- Phase 7-8 (Services): ~60K tokens
- Phase 9-10 (Reports): ~60K tokens
- Phase 11-14 (Config/Test): ~80K tokens
- Phase 15 (Deployment): ~40K tokens

### Total Estimated Tokens: ~500K - 600K tokens

### Development Timeline: 46 days (~6-7 weeks)

---

## Quick Reference

### Key Files to Create:
1. src/lib/supabase/client.ts
2. src/lib/supabase/server.ts
3. src/types/database.ts
4. src/middleware.ts
5. src/lib/utils/grade-calculator.ts
6. src/lib/utils/razorpay.ts
7. src/lib/utils/google-sheets.ts
8. supabase/schema.sql

### Key Dependencies:
- next
- @supabase/supabase-js
- @supabase/ssr
- react-hook-form
- zod
- shadcn/ui
- recharts
- razorpay
- googleapis

### Environment Variables Required:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- RAZORPAY_KEY_ID
- RAZORPAY_KEY_SECRET
- MSG91_API_KEY
- SMTP credentials
- GOOGLE_SHEETS_CREDENTIALS

---

**Document Version:** 1.0  
**Last Updated:** August 2026  
**Status:** Ready for Development
