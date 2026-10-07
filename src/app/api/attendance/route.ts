import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireFacultyOrAdmin } from "@/lib/auth-helpers";
import type { ApiListResponse, ApiBulkResponse, AttendanceRecord, AttendanceClass } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { supabase, user } = auth;
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const per_page = parseInt(searchParams.get("per_page") || "20", 10);
    const subject_id = searchParams.get("subject_id") || "";
    const faculty_id = searchParams.get("faculty_id") || "";
    const student_id = searchParams.get("student_id") || "";
    const date_from = searchParams.get("date_from") || "";
    const date_to = searchParams.get("date_to") || "";
    const status = searchParams.get("status") || "";
    const attendance_class_id = searchParams.get("attendance_class_id") || "";

    const { data: profile } = await supabase
      .from("users").select("role").eq("id", user.id).single();
    const role = profile?.role || "student";

    if (attendance_class_id) {
      const { data: records, error } = await supabase
        .from("attendance_records")
        .select(`
          *,
          student:students(id, roll_number, first_name, last_name, user:users(id, email)),
          attendance_class:attendance_classes(id, subject_id, date, subject:subjects(id, name, code))
        `)
        .eq("attendance_class_id", attendance_class_id)
        .order("created_at", { ascending: true });

      if (error) {
        return NextResponse.json<ApiListResponse<AttendanceRecord>>({
          success: false, data: null, error: error.message,
        }, { status: 500 });
      }

      (records || []).forEach((item: Record<string, unknown>) => {
        const student = item.student as Record<string, unknown> | null;
        if (student) {
          const su = student.user as Record<string, unknown> | null;
          if (su) su.full_name = `${student.first_name || ""} ${student.last_name || ""}`.trim() || (su.email as string)?.split("@")[0] || "";
        }
      });

      return NextResponse.json<ApiListResponse<AttendanceRecord>>({
        success: true,
        data: {
          items: records as unknown as AttendanceRecord[],
          total: records?.length || 0,
          page: 1,
          per_page: records?.length || 0,
          total_pages: 1,
          has_next: false,
          has_previous: false,
        },
        error: null,
      });
    }

    if (student_id) {
      let countQuery = supabase
        .from("attendance_records")
        .select("*", { count: "exact", head: true })
        .eq("student_id", student_id);

      let dataQuery = supabase
        .from("attendance_records")
        .select(`
          *,
          attendance_class:attendance_classes(
            id, subject_id, date, start_time, end_time,
            subject:subjects(id, name, code, credits)
          )
        `)
        .eq("student_id", student_id);

      if (subject_id) {
        countQuery = countQuery.eq("attendance_class.subject_id", subject_id);
        dataQuery = dataQuery.eq("attendance_class.subject_id", subject_id);
      }
      if (date_from) {
        countQuery = countQuery.gte("attendance_class.date", date_from);
        dataQuery = dataQuery.gte("attendance_class.date", date_from);
      }
      if (date_to) {
        countQuery = countQuery.lte("attendance_class.date", date_to);
        dataQuery = dataQuery.lte("attendance_class.date", date_to);
      }
      if (status) {
        countQuery = countQuery.eq("status", status);
        dataQuery = dataQuery.eq("status", status);
      }

      const { count } = await countQuery;

      const from = (page - 1) * per_page;
      const to = from + per_page - 1;

      const { data: records, error } = await dataQuery
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        return NextResponse.json<ApiListResponse<AttendanceRecord>>({
          success: false, data: null, error: error.message,
        }, { status: 500 });
      }

      const total = count || 0;
      return NextResponse.json<ApiListResponse<AttendanceRecord>>({
        success: true,
        data: {
          items: records as unknown as AttendanceRecord[],
          total,
          page,
          per_page,
          total_pages: Math.ceil(total / per_page),
          has_next: page < Math.ceil(total / per_page),
          has_previous: page > 1,
        },
        error: null,
      });
    }

    let classQuery = supabase
      .from("attendance_classes")
      .select(`
        *,
        subject:subjects(id, name, code, program:programs(name), semester_number),
        faculty:faculty(id, employee_id, first_name, last_name, user:users(id, email))
      `);

    if (subject_id) classQuery = classQuery.eq("subject_id", subject_id);
    if (faculty_id) classQuery = classQuery.eq("faculty_id", faculty_id);
    if (date_from) classQuery = classQuery.gte("date", date_from);
    if (date_to) classQuery = classQuery.lte("date", date_to);

    let countClassQuery = supabase
      .from("attendance_classes")
      .select("*", { count: "exact", head: true });

    if (subject_id) countClassQuery = countClassQuery.eq("subject_id", subject_id);
    if (faculty_id) countClassQuery = countClassQuery.eq("faculty_id", faculty_id);
    if (date_from) countClassQuery = countClassQuery.gte("date", date_from);
    if (date_to) countClassQuery = countClassQuery.lte("date", date_to);

    if (role === "faculty") {
      const { data: facultyRecord } = await supabase
        .from("faculty").select("id").eq("user_id", user.id).single();
      if (facultyRecord) {
        countClassQuery = countClassQuery.eq("faculty_id", facultyRecord.id);
      }
    }

    const { count } = await countClassQuery;

    const from = (page - 1) * per_page;
    const to = from + per_page - 1;

    const { data: classes, error } = await classQuery
      .order("date", { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json<ApiListResponse<AttendanceClass>>({
        success: false, data: null, error: error.message,
      }, { status: 500 });
    }

    (classes || []).forEach((item: Record<string, unknown>) => {
      const fac = item.faculty as Record<string, unknown> | null;
      if (fac) {
        const fu = fac.user as Record<string, unknown> | null;
        if (fu) fu.full_name = `${fac.first_name || ""} ${fac.last_name || ""}`.trim() || (fu.email as string)?.split("@")[0] || "";
      }
    });

    const total = count || 0;
    return NextResponse.json<ApiListResponse<AttendanceClass>>({
      success: true,
      data: {
        items: classes as unknown as AttendanceClass[],
        total,
        page,
        per_page,
        total_pages: Math.ceil(total / per_page),
        has_next: page < Math.ceil(total / per_page),
        has_previous: page > 1,
      },
      error: null,
    });
  } catch (err) {
    return NextResponse.json({
      success: false, data: null,
      error: err instanceof Error ? err.message : "Internal server error",
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireFacultyOrAdmin();
    if (auth.response) return auth.response;
    const { supabase, user } = auth;
    const body = await request.json();

    const {
      subject_id,
      date,
      start_time,
      end_time,
      room_number,
      records,
    } = body as {
      subject_id: string;
      date: string;
      start_time: string;
      end_time: string;
      room_number?: string;
      records: { student_id: string; status: string; remarks?: string }[];
    };

    if (!subject_id || !date || !records?.length) {
      return NextResponse.json({
        success: false, data: null,
        error: "subject_id, date, and records are required",
      }, { status: 400 });
    }

    const { data: facultyRecord } = await supabase
      .from("faculty").select("id").eq("user_id", user.id).single();

    if (!facultyRecord) {
      return NextResponse.json({
        success: false, data: null, error: "Faculty record not found",
      }, { status: 404 });
    }

    const { data: existingClass } = await supabase
      .from("attendance_classes")
      .select("id")
      .eq("subject_id", subject_id)
      .eq("date", date)
      .eq("faculty_id", facultyRecord.id)
      .single();

    let classId: string;

    if (existingClass) {
      classId = existingClass.id;
      await supabase
        .from("attendance_classes")
        .update({
          start_time,
          end_time,
          room_number: room_number || null,
          total_students: records.length,
        })
        .eq("id", classId);
    } else {
      const { data: newClass, error: classError } = await supabase
        .from("attendance_classes")
        .insert({
          subject_id,
          faculty_id: facultyRecord.id,
          date,
          start_time,
          end_time,
          room_number: room_number || null,
          total_students: records.length,
        })
        .select("id")
        .single();

      if (classError) {
        return NextResponse.json({ success: false, data: null, error: classError.message }, { status: 400 });
      }
      classId = newClass.id;
    }

    const { data: existingRecords } = await supabase
      .from("attendance_records")
      .select("id, student_id")
      .eq("attendance_class_id", classId);

    const existingStudentIds = new Set(existingRecords?.map((r) => r.student_id) || []);

    const toInsert = records
      .filter((r) => !existingStudentIds.has(r.student_id))
      .map((r) => ({
        attendance_class_id: classId,
        student_id: r.student_id,
        status: r.status,
        remarks: r.remarks || null,
      }));

    const toUpdate = records
      .filter((r) => existingStudentIds.has(r.student_id))
      .map((r) => ({
        student_id: r.student_id,
        status: r.status,
        remarks: r.remarks || null,
      }));

    if (toInsert.length > 0) {
      const { error: insertError } = await supabase
        .from("attendance_records")
        .insert(toInsert);

      if (insertError) {
        return NextResponse.json({ success: false, data: null, error: insertError.message }, { status: 400 });
      }
    }

    for (const update of toUpdate) {
      await supabase
        .from("attendance_records")
        .update({ status: update.status, remarks: update.remarks, updated_at: new Date().toISOString() })
        .eq("attendance_class_id", classId)
        .eq("student_id", update.student_id);
    }

    return NextResponse.json({
      success: true,
      data: { id: classId },
      error: null,
      message: `Attendance marked for ${records.length} students`,
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({
      success: false, data: null,
      error: err instanceof Error ? err.message : "Internal server error",
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireFacultyOrAdmin();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const body = await request.json();

    const { id, status, remarks } = body;

    if (!id || !status) {
      return NextResponse.json({
        success: false, data: null, error: "id and status are required",
      }, { status: 400 });
    }

    const { error } = await supabase
      .from("attendance_records")
      .update({ status, remarks: remarks || null, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ success: false, data: null, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true, data: { id }, error: null, message: "Attendance updated",
    });
  } catch (err) {
    return NextResponse.json({
      success: false, data: null,
      error: err instanceof Error ? err.message : "Internal server error",
    }, { status: 500 });
  }
}
