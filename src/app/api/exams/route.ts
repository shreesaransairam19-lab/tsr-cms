import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth-helpers";
import type { ApiListResponse, ExamSchedule } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const per_page = parseInt(searchParams.get("per_page") || "20", 10);
    const subject_id = searchParams.get("subject_id") || "";
    const semester_id = searchParams.get("semester_id") || "";
    const exam_type = searchParams.get("exam_type") || "";
    const date_from = searchParams.get("date_from") || "";
    const date_to = searchParams.get("date_to") || "";

    let countQuery = supabase
      .from("exam_schedules")
      .select("*", { count: "exact", head: true });

    let dataQuery = supabase
      .from("exam_schedules")
      .select(`
        *,
        subject:subjects(id, name, code, credits, program:programs(name)),
        semester:semesters(id, number, academic_year:academic_years(name))
      `);

    if (subject_id) {
      countQuery = countQuery.eq("subject_id", subject_id);
      dataQuery = dataQuery.eq("subject_id", subject_id);
    }
    if (semester_id) {
      countQuery = countQuery.eq("semester_id", semester_id);
      dataQuery = dataQuery.eq("semester_id", semester_id);
    }
    if (exam_type) {
      countQuery = countQuery.eq("exam_type", exam_type);
      dataQuery = dataQuery.eq("exam_type", exam_type);
    }
    if (date_from) {
      countQuery = countQuery.gte("exam_date", date_from);
      dataQuery = dataQuery.gte("exam_date", date_from);
    }
    if (date_to) {
      countQuery = countQuery.lte("exam_date", date_to);
      dataQuery = dataQuery.lte("exam_date", date_to);
    }

    const { count, error: countError } = await countQuery;
    if (countError) {
      return NextResponse.json<ApiListResponse<ExamSchedule>>({
        success: false, data: null, error: countError.message,
      }, { status: 500 });
    }

    const from = (page - 1) * per_page;
    const to = from + per_page - 1;

    const { data, error } = await dataQuery
      .order("exam_date", { ascending: true })
      .range(from, to);

    if (error) {
      return NextResponse.json<ApiListResponse<ExamSchedule>>({
        success: false, data: null, error: error.message,
      }, { status: 500 });
    }

    const total = count || 0;
    return NextResponse.json<ApiListResponse<ExamSchedule>>({
      success: true,
      data: {
        items: data as unknown as ExamSchedule[],
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
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const body = await request.json();

    const {
      subject_id,
      semester_id,
      exam_type,
      exam_date,
      start_time,
      end_time,
      room_number,
      max_marks,
      passing_marks,
      instructions,
    } = body;

    if (!subject_id || !semester_id || !exam_type || !exam_date || !start_time || !end_time) {
      return NextResponse.json({
        success: false, data: null,
        error: "subject_id, semester_id, exam_type, exam_date, start_time, and end_time are required",
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("exam_schedules")
      .insert({
        subject_id,
        semester_id,
        exam_type,
        exam_date,
        start_time,
        end_time,
        room_number: room_number || null,
        max_marks: max_marks || 100,
        passing_marks: passing_marks || 40,
        instructions: instructions || null,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ success: false, data: null, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true, data: { id: data.id }, error: null,
      message: "Exam schedule created successfully",
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
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const body = await request.json();

    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({
        success: false, data: null, error: "Exam schedule ID is required",
      }, { status: 400 });
    }

    const cleanUpdate: Record<string, unknown> = {};
    const allowedFields = [
      "subject_id", "semester_id", "exam_type", "exam_date",
      "start_time", "end_time", "room_number", "max_marks",
      "passing_marks", "instructions",
    ];

    for (const field of allowedFields) {
      if (field in updateData) {
        cleanUpdate[field] = updateData[field];
      }
    }

    if (Object.keys(cleanUpdate).length === 0) {
      return NextResponse.json({
        success: false, data: null, error: "No fields to update",
      }, { status: 400 });
    }

    cleanUpdate.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from("exam_schedules")
      .update(cleanUpdate)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ success: false, data: null, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true, data: { id }, error: null, message: "Exam schedule updated",
    });
  } catch (err) {
    return NextResponse.json({
      success: false, data: null,
      error: err instanceof Error ? err.message : "Internal server error",
    }, { status: 500 });
  }
}
