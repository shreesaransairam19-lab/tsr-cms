import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyDecimals(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function generateRollNumber(
  departmentCode: string,
  batchYear: number,
  sequence: number
): string {
  const batch = batchYear.toString().slice(-2);
  const dept = departmentCode.toUpperCase().slice(0, 3);
  const seq = sequence.toString().padStart(3, "0");
  return `${batch}${dept}${seq}`;
}

type GradingSystem = "percentage" | "cbse_10" | "cbse_absolute" | "custom";

interface GradeResult {
  grade: string;
  gradePoint: number;
  classification: string;
}

const CBSE_10_SCALE: { max: number; min: number; grade: string; gp: number }[] =
  [
    { max: 100, min: 91, grade: "A1", gp: 10 },
    { max: 90, min: 81, grade: "A2", gp: 9 },
    { max: 80, min: 71, grade: "B1", gp: 8 },
    { max: 70, min: 61, grade: "B2", gp: 7 },
    { max: 60, min: 51, grade: "C1", gp: 6 },
    { max: 50, min: 41, grade: "C2", gp: 5 },
    { max: 40, min: 33, grade: "D", gp: 4 },
    { max: 32, min: 0, grade: "E", gp: 0 },
  ];

const CBSE_ABSOLUTE: {
  max: number;
  min: number;
  grade: string;
  classification: string;
}[] = [
  { max: 100, min: 90, grade: "O", classification: "Outstanding" },
  { max: 89, min: 80, grade: "A+", classification: "Excellent" },
  { max: 79, min: 70, grade: "A", classification: "Very Good" },
  { max: 69, min: 60, grade: "B+", classification: "Good" },
  { max: 59, min: 50, grade: "B", classification: "Average" },
  { max: 49, min: 40, grade: "C", classification: "Below Average" },
  { max: 39, min: 33, grade: "P", classification: "Pass" },
  { max: 32, min: 0, grade: "F", classification: "Fail" },
];

export function calculateGrade(
  marks: number,
  maxMarks: number,
  system: GradingSystem = "cbse_10"
): GradeResult {
  const percentage = maxMarks > 0 ? (marks / maxMarks) * 100 : 0;

  switch (system) {
    case "cbse_10": {
      const band =
        CBSE_10_SCALE.find((b) => percentage >= b.min && percentage <= b.max) ??
        CBSE_10_SCALE[CBSE_10_SCALE.length - 1];
      return {
        grade: band.grade,
        gradePoint: band.gp,
        classification:
          percentage >= 33 ? "Pass" : "Fail",
      };
    }

    case "cbse_absolute": {
      const band =
        CBSE_ABSOLUTE.find(
          (b) => percentage >= b.min && percentage <= b.max
        ) ?? CBSE_ABSOLUTE[CBSE_ABSOLUTE.length - 1];
      return {
        grade: band.grade,
        gradePoint: percentage / 10,
        classification: band.classification,
      };
    }

    case "percentage": {
      let grade: string;
      let classification: string;
      if (percentage >= 90) {
        grade = "A+";
        classification = "Distinction";
      } else if (percentage >= 80) {
        grade = "A";
        classification = "First Class with Distinction";
      } else if (percentage >= 70) {
        grade = "B+";
        classification = "First Class";
      } else if (percentage >= 60) {
        grade = "B";
        classification = "Second Class";
      } else if (percentage >= 50) {
        grade = "C";
        classification = "Third Class";
      } else if (percentage >= 40) {
        grade = "D";
        classification = "Pass";
      } else {
        grade = "F";
        classification = "Fail";
      }
      return { grade, gradePoint: percentage / 10, classification };
    }

    default: {
      if (percentage >= 90) return { grade: "O", gradePoint: 10, classification: "Outstanding" };
      if (percentage >= 80) return { grade: "A+", gradePoint: 9, classification: "Excellent" };
      if (percentage >= 70) return { grade: "A", gradePoint: 8, classification: "Very Good" };
      if (percentage >= 60) return { grade: "B+", gradePoint: 7, classification: "Good" };
      if (percentage >= 50) return { grade: "B", gradePoint: 6, classification: "Average" };
      if (percentage >= 40) return { grade: "C", gradePoint: 5, classification: "Below Average" };
      if (percentage >= 33) return { grade: "P", gradePoint: 4, classification: "Pass" };
      return { grade: "F", gradePoint: 0, classification: "Fail" };
    }
  }
}

interface SubjectMark {
  marksObtained: number;
  maxMarks: number;
  credits: number;
  gradePoints?: number;
}

export function calculateSGPA(subjects: SubjectMark[]): number {
  if (!subjects.length) return 0;

  let totalCredits = 0;
  let totalGradePoints = 0;

  for (const subject of subjects) {
    const gp =
      subject.gradePoints ??
      calculateGrade(subject.marksObtained, subject.maxMarks, "cbse_10")
        .gradePoint;
    totalCredits += subject.credits;
    totalGradePoints += gp * subject.credits;
  }

  return totalCredits > 0
    ? Math.round((totalGradePoints / totalCredits) * 100) / 100
    : 0;
}

interface SemesterData {
  sgpa: number;
  totalCredits: number;
}

export function calculateCGPA(semesters: SemesterData[]): number {
  if (!semesters.length) return 0;

  let totalCredits = 0;
  let totalWeightedSGPA = 0;

  for (const sem of semesters) {
    totalCredits += sem.totalCredits;
    totalWeightedSGPA += sem.sgpa * sem.totalCredits;
  }

  return totalCredits > 0
    ? Math.round((totalWeightedSGPA / totalCredits) * 100) / 100
    : 0;
}

export function calculatePercentage(sgpa: number): number {
  return Math.round(sgpa * 10 * 100) / 100;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "...";
}

export function generateId(prefix: string = ""): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function calculateAttendancePercentage(
  present: number,
  total: number
): number {
  if (total === 0) return 0;
  return Math.round((present / total) * 100 * 100) / 100;
}

export function getAttendanceStatus(percentage: number): {
  status: string;
  color: string;
} {
  if (percentage >= 90) return { status: "Excellent", color: "text-green-600" };
  if (percentage >= 80) return { status: "Good", color: "text-blue-600" };
  if (percentage >= 75) return { status: "Average", color: "text-yellow-600" };
  if (percentage >= 60) return { status: "Poor", color: "text-orange-600" };
  return { status: "Critical", color: "text-red-600" };
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
