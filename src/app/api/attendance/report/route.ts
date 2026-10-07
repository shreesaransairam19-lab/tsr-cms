import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";

interface AttendanceReportRow {
  student_id: string;
  roll_number: string;
  full_name: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  total_classes: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const { searchParams } = new URL(request.url);

    const subject_id = searchParams.get("subject_id") || "";
    const department_id = searchParams.get("department_id") || "";
    const program_id = searchParams.get("program_id") || "";
    const semester = searchParams.get("semester") || "";
    const date_from = searchParams.get("date_from") || "";
    const date_to = searchParams.get("date_to") || "";
    const report_type = searchParams.get("report_type") || "student_wise";
    const low_attendance_threshold = parseInt(searchParams.get("threshold") || "75", 10);

    let classQuery = supabase
      .from("attendance_classes")
      .select("id, subject_id, date, total_students");

    if (subject_id) classQuery = classQuery.eq("subject_id", subject_id);
    if (date_from) classQuery = classQuery.gte("date", date_from);
    if (date_to) classQuery = classQuery.lte("date", date_to);

    const { data: classes, error: classError } = await classQuery;

    if (classError) {
      return NextResponse.json({ success: false, data: null, error: classError.message }, { status: 500 });
    }

    if (!classes || classes.length === 0) {
      return NextResponse.json({
        success: true,
        data: { report: [], summary: { total_classes: 0, avg_attendance: 0 } },
        error: null,
      });
    }

    const classIds = classes.map((c) => c.id);
    const totalClasses = classes.length;

    const classSubjectMap = new Map<string, string>();
    for (const c of classes) {
      classSubjectMap.set(c.id, c.subject_id);
    }

    let studentQuery = supabase
      .from("students")
      .select(`
        id, roll_number, first_name, last_name,
        user:users(id, email),
        department:departments(id, name),
        program:programs(id, name)
      `)
      .eq("is_active", true);

    if (department_id) studentQuery = studentQuery.eq("department_id", department_id);
    if (program_id) studentQuery = studentQuery.eq("program_id", program_id);
    if (semester) studentQuery = studentQuery.eq("semester", parseInt(semester, 10));

    const { data: students, error: studentError } = await studentQuery;

    if (studentError) {
      return NextResponse.json({ success: false, data: null, error: studentError.message }, { status: 500 });
    }

    if (!students || students.length === 0) {
      return NextResponse.json({
        success: true,
        data: { report: [], summary: { total_classes: totalClasses, avg_attendance: 0 } },
        error: null,
      });
    }

    const studentIds = students.map((s) => s.id);

    const { data: records, error: recordError } = await supabase
      .from("attendance_records")
      .select("student_id, attendance_class_id, status")
      .in("student_id", studentIds)
      .in("attendance_class_id", classIds);

    if (recordError) {
      return NextResponse.json({ success: false, data: null, error: recordError.message }, { status: 500 });
    }

