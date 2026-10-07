-- ============================================================
-- TSR CMS - Seed Data
-- TSR
-- TSR
-- ============================================================

-- ============================================================
-- DEFAULT DEPARTMENTS
-- ============================================================
INSERT INTO departments (id, code, name, short_name, is_active) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'AIDS', 'Artificial Intelligence and Data Science', 'AI&DS', true),
    ('a1000000-0000-0000-0000-000000000002', 'BIO', 'Biotechnology', 'BTech', true),
    ('a1000000-0000-0000-0000-000000000003', 'CHEM', 'Chemical Engineering', 'ChemE', true),
    ('a1000000-0000-0000-0000-000000000004', 'CSE', 'Computer Science and Engineering', 'CSE', true),
    ('a1000000-0000-0000-0000-000000000005', 'CSEBS', 'Computer Science and Engineering - Business Systems', 'CSE-BS', true),
    ('a1000000-0000-0000-0000-000000000006', 'EEE', 'Electrical and Electronics Engineering', 'EEE', true),
    ('a1000000-0000-0000-0000-000000000007', 'ECE', 'Electronics and Communication Engineering', 'ECE', true),
    ('a1000000-0000-0000-0000-000000000008', 'IT', 'Information Technology', 'IT', true),
    ('a1000000-0000-0000-0000-000000000009', 'MECH', 'Mechanical Engineering', 'ME', true),
    ('a1000000-0000-0000-0000-000000000010', 'MBA', 'Master of Business Administration', 'MBA', true);

-- ============================================================
-- DEFAULT ACADEMIC YEAR
-- ============================================================
INSERT INTO academic_years (id, year, start_date, end_date, is_current) VALUES
    ('b1000000-0000-0000-0000-000000000001', '2025-26', '2025-07-01', '2026-06-30', true);

-- ============================================================
-- DEFAULT PROGRAMS (B.Tech 4-year UG for all engineering depts)
-- ============================================================
INSERT INTO programs (id, department_id, code, name, type, duration_years, total_semesters, total_credits, grading_system, is_active) VALUES
    -- AI&DS
    ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'BTECH_AIDS', 'B.Tech Artificial Intelligence and Data Science', 'UG', 4, 8, 180, '10_point', true),
    -- Biotechnology
    ('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'BTECH_BIO', 'B.Tech Biotechnology', 'UG', 4, 8, 180, '10_point', true),
    -- Chemical
    ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'BTECH_CHEM', 'B.Tech Chemical Engineering', 'UG', 4, 8, 180, '10_point', true),
    -- CSE
    ('c1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000004', 'BTECH_CSE', 'B.Tech Computer Science and Engineering', 'UG', 4, 8, 180, '10_point', true),
    -- CSE-BS
    ('c1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000005', 'BTECH_CSEBS', 'B.Tech Computer Science and Engineering - Business Systems', 'UG', 4, 8, 180, '10_point', true),
    -- EEE
    ('c1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000006', 'BTECH_EEE', 'B.Tech Electrical and Electronics Engineering', 'UG', 4, 8, 180, '10_point', true),
    -- ECE
    ('c1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000007', 'BTECH_ECE', 'B.Tech Electronics and Communication Engineering', 'UG', 4, 8, 180, '10_point', true),
    -- IT
    ('c1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000008', 'BTECH_IT', 'B.Tech Information Technology', 'UG', 4, 8, 180, '10_point', true),
    -- Mechanical
    ('c1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000009', 'BTECH_MECH', 'B.Tech Mechanical Engineering', 'UG', 4, 8, 180, '10_point', true),
    -- MBA
    ('c1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000010', 'MBA', 'Master of Business Administration', 'PG', 2, 4, 120, '10_point', true);

