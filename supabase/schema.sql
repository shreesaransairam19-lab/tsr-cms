-- ============================================================
-- TSR CMS - Complete Database Schema
-- TSR
-- TSR
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TRIGGER FUNCTION: Auto-update updated_at column
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. DEPARTMENTS
-- ============================================================
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    short_name VARCHAR(20) NOT NULL,
    hod_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. ACADEMIC YEARS
-- ============================================================
CREATE TABLE academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    year VARCHAR(10) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. PROGRAMS
-- ============================================================
CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('UG', 'PG', 'PHD')),
    duration_years INTEGER NOT NULL DEFAULT 4,
    total_semesters INTEGER NOT NULL DEFAULT 8,
    total_credits INTEGER NOT NULL DEFAULT 180,
    grading_system VARCHAR(20) NOT NULL DEFAULT '10_point' CHECK (grading_system IN ('4_point', '10_point', 'letter_grade')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. SEMESTERS
-- ============================================================
CREATE TABLE semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    semester_number INTEGER NOT NULL CHECK (semester_number BETWEEN 1 AND 12),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(academic_year_id, program_id, semester_number)
);

-- ============================================================
-- 5. SUBJECTS
-- ============================================================
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 12),
    code VARCHAR(20) NOT NULL,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('theory', 'practical', 'project')),
    credits INTEGER NOT NULL DEFAULT 3,
    lecture_hours INTEGER NOT NULL DEFAULT 0,
    tutorial_hours INTEGER NOT NULL DEFAULT 0,
    practical_hours INTEGER NOT NULL DEFAULT 0,
    is_elective BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(program_id, code)
);

-- ============================================================
-- 6. USERS (Supabase Auth linked)
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE,
    -- Login by username. Supabase Auth needs an email, so /api/auth/login
    -- resolves a username to the account's email before signing in.
    username VARCHAR(50),
    phone VARCHAR(15) UNIQUE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'admin', 'hod', 'faculty', 'student')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 7. STUDENTS
-- ============================================================
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    roll_number VARCHAR(20) NOT NULL UNIQUE,
    admission_number VARCHAR(30) UNIQUE,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE RESTRICT,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    current_semester INTEGER NOT NULL DEFAULT 1 CHECK (current_semester BETWEEN 1 AND 12),
    admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    batch_year INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'passed_out', 'dropped', 'suspended', 'transferred')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    blood_group VARCHAR(5) CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    nationality VARCHAR(50) DEFAULT 'Indian',
    religion VARCHAR(50),
    community VARCHAR(20) CHECK (community IN ('OC', 'BC', 'MBC', 'DNC', 'SC', 'ST')),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100) DEFAULT 'Tamil Nadu',
    pincode VARCHAR(6),
    father_name VARCHAR(200),
    father_phone VARCHAR(15),
    father_occupation VARCHAR(100),
    mother_name VARCHAR(200),
    mother_phone VARCHAR(15),
    guardian_name VARCHAR(200),
    guardian_phone VARCHAR(15),
    tenth_percentage DECIMAL(5,2) CHECK (tenth_percentage BETWEEN 0 AND 100),
    twelfth_percentage DECIMAL(5,2) CHECK (twelfth_percentage BETWEEN 0 AND 100),
    cut_off_marks DECIMAL(5,2) CHECK (cut_off_marks BETWEEN 0 AND 200),
    entrance_exam_score DECIMAL(7,2),
    photo_url TEXT,
    signature_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 8. FACULTY
-- ============================================================
CREATE TABLE faculty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(20) NOT NULL UNIQUE,
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
    designation VARCHAR(100) NOT NULL,
    qualification VARCHAR(200),
    specialization VARCHAR(200),
    experience_years INTEGER DEFAULT 0,
    date_of_joining DATE NOT NULL DEFAULT CURRENT_DATE,
    employment_type VARCHAR(20) NOT NULL DEFAULT 'permanent' CHECK (employment_type IN ('permanent', 'contract', 'visiting', 'adjunct')),
    salary DECIMAL(12,2),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    phone VARCHAR(15),
    email VARCHAR(255),
    address TEXT,
    photo_url TEXT,
    resume_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_faculty_updated_at
    BEFORE UPDATE ON faculty
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update departments.hod_id foreign key after faculty table exists
ALTER TABLE departments
    ADD CONSTRAINT fk_departments_hod
    FOREIGN KEY (hod_id) REFERENCES faculty(id) ON DELETE SET NULL;

-- ============================================================
-- 9. ADMIN STAFF
-- ============================================================
CREATE TABLE admin_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(20) NOT NULL UNIQUE,
    department VARCHAR(100),
    designation VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    email VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 10. ATTENDANCE CLASSES