    if (report_type === "student_wise") {
      const studentStats = new Map<string, {
        roll_number: string;
        full_name: string;
        subjectStats: Map<string, {
          subject_id: string;
          subject_name: string;
          subject_code: string;
          total: number;
          present: number;
          absent: number;
          late: number;
          excused: number;
        }>;
      }>();

      for (const student of students) {
        const su = student.user as unknown as { email?: string } | null;
        studentStats.set(student.id, {
          roll_number: student.roll_number,
          full_name: `${student.first_name || ""} ${student.last_name || ""}`.trim() || su?.email?.split("@")[0] || "",
          subjectStats: new Map(),
        });
      }

      const subjectIds = new Set(classIds.map((cid) => classSubjectMap.get(cid) || ""));
      const { data: subjectsData } = await supabase
        .from("subjects")
        .select("id, name, code")
        .in("id", Array.from(subjectIds));

      const subjectMap = new Map<string, { name: string; code: string }>();
      for (const s of subjectsData || []) {
        subjectMap.set(s.id, { name: s.name, code: s.code });
      }

      for (const record of records || []) {
        const stats = studentStats.get(record.student_id);
        if (!stats) continue;

        const subjectId = classSubjectMap.get(record.attendance_class_id) || "";
        if (!stats.subjectStats.has(subjectId)) {
          const subInfo = subjectMap.get(subjectId);
          stats.subjectStats.set(subjectId, {
            subject_id: subjectId,
            subject_name: subInfo?.name || "Unknown",
            subject_code: subInfo?.code || "",
            total: 0,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
          });
        }

        const subStats = stats.subjectStats.get(subjectId)!;
        subStats.total++;
        if (record.status === "present") subStats.present++;
        else if (record.status === "absent") subStats.absent++;
        else if (record.status === "late") subStats.late++;
        else if (record.status === "excused") subStats.excused++;
      }

      const report: AttendanceReportRow[] = [];
      let totalPresent = 0;
      let totalAll = 0;

      for (const [studentId, stats] of studentStats) {
        for (const [, subStats] of stats.subjectStats) {
          const attended = subStats.present + subStats.late;
          const pct = subStats.total > 0 ? Math.round((attended / subStats.total) * 100 * 100) / 100 : 0;

          totalPresent += attended;
          totalAll += subStats.total;

          report.push({
            student_id: studentId,
            roll_number: stats.roll_number,
            full_name: stats.full_name,
            subject_id: subStats.subject_id,
            subject_name: subStats.subject_name,
            subject_code: subStats.subject_code,
            total_classes: subStats.total,
            present: subStats.present,
            absent: subStats.absent,
            late: subStats.late,
            excused: subStats.excused,
            percentage: pct,
          });
        }
      }

      const lowAttendance = report.filter((r) => r.percentage < low_attendance_threshold);

      return NextResponse.json({
        success: true,
        data: {
          report,
          low_attendance: lowAttendance,
          summary: {
            total_classes: totalClasses,
            avg_attendance: totalAll > 0 ? Math.round((totalPresent / totalAll) * 100 * 100) / 100 : 0,
          },
        },
        error: null,
      });
    }

    if (report_type === "subject_wise") {
      const subjectStats = new Map<string, {
        subject_name: string;
        subject_code: string;
        total_classes: number;
        total_present: number;
        total_absent: number;
        total_late: number;
        total_excused: number;
      }>();

      const subjectIds = new Set(classIds.map((cid) => classSubjectMap.get(cid) || ""));
      const { data: subjectsData } = await supabase
        .from("subjects")
        .select("id, name, code")
        .in("id", Array.from(subjectIds));

      for (const s of subjectsData || []) {
        subjectStats.set(s.id, {
          subject_name: s.name,
          subject_code: s.code,
          total_classes: classes.filter((c) => c.subject_id === s.id).length,
          total_present: 0,
          total_absent: 0,
          total_late: 0,
          total_excused: 0,
        });
      }

      for (const record of records || []) {
        const subjectId = classSubjectMap.get(record.attendance_class_id) || "";
        const stats = subjectStats.get(subjectId);
        if (!stats) continue;

        if (record.status === "present") stats.total_present++;
        else if (record.status === "absent") stats.total_absent++;
        else if (record.status === "late") stats.total_late++;
        else if (record.status === "excused") stats.total_excused++;
      }

      const report = Array.from(subjectStats.values()).map((s) => {
        const total = s.total_present + s.total_absent + s.total_late + s.total_excused;
        const attended = s.total_present + s.total_late;
        return {
          ...s,
          total_records: total,
          percentage: total > 0 ? Math.round((attended / total) * 100 * 100) / 100 : 0,
        };
      });

      return NextResponse.json({
        success: true,
        data: { report, summary: { total_classes: totalClasses } },
        error: null,
      });
    }

    return NextResponse.json({
      success: true,
      data: { report: [], summary: { total_classes: totalClasses } },
      error: null,
    });
  } catch (err) {
    return NextResponse.json({
      success: false, data: null,
      error: err instanceof Error ? err.message : "Internal server error",
    }, { status: 500 });
  }
}