-- ============================================================
-- DEFAULT COLLEGE SETTINGS
-- ============================================================
INSERT INTO college_settings (setting_key, setting_value, setting_type, description) VALUES
    ('college_name', '"TSR"', 'general', 'Full name of the college'),
    ('college_short_name', '"TSR"', 'general', 'Short name / abbreviation of the college'),
    ('college_address', '""', 'general', 'Full address of the college'),
    ('college_phone', '""', 'general', 'Main phone number'),
    ('college_email', '"noreply@example.com"', 'general', 'General enquiry email'),
    ('college_website', '""', 'general', 'College website URL'),
    ('college_affiliation', '""', 'academic', 'Affiliating university'),
    ('college_established', '""', 'general', 'Year the college was established'),
    ('current_academic_year', '"b1000000-0000-0000-0000-000000000001"', 'academic', 'Reference to current academic year ID'),
    ('attendance_minimum_percentage', '75', 'attendance', 'Minimum attendance percentage required'),
    ('attendance_shortage_action', '"detention"', 'attendance', 'Action taken for attendance shortage'),
    ('grading_system', '"10_point"', 'academic', 'Default grading system'),
    ('max_credits_per_semester', '28', 'academic', 'Maximum credits a student can take per semester'),
    ('min_credits_to_pass', '50', 'academic', 'Minimum percentage to pass'),
    ('internal_weightage', '40', 'academic', 'Internal assessment weightage percentage'),
    ('external_weightage', '60', 'academic', 'External exam weightage percentage'),
    ('late_fee_amount', '500', 'finance', 'Default late fee amount in INR'),
    ('late_fee_after_days', '7', 'finance', 'Days after due date when late fee applies'),
    ('library_max_books_issue', '3', 'general', 'Maximum books a student can issue'),
    ('library_issue_days', '14', 'general', 'Number of days for book issue'),
    ('library_fine_per_day', '2', 'finance', 'Fine per day for overdue books in INR'),
    ('hostel_max_occupancy', '4', 'general', 'Maximum occupancy per room'),
    ('notification_email_enabled', 'true', 'notification', 'Whether email notifications are enabled'),
    ('notification_sms_enabled', 'true', 'notification', 'Whether SMS notifications are enabled'),
    ('notification_whatsapp_enabled', 'false', 'notification', 'Whether WhatsApp notifications are enabled'),
    ('semester_start_month', '7', 'academic', 'Month when semester starts (7 = July)'),
    ('semester_end_month', '12', 'academic', 'Month when odd semester ends'),
    ('exam_results_public', 'true', 'academic', 'Whether exam results are publicly viewable'),
    ('fee_payment_gateway', '"razorpay"', 'finance', 'Payment gateway provider'),
    ('receipt_prefix', '"TSR"', 'finance', 'Prefix for receipt numbers'),
    ('salary_payment_day', '1', 'finance', 'Day of month when salary is paid');

-- ============================================================
-- DEFAULT DOCUMENT TYPES
-- ============================================================
INSERT INTO document_types (id, name, description, required_for, max_size_mb, allowed_formats, is_mandatory) VALUES
    ('d1000000-0000-0000-0000-000000000001', '10th Mark Sheet', 'SSLC / 10th standard mark sheet', 'admission', 5, ARRAY['pdf', 'jpg', 'png'], true),
    ('d1000000-0000-0000-0000-000000000002', '12th Mark Sheet', 'HSC / 12th standard mark sheet', 'admission', 5, ARRAY['pdf', 'jpg', 'png'], true),
    ('d1000000-0000-0000-0000-000000000003', 'Transfer Certificate', 'School / College transfer certificate', 'admission', 5, ARRAY['pdf', 'jpg', 'png'], true),
    ('d1000000-0000-0000-0000-000000000004', 'Community Certificate', 'Community / Caste certificate from competent authority', 'admission', 3, ARRAY['pdf', 'jpg', 'png'], true),
    ('d1000000-0000-0000-0000-000000000005', 'Aadhar Card', 'Aadhar card of student', 'admission', 3, ARRAY['pdf', 'jpg', 'png'], true),
    ('d1000000-0000-0000-0000-000000000006', 'Passport Photo', 'Recent passport size photograph', 'admission', 2, ARRAY['jpg', 'png'], true),
    ('d1000000-0000-0000-0000-000000000007', 'Entrance Exam Score Card', 'TNEA / JEE / GATE score card', 'admission', 5, ARRAY['pdf', 'jpg', 'png'], true),
    ('d1000000-0000-0000-0000-000000000008', 'Provisional Certificate', 'Provisional certificate from previous institution', 'admission', 5, ARRAY['pdf', 'jpg', 'png'], false),
    ('d1000000-0000-0000-0000-000000000009', 'Migration Certificate', 'Migration certificate if from other university', 'admission', 5, ARRAY['pdf', 'jpg', 'png'], false),
    ('d1000000-0000-0000-0000-000000000010', 'Income Certificate', 'Family income certificate for scholarship', 'scholarship', 3, ARRAY['pdf', 'jpg', 'png'], false),
    ('d1000000-0000-0000-0000-000000000011', 'Bonafide Certificate', 'Bonafide / Conduct certificate', 'general', 3, ARRAY['pdf', 'jpg', 'png'], false),
    ('d1000000-0000-0000-0000-000000000012', 'Medical Certificate', 'Medical fitness certificate', 'hostel', 3, ARRAY['pdf', 'jpg', 'png'], false),
    ('d1000000-0000-0000-0000-000000000013', 'Anti-Ragging Affidavit', 'Signed anti-ragging affidavit', 'admission', 3, ARRAY['pdf'], true),
    ('d1000000-0000-0000-0000-000000000014', 'College ID Card', 'Scanned copy of college identity card', 'general', 2, ARRAY['jpg', 'png'], false),
    ('d1000000-0000-0000-0000-000000000015', 'Fee Receipt', 'Paid fee receipt copy', 'general', 3, ARRAY['pdf', 'jpg', 'png'], false);