-- ============================================================
CREATE TABLE attendance_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE RESTRICT,
    semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    class_type VARCHAR(20) NOT NULL CHECK (class_type IN ('lecture', 'lab', 'tutorial', 'seminar')),
    room VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 11. ATTENDANCE RECORDS
-- ============================================================
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES attendance_classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(2) NOT NULL CHECK (status IN ('P', 'A', 'L', 'OD')),
    remarks TEXT,
    marked_by UUID REFERENCES faculty(id) ON DELETE SET NULL,
    marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(class_id, student_id)
);

-- ============================================================
-- 12. EXAM SCHEDULE
-- ============================================================
CREATE TABLE exam_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    exam_type VARCHAR(30) NOT NULL CHECK (exam_type IN ('internal_1', 'internal_2', 'internal_3', 'model', 'semester', 'backlog')),
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(50),
    max_marks INTEGER NOT NULL DEFAULT 100,
    min_marks INTEGER NOT NULL DEFAULT 40,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 13. INTERNAL ASSESSMENTS
-- ============================================================
CREATE TABLE internal_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    assessment_type VARCHAR(30) NOT NULL CHECK (assessment_type IN ('assignment', 'quiz', 'viva', 'lab_record', 'project', 'attendance')),
    marks_obtained DECIMAL(5,2) NOT NULL CHECK (marks_obtained >= 0),
    max_marks DECIMAL(5,2) NOT NULL CHECK (max_marks > 0),
    assessed_by UUID REFERENCES faculty(id) ON DELETE SET NULL,
    assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 14. EXAM RESULTS
-- ============================================================
CREATE TABLE exam_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    exam_type VARCHAR(30) NOT NULL CHECK (exam_type IN ('internal_1', 'internal_2', 'internal_3', 'model', 'semester', 'backlog')),
    marks_obtained DECIMAL(5,2) NOT NULL CHECK (marks_obtained >= 0),
    max_marks DECIMAL(5,2) NOT NULL CHECK (max_marks > 0),
    grade VARCHAR(5),
    grade_points DECIMAL(3,1) CHECK (grade_points BETWEEN 0 AND 10),
    credits INTEGER NOT NULL DEFAULT 0,
    result_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (result_status IN ('pending', 'pass', 'fail', 'absent', 'withheld')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, subject_id, semester_id, exam_type)
);

-- ============================================================
-- 15. SEMESTER RESULTS
-- ============================================================
CREATE TABLE semester_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    sgpa DECIMAL(4,2) CHECK (sgpa BETWEEN 0 AND 10),
    cgpa DECIMAL(4,2) CHECK (cgpa BETWEEN 0 AND 10),
    total_credits INTEGER NOT NULL DEFAULT 0,
    earned_credits INTEGER NOT NULL DEFAULT 0,
    result_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (result_status IN ('pending', 'pass', 'fail', 'detained')),
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(student_id, semester_id)
);

-- ============================================================
-- 16. FEE STRUCTURES
-- ============================================================
CREATE TABLE fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL CHECK (semester BETWEEN 1 AND 12),
    fee_type VARCHAR(50) NOT NULL CHECK (fee_type IN ('tuition', 'exam', 'lab', 'library', 'hostel', 'transport', 'insurance', 'caution_deposit', 'miscellaneous')),
    amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    due_date DATE NOT NULL,
    late_fee DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (late_fee >= 0),
    late_fee_after DATE,
    is_mandatory BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 17. FEE PAYMENTS
-- ============================================================
CREATE TABLE fee_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    fee_structure_id UUID NOT NULL REFERENCES fee_structures(id) ON DELETE RESTRICT,
    amount_paid DECIMAL(12,2) NOT NULL CHECK (amount_paid > 0),
    payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('online', 'cash', 'bank_transfer', 'cheque', 'dd', 'wallet')),
    transaction_id VARCHAR(100),
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    receipt_number VARCHAR(50) UNIQUE,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 18. FEE RECEIPTS
-- ============================================================
CREATE TABLE fee_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES fee_payments(id) ON DELETE CASCADE,
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    receipt_date DATE NOT NULL DEFAULT CURRENT_DATE,
    student_name VARCHAR(200) NOT NULL,
    roll_number VARCHAR(20) NOT NULL,
    fee_type VARCHAR(50) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL,
    transaction_id VARCHAR(100),
    pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 19. LIBRARY BOOKS
