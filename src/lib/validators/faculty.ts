import { z } from "zod";

export const facultyPersonalSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  date_of_birth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female", "other"], { required_error: "Gender is required" }),
  blood_group: z.string().optional().nullable(),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email address"),
  address: z.string().optional().nullable(),
  emergency_contact: z.string().optional().nullable(),
  pan_number: z.string().optional().nullable(),
  photo_url: z.string().optional().nullable(),
});

export const facultyProfessionalSchema = z.object({
  department_id: z.string().min(1, "Department is required"),
  designation: z.string().min(1, "Designation is required"),
  qualification: z.string().optional().nullable(),
  specialization: z.string().optional().nullable(),
  date_of_joining: z.string().min(1, "Date of joining is required"),
  employment_type: z.enum(["full_time", "part_time", "contract", "visiting"], {
    required_error: "Employment type is required",
  }).default("full_time"),
  basic_salary: z.coerce.number().min(0).default(0),
  is_hod: z.boolean().default(false),
});

export const facultyFormSchema = z.object({
  ...facultyPersonalSchema.shape,
  ...facultyProfessionalSchema.shape,
});

export type FacultyPersonalInput = z.infer<typeof facultyPersonalSchema>;
export type FacultyProfessionalInput = z.infer<typeof facultyProfessionalSchema>;
export type FacultyFormInput = z.infer<typeof facultyFormSchema>;
