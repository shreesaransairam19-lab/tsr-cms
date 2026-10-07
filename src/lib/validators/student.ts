import { z } from "zod";

export const studentPersonalSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name (initial) is required").max(5),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female", "other"], { required_error: "Gender is required" }),
  blood_group: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  religion: z.string().optional().nullable(),
  community: z.string().optional().nullable(),
  aadhar_number: z.string().optional().nullable(),
  photo_url: z.string().optional().nullable(),
});

export const studentContactSchema = z.object({
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email address"),
});

export const studentAcademicSchema = z.object({
  department_id: z.string().min(1, "Department is required"),
  program_id: z.string().min(1, "Program is required"),
  semester: z.coerce.number().min(1, "Semester is required").max(12),
  admission_date: z.string().min(1, "Admission date is required"),
  batch_year: z.coerce.number().min(2000, "Batch year is required").max(2100),
  entrance_exam_score: z.coerce.number().optional().nullable(),
  category: z.string().optional().nullable(),
  is_hosteler: z.boolean().default(false),
  is_transport_user: z.boolean().default(false),
});

export const studentParentSchema = z.object({
  father_name: z.string().optional().nullable(),
  father_phone: z.string().optional().nullable(),
  father_occupation: z.string().optional().nullable(),
  mother_name: z.string().optional().nullable(),
  mother_phone: z.string().optional().nullable(),
  guardian_phone: z.string().optional().nullable(),
});

export const studentFormSchema = z.object({
  ...studentPersonalSchema.shape,
  ...studentContactSchema.shape,
  ...studentAcademicSchema.shape,
  ...studentParentSchema.shape,
});

export type StudentPersonalInput = z.infer<typeof studentPersonalSchema>;
export type StudentContactInput = z.infer<typeof studentContactSchema>;
export type StudentAcademicInput = z.infer<typeof studentAcademicSchema>;
export type StudentParentInput = z.infer<typeof studentParentSchema>;
export type StudentFormInput = z.infer<typeof studentFormSchema>;