-- ============================================================
CREATE TABLE library_books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    accession_number VARCHAR(30) NOT NULL UNIQUE,
    isbn VARCHAR(20),
    title VARCHAR(300) NOT NULL,
    author VARCHAR(200) NOT NULL,
    publisher VARCHAR(200),
    publication_year INTEGER CHECK (publication_year BETWEEN 1900 AND 2100),
    edition VARCHAR(50),
    category VARCHAR(100) NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    total_copies INTEGER NOT NULL DEFAULT 1 CHECK (total_copies >= 1),
    available_copies INTEGER NOT NULL DEFAULT 1 CHECK (available_copies >= 0),
    location VARCHAR(100),
    price DECIMAL(10,2) CHECK (price >= 0),
    is_reference BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 20. LIBRARY ISSUES
-- ============================================================
CREATE TABLE library_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES library_books(id) ON DELETE RESTRICT,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    return_date DATE,
    renewal_count INTEGER NOT NULL DEFAULT 0 CHECK (renewal_count <= 3),
    fine_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (fine_amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'returned', 'overdue', 'lost')),
    issued_by UUID REFERENCES admin_staff(id) ON DELETE SET NULL,
    returned_to UUID REFERENCES admin_staff(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 21. HOSTEL BLOCKS
-- ============================================================
CREATE TABLE hostel_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('boys', 'girls')),
    total_rooms INTEGER NOT NULL DEFAULT 0 CHECK (total_rooms >= 0),
    warden_name VARCHAR(200),
    warden_phone VARCHAR(15),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 22. HOSTEL ROOMS
-- ============================================================
CREATE TABLE hostel_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_id UUID NOT NULL REFERENCES hostel_blocks(id) ON DELETE CASCADE,
    room_number VARCHAR(20) NOT NULL,
    floor INTEGER NOT NULL DEFAULT 1,
    capacity INTEGER NOT NULL DEFAULT 2 CHECK (capacity BETWEEN 1 AND 8),
    occupied INTEGER NOT NULL DEFAULT 0 CHECK (occupied >= 0),
    room_type VARCHAR(20) NOT NULL DEFAULT 'standard' CHECK (room_type IN ('standard', 'deluxe', 'suite')),
    facilities TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(block_id, room_number)
);

-- ============================================================
-- 23. HOSTEL ALLOCATIONS
-- ============================================================
CREATE TABLE hostel_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES hostel_rooms(id) ON DELETE RESTRICT,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    allocated_date DATE NOT NULL DEFAULT CURRENT_DATE,
    vacated_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'vacated', 'transferred')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 24. TRANSPORT ROUTES
-- ============================================================
CREATE TABLE transport_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_number VARCHAR(20) NOT NULL UNIQUE,
    route_name VARCHAR(200) NOT NULL,
    start_point VARCHAR(200) NOT NULL,
    end_point VARCHAR(200) NOT NULL,
    distance_km DECIMAL(6,2) CHECK (distance_km > 0),
    fare DECIMAL(8,2) NOT NULL CHECK (fare >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 25. TRANSPORT STOPS
-- ============================================================
CREATE TABLE transport_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID NOT NULL REFERENCES transport_routes(id) ON DELETE CASCADE,
    stop_name VARCHAR(200) NOT NULL,
    stop_order INTEGER NOT NULL CHECK (stop_order >= 1),
    arrival_time TIME,
    fare_from_start DECIMAL(8,2) NOT NULL DEFAULT 0 CHECK (fare_from_start >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 26. TRANSPORT ALLOCATIONS
-- ============================================================
CREATE TABLE transport_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES transport_routes(id) ON DELETE RESTRICT,
    pickup_stop_id UUID REFERENCES transport_stops(id) ON DELETE SET NULL,
    drop_stop_id UUID REFERENCES transport_stops(id) ON DELETE SET NULL,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    fee_paid DECIMAL(8,2) NOT NULL DEFAULT 0 CHECK (fee_paid >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 27. DOCUMENT TYPES
-- ============================================================
CREATE TABLE document_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    required_for VARCHAR(100) NOT NULL,
    max_size_mb INTEGER NOT NULL DEFAULT 5 CHECK (max_size_mb > 0),
    allowed_formats TEXT[] NOT NULL DEFAULT ARRAY['pdf', 'jpg', 'png'],
    is_mandatory BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 28. DOCUMENTS
-- ============================================================
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type_id UUID NOT NULL REFERENCES document_types(id) ON DELETE RESTRICT,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT CHECK (file_size > 0),
    file_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'expired')),
    remarks TEXT,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 29. NOTIFICATION TEMPLATES
-- ============================================================
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('sms', 'email', 'whatsapp', 'push')),
    subject VARCHAR(200),
    body TEXT NOT NULL,
    variables JSONB DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 30. NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'info'
        CHECK (type IN ('info', 'warning', 'urgent', 'academic', 'general')),
    -- Mirrors users.role, plus 'all' for a broadcast.
    target_role VARCHAR(20) NOT NULL DEFAULT 'all'
        CHECK (target_role IN ('all', 'super_admin', 'admin', 'hod', 'faculty', 'student')),
    target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    target_department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    target_batch_year INTEGER,
    is_read BOOLEAN NOT NULL DEFAULT false,
    link TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 31. SALARY COMPONENTS
