import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth-helpers";
import { calculateGrade, calculateSGPA, calculateCGPA } from "@/lib/utils/grade-calculator";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const { searchParams } = new URL(request.url);

    const student_id = searchParams.get("student_id") || "";
    const exam_schedule_id = searchParams.get("exam_schedule_id") || "";
    const semester_id = searchParams.get("semester_id") || "";
    const subject_id = searchParams.get("subject_id") || "";

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users").select("role").eq("id", user.id).single();
    const role = profile?.role || "student";

    if (exam_schedule_id) {
      const { data: results, error } = await supabase
        .from("exam_results")
        .select(`
          *,
          student:students(id, roll_number, first_name, last_name, user:users(id, email)),
          subject:subjects(id, name, code, credits),
          exam_schedule:exam_schedules(id, exam_type, max_marks, passing_marks, exam_date)
        `)
        .eq("exam_schedule_id", exam_schedule_id)
        .order("created_at", { ascending: true });

      if (error) {
        return NextResponse.json({ success: false, data: null, error: error.message }, { status: 500 });
      }

      (results || []).forEach((item: Record<string, unknown>) => {
        const student = item.student as Record<string, unknown> | null;
        if (student) {
          const su = student.user as Record<string, unknown> | null;
          if (su) su.full_name = `${student.first_name || ""} ${student.last_name || ""}`.trim() || (su.email as string)?.split("@")[0] || "";
        }
      });

      return NextResponse.json({ success: true, data: results, error: null });
    }

    if (student_id && semester_id) {
      const { data: semSubjects } = await supabase
        .from("subjects")
        .select("id")
        .eq("semester_number", parseInt(semester_id, 10));

      const subjectIds = semSubjects?.map((s) => s.id) || [];

      const { data: results, error } = await supabase
        .from("exam_results")
        .select(`
          *,
          subject:subjects(id, name, code, credits, max_marks),
          exam_schedule:exam_schedules(id, exam_type, max_marks, exam_date)
        `)
        .eq("student_id", student_id)
        .in("subject_id", subjectIds)
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json({ success: false, data: null, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: results, error: null });
    }

    if (student_id) {
      const { data: results, error } = await supabase
        .from("exam_results")
        .select(`
          *,
          subject:subjects(id, name, code, credits, max_marks),
          exam_schedule:exam_schedules(id, exam_type, max_marks, exam_date)
        `)
        .eq("student_id", student_id)
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json({ success: false, data: null, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: results, error: null });
    }

    if (role === "faculty") {
      const { data: facultyRecord } = await supabase
        .from("faculty").select("id, department_id").eq("user_id", user.id).single();

      if (!facultyRecord) {
        return NextResponse.json({ success: false, data: null, error: "Faculty not found" }, { status: 404 });
      }

      const { data: results, error } = await supabase
        .from("exam_results")
        .select(`
          *,
          student:students(id, roll_number, first_name, last_name, user:users(id, email), department_id),
          subject:subjects(id, name, code, credits),
          exam_schedule:exam_schedules(id, exam_type, max_marks, exam_date)
        `)
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        return NextResponse.json({ success: false, data: null, error: error.message }, { status: 500 });
      }

      const filtered = results?.filter(
        (r) => (r.student as unknown as { department_id: string })?.department_id === facultyRecord.department_id
      );

      (filtered || []).forEach((item: Record<string, unknown>) => {
        const student = item.student as Record<string, unknown> | null;
        if (student) {
          const su = student.user as Record<string, unknown> | null;
          if (su) su.full_name = `${student.first_name || ""} ${student.last_name || ""}`.trim() || (su.email as string)?.split("@")[0] || "";
        }
      });

      return NextResponse.json({ success: true, data: filtered, error: null });
    }

    const { data: semesterResults, error: semError } = await supabase
      .from("semester_results")
      .select(`
        *,
        student:students(id, roll_number, first_name, last_name, user:users(id, email)),
        semester:semesters(id, number, academic_year:academic_years(name))
      `)
      .order("created_at", { ascending: false })
      .limit(200);

    if (semError) {
      return NextResponse.json({ success: false, data: null, error: semError.message }, { status: 500 });
    }

    (semesterResults || []).forEach((item: Record<string, unknown>) => {
      const student = item.student as Record<string, unknown> | null;
      if (student) {
        const su = student.user as Record<string, unknown> | null;
        if (su) su.full_name = `${student.first_name || ""} ${student.last_name || ""}`.trim() || (su.email as string)?.split("@")[0] || "";
      }
    });

    return NextResponse.json({ success: true, data: semesterResults, error: null });
  } catch (err) {
    return NextResponse.json({
      success: false, data: null,
      error: err instanceof Error ? err.message : "Internal server error",
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const body = await request.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { exam_schedule_id, marks_entries } = body as {
      exam_schedule_id: string;
      marks_entries: {
        student_id: string;
        marks_obtained: number | null;
        is_absent: boolean;
        remarks?: string;
      }[];
    };

    if (!exam_schedule_id || !marks_entries?.length) {
      return NextResponse.json({
        success: false, data: null, error: "exam_schedule_id and marks_entries are required",
      }, { status: 400 });
    }

    const { data: examSchedule, error: scheduleError } = await supabase
      .from("exam_schedules")
      .select("id, subject_id, max_marks, passing_marks")
      .eq("id", exam_schedule_id)
      .single();

    if (scheduleError || !examSchedule) {
      return NextResponse.json({
        success: false, data: null, error: "Exam schedule not found",
      }, { status: 404 });
    }

    let inserted = 0;
    let updated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const entry of marks_entries) {
      const gradeResult = entry.is_absent
        ? { grade: "AB", gradePoint: 0, isPassed: false }
        : calculateGrade(
            entry.marks_obtained ?? 0,
            examSchedule.max_marks,
            "marks_percentage"
          );

      const { data: existing } = await supabase
        .from("exam_results")
        .select("id")
        .eq("exam_schedule_id", exam_schedule_id)
        .eq("student_id", entry.student_id)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("exam_results")
          .update({
            marks_obtained: entry.marks_obtained,
            is_absent: entry.is_absent,
            grade: gradeResult.grade,
            grade_point: gradeResult.gradePoint,
            remarks: entry.remarks || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) {
          failed++;
          errors.push(`Student ${entry.student_id}: ${error.message}`);
        } else {
          updated++;
        }
      } else {
        const { error } = await supabase
          .from("exam_results")
          .insert({
            student_id: entry.student_id,
            exam_schedule_id,
            subject_id: examSchedule.subject_id,
            marks_obtained: entry.marks_obtained,
            is_absent: entry.is_absent,
            grade: gradeResult.grade,
            grade_point: gradeResult.gradePoint,
            remarks: entry.remarks || null,
            created_by: user.id,
          });

        if (error) {
          failed++;
          errors.push(`Student ${entry.student_id}: ${error.message}`);
        } else {
          inserted++;
        }
      }
    }

    return NextResponse.json({
      success: failed === 0,
      data: { inserted, updated, failed },
      error: errors.length > 0 ? errors.join("; ") : null,
      message: `Processed: ${inserted} inserted, ${updated} updated, ${failed} failed`,
    }, { status: failed > 0 ? 207 : 200 });
  } catch (err) {
    return NextResponse.json({
      success: false, data: null,
      error: err instanceof Error ? err.message : "Internal server error",
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const body = await request.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, data: null, error: "Unauthorized" }, { status: 401 });
    }

    const { action, student_id, semester_id } = body;

    if (action === "publish") {
      const { student_id: sid, semester_id: semId } = body;
      if (!sid || !semId) {
        return NextResponse.json({
          success: false, data: null, error: "student_id and semester_id are required for publish",
        }, { status: 400 });
      }

      const { data: semester } = await supabase
        .from("semesters").select("id, number").eq("id", semId).single();

      if (!semester) {
        return NextResponse.json({ success: false, data: null, error: "Semester not found" }, { status: 404 });
      }

      const { data: semSubjects } = await supabase
        .from("subjects").select("id, credits, max_marks").eq("semester_number", semester.number);

      const subjectIds = semSubjects?.map((s) => s.id) || [];
      const subjectMap = new Map(semSubjects?.map((s) => [s.id, { credits: s.credits, maxMarks: s.max_marks }]) || []);

      const { data: examResults } = await supabase
        .from("exam_results")
        .select("subject_id, marks_obtained, grade_point, is_absent")
        .eq("student_id", sid)
        .in("subject_id", subjectIds);

      const subjectResults = new Map<string, { totalMarks: number; maxMarks: number; credits: number; gradePoints: number; count: number }>();

      for (const result of examResults || []) {
        if (result.is_absent || result.marks_obtained === null) continue;

        const subInfo = subjectMap.get(result.subject_id);
        if (!subInfo) continue;

        const existing = subjectResults.get(result.subject_id);
        if (existing) {
          existing.totalMarks += result.marks_obtained;
          existing.gradePoints += result.grade_point || 0;
          existing.count++;
        } else {
          subjectResults.set(result.subject_id, {
            totalMarks: result.marks_obtained,
            maxMarks: subInfo.maxMarks,
            credits: subInfo.credits,
            gradePoints: result.grade_point || 0,
            count: 1,
          });
        }
      }

      const sgpaSubjects = Array.from(subjectResults.values()).map((s) => ({
        marksObtained: s.totalMarks / s.count,
        maxMarks: s.maxMarks,
        credits: s.credits,
        gradePoints: s.gradePoints / s.count,
      }));

      const sgpa = calculateSGPA(sgpaSubjects);
      const totalMarks = sgpaSubjects.reduce((sum, s) => sum + s.marksObtained, 0);
      const maxMarks = sgpaSubjects.reduce((sum, s) => sum + s.maxMarks, 0);
      const percentage = maxMarks > 0 ? Math.round((totalMarks / maxMarks) * 100 * 100) / 100 : 0;

      const { data: existingSemResult } = await supabase
        .from("semester_results")
        .select("id")
        .eq("student_id", sid)
        .eq("semester_id", semId)
        .single();

      const semResultData = {
        student_id: sid,
        semester_id: semId,
        sgpa,
        total_marks: Math.round(totalMarks * 100) / 100,
        max_marks: maxMarks,
        percentage,
        is_passed: sgpa >= 4,
        is_backlog: sgpa < 4,
        result_date: new Date().toISOString().split("T")[0],
        published_by: user.id,
        updated_at: new Date().toISOString(),
      };

      let semResultId: string;

      if (existingSemResult) {
        await supabase
          .from("semester_results")
          .update(semResultData)
          .eq("id", existingSemResult.id);
        semResultId = existingSemResult.id;
      } else {
        const { data: newResult } = await supabase
          .from("semester_results")
          .insert(semResultData)
          .select("id")
          .single();
        semResultId = newResult?.id || "";
      }

      const { data: allSemResults } = await supabase
        .from("semester_results")
        .select(`
          sgpa,
          semester:semesters(number, academic_year:academic_years(is_current))
        `)
        .eq("student_id", sid)
        .eq("is_passed", true);

      const semDataList = (allSemResults || [])
        .filter((r) => (r.semester as unknown as { academic_year: { is_current: boolean } })?.academic_year?.is_current !== false)
        .map((r) => ({
          sgpa: r.sgpa || 0,
          totalCredits: semSubjects?.reduce((sum, s) => sum + s.credits, 0) || 0,
        }));

      const cgpa = calculateCGPA(semDataList);

      await supabase
        .from("semester_results")
        .update({ cgpa, updated_at: new Date().toISOString() })
        .eq("id", semResultId);

      return NextResponse.json({
        success: true,
        data: { sgpa, cgpa, percentage, semester_result_id: semResultId },
        error: null,
        message: "Results calculated and published",
      });
    }

    return NextResponse.json({
      success: false, data: null, error: "Invalid action",
    }, { status: 400 });
  } catch (err) {
    return NextResponse.json({
      success: false, data: null,
      error: err instanceof Error ? err.message : "Internal server error",
    }, { status: 500 });
  }
}
