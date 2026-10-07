import type { ExamResult, Subject } from "@/types";

// ─── Grading Systems ──────────────────────────────────────────────────────────

type GradingSystem = "marks_percentage" | "gpa" | "credit_based";

interface GradeResult {
  grade: string;
  gradePoint: number;
  classification: string;
  isPassed: boolean;
}

const PERCENTAGE_BANDS: {
  max: number;
  min: number;
  grade: string;
  gp: number;
  classification: string;
}[] = [
  { max: 100, min: 90, grade: "O", gp: 10, classification: "Outstanding" },
  { max: 89, min: 80, grade: "A+", gp: 9, classification: "Excellent" },
  { max: 79, min: 70, grade: "A", gp: 8, classification: "Very Good" },
  { max: 69, min: 60, grade: "B+", gp: 7, classification: "Good" },
  { max: 59, min: 50, grade: "B", gp: 6, classification: "Average" },
  { max: 49, min: 40, grade: "C", gp: 5, classification: "Below Average" },
  { max: 39, min: 33, grade: "P", gp: 4, classification: "Pass" },
  { max: 32, min: 0, grade: "F", gp: 0, classification: "Fail" },
];

const GPA_BANDS: {
  max: number;
  min: number;
  grade: string;
  classification: string;
}[] = [
  { max: 10, min: 9, grade: "O", classification: "Outstanding" },
  { max: 8.99, min: 8, grade: "A+", classification: "Excellent" },
  { max: 7.99, min: 7, grade: "A", classification: "Very Good" },
  { max: 6.99, min: 6, grade: "B+", classification: "Good" },
  { max: 5.99, min: 5, grade: "B", classification: "Average" },
  { max: 4.99, min: 4, grade: "C", classification: "Below Average" },
  { max: 3.99, min: 3, grade: "P", classification: "Pass" },
  { max: 2.99, min: 0, grade: "F", classification: "Fail" },
];

const PASSING_PERCENTAGE = 33;

export function calculateGrade(
  marks: number,
  maxMarks: number,
  system: GradingSystem = "marks_percentage"
): GradeResult {
  if (maxMarks <= 0) {
    return { grade: "F", gradePoint: 0, classification: "Fail", isPassed: false };
  }

  const percentage = (marks / maxMarks) * 100;

  switch (system) {
    case "marks_percentage": {
      const band =
        PERCENTAGE_BANDS.find((b) => percentage >= b.min && percentage <= b.max) ??
        PERCENTAGE_BANDS[PERCENTAGE_BANDS.length - 1];
      return {
        grade: band.grade,
        gradePoint: band.gp,
        classification: band.classification,
        isPassed: percentage >= PASSING_PERCENTAGE,
      };
    }

    case "gpa": {
      const gradePoint = Math.round(marks * 100) / 100;
      const clampedGP = Math.min(10, Math.max(0, gradePoint));
      const band =
        GPA_BANDS.find((b) => clampedGP >= b.min && clampedGP <= b.max) ??
        GPA_BANDS[GPA_BANDS.length - 1];
      return {
        grade: band.grade,
        gradePoint: clampedGP,
        classification: band.classification,
        isPassed: clampedGP >= 4,
      };
    }

    case "credit_based": {
      const band =
        PERCENTAGE_BANDS.find((b) => percentage >= b.min && percentage <= b.max) ??
        PERCENTAGE_BANDS[PERCENTAGE_BANDS.length - 1];
      return {
        grade: band.grade,
        gradePoint: band.gp,
        classification: band.classification,
        isPassed: percentage >= PASSING_PERCENTAGE,
      };
    }

    default: {
      const band =
        PERCENTAGE_BANDS.find((b) => percentage >= b.min && percentage <= b.max) ??
        PERCENTAGE_BANDS[PERCENTAGE_BANDS.length - 1];
      return {
        grade: band.grade,
        gradePoint: band.gp,
        classification: band.classification,
        isPassed: percentage >= PASSING_PERCENTAGE,
      };
    }
  }
}

// ─── SGPA Calculation ─────────────────────────────────────────────────────────

interface SubjectResult {
  marksObtained: number;
  maxMarks: number;
  credits: number;
  gradePoints?: number;
}

export function calculateSGPA(subjects: SubjectResult[]): number {
  if (!subjects.length) return 0;

  let totalCredits = 0;
  let totalWeightedGP = 0;

  for (const subject of subjects) {
    const gp =
      subject.gradePoints ??
      calculateGrade(subject.marksObtained, subject.maxMarks, "marks_percentage")
        .gradePoint;

    totalCredits += subject.credits;
    totalWeightedGP += gp * subject.credits;
  }

  return totalCredits > 0
    ? Math.round((totalWeightedGP / totalCredits) * 100) / 100
    : 0;
}

// ─── CGPA Calculation ─────────────────────────────────────────────────────────

interface SemesterSGPA {
  sgpa: number;
  totalCredits: number;
}

export function calculateCGPA(semesters: SemesterSGPA[]): number {
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

// ─── Percentage from SGPA ─────────────────────────────────────────────────────

export function sgpaToPercentage(sgpa: number): number {
  return Math.round(sgpa * 10 * 100) / 100;
}

// ─── Classification from CGPA ─────────────────────────────────────────────────

export function getClassification(cgpa: number): string {
  if (cgpa >= 9) return "Outstanding";
  if (cgpa >= 8) return "Excellent";
  if (cgpa >= 7) return "Very Good";
  if (cgpa >= 6) return "Good";
  if (cgpa >= 5) return "Average";
  if (cgpa >= 4) return "Pass";
  return "Fail";
}

// ─── Batch Calculate Results ──────────────────────────────────────────────────

export function calculateBulkGrades(
  results: { marks: number; maxMarks: number; credits: number }[],
  system: GradingSystem = "marks_percentage"
): { grade: string; gradePoint: number; isPassed: boolean }[] {
  return results.map((r) => {
    const g = calculateGrade(r.marks, r.maxMarks, system);
    return { grade: g.grade, gradePoint: g.gradePoint, isPassed: g.isPassed };
  });
}

// ─── Build Semester Results from Exam Results ─────────────────────────────────

export function buildSemesterResults(
  examResults: (ExamResult & { subject?: Subject })[]
): SubjectResult[] {
  const grouped = new Map<string, { marksObtained: number; maxMarks: number; credits: number }>();

  for (const result of examResults) {
    if (result.is_absent || result.marks_obtained === null) continue;

    const subjectId = result.subject_id;
    const existing = grouped.get(subjectId);

    if (existing) {
      existing.marksObtained += result.marks_obtained;
    } else {
      grouped.set(subjectId, {
        marksObtained: result.marks_obtained,
        maxMarks: result.exam_schedule?.max_marks ?? result.subject?.max_marks ?? 100,
        credits: result.subject?.credits ?? 4,
      });
    }
  }

  return Array.from(grouped.values());
}