-- ============================================================
CREATE TABLE salary_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('earning', 'deduction')),
    is_fixed BOOLEAN NOT NULL DEFAULT true,
    calculation_type VARCHAR(20) NOT NULL DEFAULT 'fixed' CHECK (calculation_type IN ('fixed', 'percentage')),
    percentage DECIMAL(5,2) CHECK (percentage >= 0 AND percentage <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 32. MONTHLY SALARY
-- ============================================================
CREATE TABLE monthly_salary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year BETWEEN 2000 AND 2100),
    basic_salary DECIMAL(12,2) NOT NULL CHECK (basic_salary >= 0),
    earnings JSONB NOT NULL DEFAULT '{}',
    deductions JSONB NOT NULL DEFAULT '{}',
    gross_salary DECIMAL(12,2) NOT NULL CHECK (gross_salary >= 0),
    net_salary DECIMAL(12,2) NOT NULL CHECK (net_salary >= 0),
    payment_date DATE,
    payment_method VARCHAR(20) CHECK (payment_method IN ('bank_transfer', 'cheque', 'cash')),
    transaction_id VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'paid', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(faculty_id, month, year)
);

-- ============================================================
-- 33. COLLEGE SETTINGS
-- ============================================================
CREATE TABLE college_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    setting_type VARCHAR(20) NOT NULL DEFAULT 'general' CHECK (setting_type IN ('general', 'academic', 'finance', 'attendance', 'notification', 'system')),
    description TEXT,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_college_settings_updated_at
    BEFORE UPDATE ON college_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 34. AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Users
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE UNIQUE INDEX idx_users_username ON users (username) WHERE username IS NOT NULL;
CREATE INDEX idx_users_username_lower ON users (lower(username));
CREATE INDEX idx_users_is_active ON users(is_active);

-- Students
CREATE INDEX idx_students_roll_number ON students(roll_number);
CREATE INDEX idx_students_program_id ON students(program_id);
CREATE INDEX idx_students_department_id ON students(department_id);
CREATE INDEX idx_students_current_semester ON students(current_semester);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_batch_year ON students(batch_year);
CREATE INDEX idx_students_admission_number ON students(admission_number);
CREATE INDEX idx_students_user_id ON students(user_id);

-- Faculty
CREATE INDEX idx_faculty_employee_id ON faculty(employee_id);
CREATE INDEX idx_faculty_department_id ON faculty(department_id);
CREATE INDEX idx_faculty_designation ON faculty(designation);
CREATE INDEX idx_faculty_is_active ON faculty(is_active);
CREATE INDEX idx_faculty_user_id ON faculty(user_id);

-- Admin Staff
CREATE INDEX idx_admin_staff_employee_id ON admin_staff(employee_id);
CREATE INDEX idx_admin_staff_user_id ON admin_staff(user_id);

-- Departments
CREATE INDEX idx_departments_code ON departments(code);
CREATE INDEX idx_departments_hod_id ON departments(hod_id);

-- Programs
CREATE INDEX idx_programs_department_id ON programs(department_id);
CREATE INDEX idx_programs_type ON programs(type);

-- Semesters
CREATE INDEX idx_semesters_academic_year_id ON semesters(academic_year_id);
CREATE INDEX idx_semesters_program_id ON semesters(program_id);
CREATE INDEX idx_semesters_is_current ON semesters(is_current);

-- Subjects
CREATE INDEX idx_subjects_program_id ON subjects(program_id);
CREATE INDEX idx_subjects_semester ON subjects(semester);
CREATE INDEX idx_subjects_type ON subjects(type);
CREATE INDEX idx_subjects_code ON subjects(code);

-- Attendance Classes
CREATE INDEX idx_attendance_classes_subject_id ON attendance_classes(subject_id);
CREATE INDEX idx_attendance_classes_faculty_id ON attendance_classes(faculty_id);
CREATE INDEX idx_attendance_classes_semester_id ON attendance_classes(semester_id);
CREATE INDEX idx_attendance_classes_date ON attendance_classes(date);
CREATE INDEX idx_attendance_classes_status ON attendance_classes(status);

-- Attendance Records
CREATE INDEX idx_attendance_records_class_id ON attendance_records(class_id);
CREATE INDEX idx_attendance_records_student_id ON attendance_records(student_id);
CREATE INDEX idx_attendance_records_status ON attendance_records(status);

-- Exam Schedule
CREATE INDEX idx_exam_schedule_semester_id ON exam_schedule(semester_id);
CREATE INDEX idx_exam_schedule_subject_id ON exam_schedule(subject_id);
CREATE INDEX idx_exam_schedule_exam_date ON exam_schedule(exam_date);