-- ============================================================
-- DEFAULT SALARY COMPONENTS
-- ============================================================
-- Earnings
INSERT INTO salary_components (name, type, is_fixed, calculation_type, percentage) VALUES
    ('Basic Salary', 'earning', true, 'fixed', NULL),
    ('House Rent Allowance', 'earning', true, 'percentage', 40.00),
    ('Dearness Allowance', 'earning', true, 'percentage', 30.00),
    ('Conveyance Allowance', 'earning', true, 'fixed', NULL),
    ('Medical Allowance', 'earning', true, 'fixed', NULL),
    ('Special Allowance', 'earning', false, 'fixed', NULL),
    ('Overtime Pay', 'earning', false, 'fixed', NULL),
    ('Performance Bonus', 'earning', false, 'fixed', NULL);

-- Deductions
INSERT INTO salary_components (name, type, is_fixed, calculation_type, percentage) VALUES
    ('Provident Fund (PF)', 'deduction', true, 'percentage', 12.00),
    ('Employee State Insurance (ESI)', 'deduction', true, 'percentage', 0.75),
    ('Professional Tax', 'deduction', true, 'fixed', NULL),
    ('Income Tax (TDS)', 'deduction', false, 'percentage', NULL),
    ('Loan EMI', 'deduction', false, 'fixed', NULL),
    ('Other Deductions', 'deduction', false, 'fixed', NULL);

-- ============================================================
-- DEFAULT NOTIFICATION TEMPLATES
-- ============================================================
INSERT INTO notification_templates (name, type, subject, body, variables, is_active) VALUES
    ('welcome_student', 'email', 'Welcome to TSR CMS', 'Dear {{student_name}}, Welcome to TSR CMS. Your roll number is {{roll_number}}. Login at {{login_url}}', '{"student_name": "string", "roll_number": "string", "login_url": "string"}', true),
    ('fee_reminder', 'email', 'Fee Payment Reminder', 'Dear {{student_name}}, your {{fee_type}} fee of ₹{{amount}} is due on {{due_date}}. Pay now at {{payment_url}}', '{"student_name": "string", "fee_type": "string", "amount": "string", "due_date": "string", "payment_url": "string"}', true),
    ('exam_result', 'email', 'Exam Results Published', 'Dear {{student_name}}, your {{exam_type}} results for {{semester}} have been published. SGPA: {{sgpa}}', '{"student_name": "string", "exam_type": "string", "semester": "string", "sgpa": "string"}', true),
    ('attendance_alert', 'sms', 'Attendance Alert', 'Dear {{student_name}}, your attendance in {{subject}} is {{percentage}}%. Minimum required is {{min_percentage}}%', '{"student_name": "string", "subject": "string", "percentage": "string", "min_percentage": "string"}', true),
    ('library_overdue', 'email', 'Library Book Overdue', 'Dear {{student_name}}, the book "{{book_title}}" is overdue. Fine: ₹{{fine_amount}}. Return by {{due_date}}.', '{"student_name": "string", "book_title": "string", "fine_amount": "string", "due_date": "string"}', true),
    ('payment_success', 'email', 'Payment Successful', 'Dear {{student_name}}, your payment of ₹{{amount}} for {{fee_type}} was successful. Receipt #: {{receipt_number}}', '{"student_name": "string", "amount": "string", "fee_type": "string", "receipt_number": "string"}', true),
    ('payment_failed', 'email', 'Payment Failed', 'Dear {{student_name}}, your payment of ₹{{amount}} for {{fee_type}} failed. Please retry.', '{"student_name": "string", "amount": "string", "fee_type": "string"}', true),
    ('hostel_allocation', 'email', 'Hostel Room Allocation', 'Dear {{student_name}}, you have been allocated Room {{room_number}} in {{block_name}}. Report by {{allocation_date}}.', '{"student_name": "string", "room_number": "string", "block_name": "string", "allocation_date": "string"}', true),
    ('semester_start', 'email', 'Semester Starting', 'Dear {{student_name}}, {{semester_name}} starts on {{start_date}}. Your class schedule is available on the portal.', '{"student_name": "string", "semester_name": "string", "start_date": "string"}', true),
    ('result_published', 'push', 'Results Available', 'Your {{semester}} results are now available. Check your SGPA and detailed marks.', '{"semester": "string"}', true),
    ('otp_verification', 'sms', 'OTP Verification', 'Your TSR CMS OTP is {{otp}}. Valid for {{minutes}} minutes. Do not share.', '{"otp": "string", "minutes": "string"}', true),
    ('bulk_announcement', 'push', '{{title}}', '{{message}}', '{"title": "string", "message": "string"}', true);

-- ============================================================
-- DONE
-- ============================================================
