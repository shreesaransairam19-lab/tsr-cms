import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { user } = auth;

    const serviceClient = await getSupabaseServiceClient();
    const { searchParams } = new URL(request.url);

    const facultyUserIdParam = searchParams.get("faculty_user_id") || "";
    const dayOfWeekParam = searchParams.get("day_of_week");
    const semesterParam = searchParams.get("semester");

    let query = serviceClient.from("timetables").select("*").eq("is_active", true);

    if (user?.role === "faculty") {
      query = query.eq("faculty_user_id", user.id);
    } else if (facultyUserIdParam) {
      query = query.eq("faculty_user_id", facultyUserIdParam);
    }

    if (dayOfWeekParam !== null && dayOfWeekParam !== "") {
      const dayOfWeek = parseInt(dayOfWeekParam, 10);
      if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
        return NextResponse.json({
          success: false,
          data: null,
          error: "Invalid day_of_week. Must be an integer between 0 (Sunday) and 6 (Saturday).",
        }, { status: 400 });
      }
      query = query.eq("day_of_week", dayOfWeek);
    }

    if (semesterParam !== null && semesterParam !== "") {
      const semester = parseInt(semesterParam, 10);
      if (isNaN(semester) || semester < 1 || semester > 12) {
        return NextResponse.json({
          success: false,
          data: null,
          error: "Invalid semester. Must be an integer between 1 and 12.",
        }, { status: 400 });
      }
      query = query.eq("semester", semester);
    }

    const { data, error } = await query
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      return NextResponse.json({
        success: false,
        data: null,
        error: error.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        items: data ?? [],
        total: data?.length ?? 0,
      },
      error: null,
    });
  } catch (err) {
    console.error("Timetable API error:", err);
    return NextResponse.json({
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Internal server error",
    }, { status: 500 });
  }
}