-- Internal Assessments
CREATE INDEX idx_internal_assessments_student_id ON internal_assessments(student_id);
CREATE INDEX idx_internal_assessments_subject_id ON internal_assessments(subject_id);
CREATE INDEX idx_internal_assessments_semester_id ON internal_assessments(semester_id);

-- Exam Results
CREATE INDEX idx_exam_results_student_id ON exam_results(student_id);
CREATE INDEX idx_exam_results_subject_id ON exam_results(subject_id);
CREATE INDEX idx_exam_results_semester_id ON exam_results(semester_id);
CREATE INDEX idx_exam_results_exam_type ON exam_results(exam_type);
CREATE INDEX idx_exam_results_result_status ON exam_results(result_status);

-- Semester Results
CREATE INDEX idx_semester_results_student_id ON semester_results(student_id);
CREATE INDEX idx_semester_results_semester_id ON semester_results(semester_id);
CREATE INDEX idx_semester_results_sgpa ON semester_results(sgpa);

-- Fee Structures
CREATE INDEX idx_fee_structures_program_id ON fee_structures(program_id);
CREATE INDEX idx_fee_structures_academic_year_id ON fee_structures(academic_year_id);

-- Fee Payments
CREATE INDEX idx_fee_payments_student_id ON fee_payments(student_id);
CREATE INDEX idx_fee_payments_fee_structure_id ON fee_payments(fee_structure_id);
CREATE INDEX idx_fee_payments_status ON fee_payments(status);
CREATE INDEX idx_fee_payments_receipt_number ON fee_payments(receipt_number);

-- Fee Receipts
CREATE INDEX idx_fee_receipts_payment_id ON fee_receipts(payment_id);
CREATE INDEX idx_fee_receipts_receipt_number ON fee_receipts(receipt_number);
CREATE INDEX idx_fee_receipts_roll_number ON fee_receipts(roll_number);

-- Library Books
CREATE INDEX idx_library_books_isbn ON library_books(isbn);
CREATE INDEX idx_library_books_category ON library_books(category);
CREATE INDEX idx_library_books_department_id ON library_books(department_id);
CREATE INDEX idx_library_books_title ON library_books USING gin(to_tsvector('english', title));
CREATE INDEX idx_library_books_author ON library_books USING gin(to_tsvector('english', author));

-- Library Issues
CREATE INDEX idx_library_issues_book_id ON library_issues(book_id);
CREATE INDEX idx_library_issues_student_id ON library_issues(student_id);
CREATE INDEX idx_library_issues_status ON library_issues(status);
CREATE INDEX idx_library_issues_due_date ON library_issues(due_date);
CREATE INDEX idx_library_issues_issue_date ON library_issues(issue_date);

-- Hostel Rooms
CREATE INDEX idx_hostel_rooms_block_id ON hostel_rooms(block_id);
CREATE INDEX idx_hostel_rooms_room_type ON hostel_rooms(room_type);

-- Hostel Allocations
CREATE INDEX idx_hostel_allocations_student_id ON hostel_allocations(student_id);
CREATE INDEX idx_hostel_allocations_room_id ON hostel_allocations(room_id);
CREATE INDEX idx_hostel_allocations_academic_year_id ON hostel_allocations(academic_year_id);
CREATE INDEX idx_hostel_allocations_status ON hostel_allocations(status);

-- Transport Routes
CREATE INDEX idx_transport_stops_route_id ON transport_stops(route_id);

-- Transport Allocations
CREATE INDEX idx_transport_allocations_student_id ON transport_allocations(student_id);
CREATE INDEX idx_transport_allocations_route_id ON transport_allocations(route_id);
CREATE INDEX idx_transport_allocations_academic_year_id ON transport_allocations(academic_year_id);

-- Documents
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_document_type_id ON documents(document_type_id);
CREATE INDEX idx_documents_status ON documents(status);

-- Notifications
CREATE INDEX idx_notifications_target_user_id ON notifications(target_user_id);
CREATE INDEX idx_notifications_target_role ON notifications(target_role);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Salary
CREATE INDEX idx_monthly_salary_faculty_id ON monthly_salary(faculty_id);
CREATE INDEX idx_monthly_salary_month_year ON monthly_salary(month, year);
CREATE INDEX idx_monthly_salary_status ON monthly_salary(status);

-- College Settings
CREATE INDEX idx_college_settings_setting_key ON college_settings(setting_key);
CREATE INDEX idx_college_settings_setting_type ON college_settings(setting_type);

-- Audit Logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE semester_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostel_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostel_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_salary ENABLE ROW LEVEL SECURITY;
ALTER TABLE college_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS VARCHAR AS $$
    SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to check if user is admin or super_admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper to read the caller's role. SECURITY DEFINER so the
