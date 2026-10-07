// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = "student" | "faculty" | "admin" | "super_admin";

export type AttendanceStatus = "present" | "absent" | "late" | "excused" | "holiday";

export type ExamType = "internal" | "semester" | "practical" | "viva" | "backlog";

export type FeeStatus = "pending" | "partial" | "paid" | "overdue" | "waived";

export type PaymentMethod = "cash" | "online" | "cheque" | "dd" | "upi" | "bank_transfer";

export type DocumentType =
  | "marksheet"
  | "certificate"
  | "id_card"
  | "bonafide"
  | "transfer_certificate"
  | "migration"
  | "other";

export type Gender = "male" | "female" | "other";

export type BloodGroup =
  | "A+"
  | "A-"
  | "B+"
  | "B-"
  | "AB+"
  | "AB-"
  | "O+"
  | "O-";

export type HostelBlockType = "boys" | "girls";

export type NotificationType = "info" | "warning" | "urgent" | "academic" | "general";

// ─── Core Models ──────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  user_id: string;
  user?: User;
  roll_number: string;
  department_id: string;
  department?: Department;
  program_id: string;
  program?: Program;
  semester: number;
  batch_year: number;
  admission_date: string;
  date_of_birth: string;
  gender: Gender;
  blood_group: BloodGroup | null;
  nationality: string | null;
  religion: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  father_name: string | null;
  father_phone: string | null;
  father_occupation: string | null;
  mother_name: string | null;
  mother_phone: string | null;
  guardian_phone: string | null;
  aadhar_number: string | null;
  entrance_exam_score: number | null;
  category: string | null;
  community: string | null;
  photo_url: string | null;
  is_hosteler: boolean;
  is_transport_user: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Faculty {
  id: string;
  user_id: string;
  user?: User;
  employee_id: string;
  department_id: string;
  department?: Department;
  designation: string;
  qualification: string | null;
  specialization: string | null;
  employment_type: string | null;
  date_of_joining: string;
  date_of_birth: string;
  gender: Gender;
  blood_group: BloodGroup | null;
  address: string | null;
  phone: string | null;
  emergency_contact: string | null;
  pan_number: string | null;
  basic_salary: number;
  is_hod: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminStaff {
  id: string;
  user_id: string;
  user?: User;
  employee_id: string;
  designation: string;
  department: string | null;
  date_of_joining: string;
  date_of_birth: string;
  gender: Gender;
  address: string | null;
  phone: string | null;
  pan_number: string | null;
  basic_salary: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Academic Structure ───────────────────────────────────────────────────────

export interface Department {
  id: string;
  code: string;
  name: string;
  hod_id: string | null;
  hod?: Faculty;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Program {
  id: string;
  department_id: string;
  department?: Department;
  name: string;
  code: string;
  type: string;
  duration_years: number;
  total_semesters: number;
  total_credits: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface Semester {
  id: string;
  academic_year_id: string;
  academic_year?: AcademicYear;
  number: number;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subject {
  id: string;
  program_id: string;
  program?: Program;
  semester_number: number;
  code: string;
  name: string;
  type: "theory" | "practical" | "project";
  credits: number;
  max_marks: number;
  passing_marks: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export interface AttendanceClass {
  id: string;
  subject_id: string;
  subject?: Subject;
  faculty_id: string;
  faculty?: Faculty;
  date: string;
  start_time: string;
  end_time: string;
  room_number: string | null;
  total_students: number;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  attendance_class_id: string;
  attendance_class?: AttendanceClass;
  student_id: string;
  student?: Student;
  status: AttendanceStatus;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Examinations ─────────────────────────────────────────────────────────────

export interface ExamSchedule {
  id: string;
  subject_id: string;
  subject?: Subject;
  semester_id: string;
  semester?: Semester;
  exam_type: ExamType;
  exam_date: string;
  start_time: string;
  end_time: string;
  room_number: string | null;
  max_marks: number;
  passing_marks: number;
  instructions: string | null;
  created_at: string;
  updated_at: string;
}

export interface InternalAssessment {
  id: string;
  student_id: string;
  student?: Student;
  subject_id: string;
  subject?: Subject;
  assessment_number: number;
  max_marks: number;
  marks_obtained: number | null;
  assessment_date: string;
  remarks: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ExamResult {
  id: string;
  student_id: string;
  student?: Student;
  exam_schedule_id: string;
  exam_schedule?: ExamSchedule;
  subject_id: string;
  subject?: Subject;
  marks_obtained: number | null;
  is_absent: boolean;
  grade: string | null;
  grade_point: number | null;
  remarks: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SemesterResult {
  id: string;
  student_id: string;
  student?: Student;
  semester_id: string;
  semester?: Semester;
  sgpa: number | null;
  cgpa: number | null;
  total_marks: number | null;
  max_marks: number | null;
  percentage: number | null;
  is_passed: boolean;
  is_backlog: boolean;
  backlog_subjects: string[] | null;
  result_date: string;
  published_by: string;
  created_at: string;
  updated_at: string;
}

// ─── Fees ─────────────────────────────────────────────────────────────────────

export interface FeeStructure {
  id: string;
  program_id: string;
  program?: Program;
  academic_year_id: string;
  academic_year?: AcademicYear;
  semester_number: number;
  fee_type: string;
  amount: number;
  due_date: string;
  late_fee_per_day: number;
  is_mandatory: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeePayment {
  id: string;
  student_id: string;
  student?: Student;
  fee_structure_id: string;
  fee_structure?: FeeStructure;
  amount_paid: number;
  payment_date: string;
  payment_method: PaymentMethod;
  transaction_id: string | null;
  receipt_number: string;
  status: FeeStatus;
  remarks: string | null;
  received_by: string;
  created_at: string;
  updated_at: string;
}

export interface FeeReceipt {
  id: string;
  receipt_number: string;
  payment_id: string;
  payment?: FeePayment;
  student_id: string;
  student?: Student;
  issued_date: string;
  pdf_url: string | null;
  created_at: string;
}

// ─── Library ──────────────────────────────────────────────────────────────────

export interface LibraryBook {
  id: string;
  isbn: string;
  title: string;
  author: string;
  publisher: string | null;
  edition: string | null;
  category: string;
  department_id: string | null;
  total_copies: number;
  available_copies: number;
  rack_number: string | null;
  price: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LibraryIssue {
  id: string;
  book_id: string;
  book?: LibraryBook;
  student_id: string | null;
  student?: Student;
  faculty_id: string | null;
  faculty?: Faculty;
  issue_date: string;
  due_date: string;
  return_date: string | null;
  fine: number;
  fine_paid: boolean;
  status: "issued" | "returned" | "overdue" | "lost";
  issued_by: string;
  created_at: string;
  updated_at: string;
}

// ─── Hostel ───────────────────────────────────────────────────────────────────

export interface HostelBlock {
  id: string;
  name: string;
  type: HostelBlockType;
  total_rooms: number;
  warden_name: string | null;
  warden_phone: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HostelRoom {
  id: string;
  block_id: string;
  block?: HostelBlock;
  room_number: string;
  floor: number;
  capacity: number;
  occupied: number;
  room_type: "single" | "double" | "triple" | "shared";
  has_ac: boolean;
  monthly_rent: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HostelAllocation {
  id: string;
  student_id: string;
  student?: Student;
  room_id: string;
  room?: HostelRoom;
  academic_year_id: string;
  academic_year?: AcademicYear;
  allocation_date: string;
  checkout_date: string | null;
  security_deposit: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Transport ────────────────────────────────────────────────────────────────

export interface TransportRoute {
  id: string;
  name: string;
  code: string;
  vehicle_number: string;
  driver_name: string;
  driver_phone: string;
  capacity: number;
  monthly_fee: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransportStop {
  id: string;
  route_id: string;
  route?: TransportRoute;
  name: string;
  sequence: number;
  arrival_time: string;
  departure_time: string;
  landmark: string | null;
  created_at: string;
  updated_at: string;
}

export interface TransportAllocation {
  id: string;
  student_id: string;
  student?: Student;
  route_id: string;
  route?: TransportRoute;
  stop_id: string;
  stop?: TransportStop;
  academic_year_id: string;
  academic_year?: AcademicYear;
  allocation_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Documents ────────────────────────────────────────────────────────────────

export interface Document {
  id: string;
  title: string;
  type: DocumentType;
  description: string | null;
  file_url: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  student_id: string | null;
  student?: Student;
  faculty_id: string | null;
  faculty?: Faculty;
  is_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  target_role: UserRole | "all";
  target_user_id: string | null;
  target_department_id: string | null;
  target_batch_year: number | null;
  is_read: boolean;
  link: string | null;
  created_by: string;
  created_at: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: NotificationType;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ─── Salary ───────────────────────────────────────────────────────────────────

export interface SalaryComponent {
  id: string;
  name: string;
  code: string;
  type: "earning" | "deduction";
  is_percentage: boolean;
  default_value: number;
  applies_to: "faculty" | "admin_staff" | "all";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MonthlySalary {
  id: string;
  employee_type: "faculty" | "admin_staff";
  employee_id: string;
  month: number;
  year: number;
  basic_salary: number;
  components: SalaryComponentEntry[];
  gross_earnings: number;
  total_deductions: number;
  net_salary: number;
  payment_date: string | null;
  payment_method: PaymentMethod | null;
  transaction_id: string | null;
  status: "pending" | "processed" | "paid" | "hold";
  processed_by: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface SalaryComponentEntry {
  component_id: string;
  component_name: string;
  component_code: string;
  type: "earning" | "deduction";
  amount: number;
}

// ─── Settings & Audit ─────────────────────────────────────────────────────────

export interface CollegeSetting {
  id: string;
  key: string;
  value: string;
  category: string;
  description: string | null;
  updated_by: string | null;
  updated_at: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user?: User;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface ApiListResponse<T> extends ApiResponse<PaginatedResponse<T>> {}

export interface ApiSingleResponse<T> extends ApiResponse<T> {}

export interface ApiMutationResponse {
  success: boolean;
  data: { id: string } | null;
  error: string | null;
  message: string;
}

export interface ApiBulkResponse {
  success: boolean;
  inserted: number;
  updated: number;
  failed: number;
  errors: string[];
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────

export interface AdminDashboardStats {
  total_students: number;
  total_faculty: number;
  total_staff: number;
  active_students: number;
  new_admissions_this_month: number;
  attendance_today: {
    total_classes: number;
    avg_attendance_percent: number;
  };
  fee_collection: {
    total_collected: number;
    total_pending: number;
    collection_rate: number;
    month_collected: number;
  };
  upcoming_exams: number;
  active_backlogs: number;
  library_stats: {
    total_books: number;
    issued_books: number;
    overdue_books: number;
  };
  recent_notifications: Notification[];
  department_wise_students: { department: string; count: number }[];
  monthly_fee_trend: { month: string; collected: number; pending: number }[];
}

export interface StudentDashboardStats {
  student: Student;
  current_semester: Semester | null;
  attendance: {
    overall_percent: number;
    subject_wise: {
      subject: string;
      attended: number;
      total: number;
      percent: number;
    }[];
  };
  recent_results: {
    subject: string;
    marks: number;
    max_marks: number;
    grade: string;
    sgpa: number | null;
  }[];
  fee_status: {
    total_fee: number;
    paid: number;
    pending: number;
    due_date: string | null;
  };
  library_issues: {
    book_title: string;
    issue_date: string;
    due_date: string;
    is_overdue: boolean;
  }[];
  upcoming_exams: {
    subject: string;
    exam_type: ExamType;
    date: string;
    start_time: string;
    max_marks: number;
  }[];
  recent_notifications: Notification[];
}

export interface FacultyDashboardStats {
  faculty: Faculty;
  subjects_assigned: {
    subject: Subject;
    student_count: number;
    semester: number;
  }[];
  today_classes: {
    subject: string;
    start_time: string;
    end_time: string;
    room: string | null;
    students_present: number;
    total_students: number;
  }[];
  attendance_summary: {
    total_classes_taken: number;
    avg_attendance: number;
  };
  pending_evaluations: number;
  recent_notifications: Notification[];
}

export interface AttendanceStats {
  total_classes: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
}

// ─── Query / Filter Types ─────────────────────────────────────────────────────

export interface PaginationParams {
  page: number;
  per_page: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export interface StudentFilters extends PaginationParams {
  search?: string;
  department_id?: string;
  program_id?: string;
  batch_year?: number;
  semester?: number;
  is_active?: boolean;
  is_hosteler?: boolean;
}

export interface FacultyFilters extends PaginationParams {
  search?: string;
  department_id?: string;
  is_hod?: boolean;
  is_active?: boolean;
}

export interface AttendanceFilters extends PaginationParams {
  subject_id?: string;
  faculty_id?: string;
  student_id?: string;
  date_from?: string;
  date_to?: string;
  status?: AttendanceStatus;
}

export interface ExamResultFilters extends PaginationParams {
  subject_id?: string;
  student_id?: string;
  semester_id?: string;
  exam_type?: ExamType;
}

export interface FeePaymentFilters extends PaginationParams {
  student_id?: string;
  fee_type?: string;
  status?: FeeStatus;
  date_from?: string;
  date_to?: string;
}

export interface LibraryIssueFilters extends PaginationParams {
  book_id?: string;
  student_id?: string;
  faculty_id?: string;
  status?: "issued" | "returned" | "overdue" | "lost";
}