-- notifications SELECT policy can match on role without recursing
-- through the users table's own RLS.
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS VARCHAR(20) AS $$
    SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to check if user is hod
CREATE OR REPLACE FUNCTION is_hod()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'hod'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to check if user is faculty
CREATE OR REPLACE FUNCTION is_faculty()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'faculty'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function to check if user is student
CREATE OR REPLACE FUNCTION is_student()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'student'
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- USERS TABLE POLICIES
-- ============================================================
CREATE POLICY "Users can view their own profile"
    ON users FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Admins can view all users"
    ON users FOR SELECT
    USING (is_admin());

CREATE POLICY "Admins can update all users"
    ON users FOR UPDATE
    USING (is_admin());

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can insert users"
    ON users FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "Admins can delete users"
    ON users FOR DELETE
    USING (is_admin());

-- ============================================================
-- STUDENTS TABLE POLICIES
-- ============================================================
CREATE POLICY "Students can view their own data"
    ON students FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Faculty can view their department students"
    ON students FOR SELECT
    USING (
        is_faculty() OR is_hod() OR is_admin()
    );

CREATE POLICY "Admins can manage students"
    ON students FOR ALL
    USING (is_admin());

CREATE POLICY "Students can update limited fields"
    ON students FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================================
-- FACULTY TABLE POLICIES
-- ============================================================
CREATE POLICY "Faculty can view their own profile"
    ON faculty FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "HODs can view department faculty"
    ON faculty FOR SELECT
    USING (is_hod() OR is_admin());

CREATE POLICY "Admins can manage faculty"
    ON faculty FOR ALL
    USING (is_admin());

-- ============================================================
-- DEPARTMENTS TABLE POLICIES
-- ============================================================
CREATE POLICY "Everyone can view departments"
    ON departments FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage departments"
    ON departments FOR ALL
    USING (is_admin());

-- ============================================================
-- PROGRAMS TABLE POLICIES
-- ============================================================
CREATE POLICY "Everyone can view programs"
    ON programs FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage programs"
    ON programs FOR ALL
    USING (is_admin());

-- ============================================================
-- ACADEMIC YEARS TABLE POLICIES
-- ============================================================
CREATE POLICY "Everyone can view academic years"
    ON academic_years FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage academic years"
    ON academic_years FOR ALL
    USING (is_admin());

-- ============================================================
-- SEMESTERS TABLE POLICIES
-- ============================================================
CREATE POLICY "Everyone can view semesters"
    ON semesters FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage semesters"
    ON semesters FOR ALL
    USING (is_admin());

-- ============================================================
-- SUBJECTS TABLE POLICIES
-- ============================================================
CREATE POLICY "Everyone can view subjects"
    ON subjects FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage subjects"
    ON subjects FOR ALL
    USING (is_admin());

-- ============================================================
-- ATTENDANCE CLASSES TABLE POLICIES
-- ============================================================
CREATE POLICY "Faculty can view their classes"
    ON attendance_classes FOR SELECT
    USING (
        faculty_id IN (SELECT id FROM faculty WHERE user_id = auth.uid())
        OR is_student()
        OR is_admin()
    );

CREATE POLICY "Faculty can manage their classes"
    ON attendance_classes FOR ALL
    USING (
        faculty_id IN (SELECT id FROM faculty WHERE user_id = auth.uid())
        OR is_admin()
    );

-- ============================================================
-- ATTENDANCE RECORDS TABLE POLICIES
-- ============================================================
CREATE POLICY "Students can view their own attendance"
    ON attendance_records FOR SELECT
    USING (
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
        OR is_faculty()
        OR is_hod()
        OR is_admin()
    );

CREATE POLICY "Faculty can manage attendance"
    ON attendance_records FOR ALL
    USING (is_faculty() OR is_admin());

-- ============================================================
-- EXAM SCHEDULE TABLE POLICIES
-- ============================================================
CREATE POLICY "Everyone can view exam schedule"
    ON exam_schedule FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage exam schedule"
    ON exam_schedule FOR ALL
    USING (is_admin());

-- ============================================================
-- INTERNAL ASSESSMENTS TABLE POLICIES
-- ============================================================
CREATE POLICY "Students can view their own assessments"
    ON internal_assessments FOR SELECT
    USING (
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
        OR is_faculty()
        OR is_hod()
        OR is_admin()
    );

CREATE POLICY "Faculty can manage assessments"
    ON internal_assessments FOR ALL
    USING (is_faculty() OR is_admin());

-- ============================================================
-- EXAM RESULTS TABLE POLICIES
-- ============================================================
CREATE POLICY "Students can view their own results"
    ON exam_results FOR SELECT
    USING (
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
        OR is_faculty()
        OR is_hod()
        OR is_admin()
    );

CREATE POLICY "Admins can manage exam results"
    ON exam_results FOR ALL
    USING (is_admin());

-- ============================================================
-- SEMESTER RESULTS TABLE POLICIES
-- ============================================================
CREATE POLICY "Students can view their own semester results"
    ON semester_results FOR SELECT
    USING (
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
        OR is_faculty()
        OR is_hod()
        OR is_admin()
    );

CREATE POLICY "Admins can manage semester results"
    ON semester_results FOR ALL
    USING (is_admin());

-- ============================================================
-- FEE STRUCTURES TABLE POLICIES
-- ============================================================
CREATE POLICY "Everyone can view fee structures"
    ON fee_structures FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage fee structures"
    ON fee_structures FOR ALL
    USING (is_admin());

-- ============================================================
-- FEE PAYMENTS TABLE POLICIES
-- ============================================================
CREATE POLICY "Students can view their own payments"
    ON fee_payments FOR SELECT
    USING (
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
        OR is_admin()
    );

CREATE POLICY "Students can insert their payments"
    ON fee_payments FOR INSERT
    WITH CHECK (
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can manage all payments"
    ON fee_payments FOR ALL
    USING (is_admin());

-- ============================================================
-- FEE RECEIPTS TABLE POLICIES
-- ============================================================
CREATE POLICY "Students can view their own receipts"
    ON fee_receipts FOR SELECT
    USING (
        roll_number IN (SELECT roll_number FROM students WHERE user_id = auth.uid())
        OR is_admin()
    );

CREATE POLICY "Admins can manage receipts"
    ON fee_receipts FOR ALL
    USING (is_admin());

-- ============================================================
-- LIBRARY BOOKS TABLE POLICIES
-- ============================================================
CREATE POLICY "Everyone can view library books"
    ON library_books FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage library books"
    ON library_books FOR ALL
    USING (is_admin());

-- ============================================================
-- LIBRARY ISSUES TABLE POLICIES
-- ============================================================
CREATE POLICY "Students can view their own issues"
    ON library_issues FOR SELECT
    USING (
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
        OR is_admin()
    );

CREATE POLICY "Students can request issues"
    ON library_issues FOR INSERT
    WITH CHECK (
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
    );

CREATE POLICY "Admins can manage all issues"
    ON library_issues FOR ALL
    USING (is_admin());

-- ============================================================
-- HOSTEL BLOCKS TABLE POLICIES
-- ============================================================
CREATE POLICY "Everyone can view hostel blocks"
    ON hostel_blocks FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage hostel blocks"
    ON hostel_blocks FOR ALL
    USING (is_admin());

-- ============================================================
-- HOSTEL ROOMS TABLE POLICIES
-- ============================================================
CREATE POLICY "Everyone can view hostel rooms"
    ON hostel_rooms FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage hostel rooms"
    ON hostel_rooms FOR ALL
    USING (is_admin());

-- ============================================================
-- HOSTEL ALLOCATIONS TABLE POLICIES
-- ============================================================
CREATE POLICY "Students can view their own allocation"
    ON hostel_allocations FOR SELECT
    USING (
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
        OR is_admin()
    );

CREATE POLICY "Admins can manage allocations"
    ON hostel_allocations FOR ALL
    USING (is_admin());

-- ============================================================
-- TRANSPORT ROUTES TABLE POLICIES
-- ============================================================
CREATE POLICY "Everyone can view transport routes"
    ON transport_routes FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage transport routes"
    ON transport_routes FOR ALL
    USING (is_admin());

-- ============================================================
-- TRANSPORT STOPS TABLE POLICIES
-- ============================================================
CREATE POLICY "Everyone can view transport stops"
    ON transport_stops FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage transport stops"
    ON transport_stops FOR ALL
    USING (is_admin());

-- ============================================================
-- TRANSPORT ALLOCATIONS TABLE POLICIES
-- ============================================================
CREATE POLICY "Students can view their own transport allocation"
    ON transport_allocations FOR SELECT
    USING (
        student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
        OR is_admin()
    );

CREATE POLICY "Admins can manage transport allocations"
    ON transport_allocations FOR ALL
    USING (is_admin());

-- ============================================================
-- DOCUMENT TYPES TABLE POLICIES
-- ============================================================
CREATE POLICY "Everyone can view document types"
    ON document_types FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage document types"
    ON document_types FOR ALL
    USING (is_admin());

-- ============================================================
-- DOCUMENTS TABLE POLICIES
-- ============================================================
CREATE POLICY "Users can view their own documents"
    ON documents FOR SELECT
    USING (
        user_id = auth.uid()
        OR is_admin()
    );

CREATE POLICY "Users can upload their documents"
    ON documents FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own documents"
    ON documents FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all documents"
    ON documents FOR ALL
    USING (is_admin());

-- ============================================================
-- NOTIFICATION TEMPLATES TABLE POLICIES
-- ============================================================
CREATE POLICY "Admins can view notification templates"
    ON notification_templates FOR SELECT
    USING (is_admin());

CREATE POLICY "Admins can manage notification templates"
    ON notification_templates FOR ALL
    USING (is_admin());

-- ============================================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================================
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (
        target_user_id = auth.uid()
        OR target_role = 'all'
        OR target_role = current_user_role()
        OR is_admin()
    );

CREATE POLICY "Admins can manage notifications"
    ON notifications FOR ALL
    USING (is_admin());

-- ============================================================
-- SALARY COMPONENTS TABLE POLICIES
-- ============================================================
CREATE POLICY "Admins can view salary components"
    ON salary_components FOR SELECT
    USING (is_admin());

CREATE POLICY "Admins can manage salary components"
    ON salary_components FOR ALL
    USING (is_admin());

-- ============================================================
-- MONTHLY SALARY TABLE POLICIES
-- ============================================================
CREATE POLICY "Faculty can view their own salary"
    ON monthly_salary FOR SELECT
    USING (
        faculty_id IN (SELECT id FROM faculty WHERE user_id = auth.uid())
        OR is_admin()
    );

CREATE POLICY "Admins can manage monthly salary"
    ON monthly_salary FOR ALL
    USING (is_admin());

-- ============================================================
-- COLLEGE SETTINGS TABLE POLICIES
-- ============================================================
CREATE POLICY "Everyone can view college settings"
    ON college_settings FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage college settings"
    ON college_settings FOR ALL
    USING (is_admin());

-- ============================================================
-- AUDIT LOGS TABLE POLICIES
-- ============================================================
CREATE POLICY "Admins can view audit logs"
    ON audit_logs FOR SELECT
    USING (is_admin());

CREATE POLICY "System can insert audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admin Staff can view audit logs"
    ON audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_staff WHERE user_id = auth.uid()
        )
    );

-- ============================================================
-- HELPER FUNCTION: Calculate SGPA
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_sgpa(
    p_student_id UUID,
    p_semester_id UUID
) RETURNS TABLE(sgpa DECIMAL(4,2), total_credits INTEGER, earned_credits INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(
            ROUND(
                SUM(er.grade_points * er.credits)::DECIMAL / NULLIF(SUM(CASE WHEN er.credits > 0 THEN er.credits ELSE 0 END), 0),
                2
            ),
            0
        )::DECIMAL(4,2),
        COALESCE(SUM(s.credits), 0)::INTEGER,
        COALESCE(
            SUM(CASE WHEN er.result_status = 'pass' THEN er.credits ELSE 0 END),
            0
        )::INTEGER
    FROM exam_results er
    JOIN subjects s ON er.subject_id = s.id
    WHERE er.student_id = p_student_id
      AND er.semester_id = p_semester_id
      AND er.exam_type = 'semester';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- HELPER FUNCTION: Calculate CGPA
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_cgpa(
    p_student_id UUID
) RETURNS TABLE(cgpa DECIMAL(4,2), total_credits INTEGER, earned_credits INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(
            ROUND(
                SUM(sr.sgpa * sr.earned_credits)::DECIMAL / NULLIF(SUM(CASE WHEN sr.earned_credits > 0 THEN sr.earned_credits ELSE 0 END), 0),
                2
            ),
            0
        )::DECIMAL(4,2),
        COALESCE(SUM(sr.total_credits), 0)::INTEGER,
        COALESCE(SUM(sr.earned_credits), 0)::INTEGER
    FROM semester_results sr
    WHERE sr.student_id = p_student_id
      AND sr.result_status = 'pass';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- HELPER FUNCTION: Get attendance percentage
-- ============================================================
CREATE OR REPLACE FUNCTION get_attendance_percentage(
    p_student_id UUID,
    p_semester_id UUID
) RETURNS DECIMAL(5,2) AS $$
DECLARE
    total_classes BIGINT;
    present_count BIGINT;
BEGIN
    SELECT COUNT(*), COUNT(*) FILTER (WHERE ar.status = 'P')
    INTO total_classes, present_count
    FROM attendance_records ar
    JOIN attendance_classes ac ON ar.class_id = ac.id
    WHERE ar.student_id = p_student_id
      AND ac.semester_id = p_semester_id
      AND ac.status = 'completed';

    IF total_classes = 0 THEN
        RETURN 0;
    END IF;

    RETURN ROUND((present_count::DECIMAL / total_classes) * 100, 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- END OF SCHEMA
-- ============================================================
