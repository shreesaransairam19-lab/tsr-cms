import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "overview";
    const date_from = searchParams.get("date_from") || "";
    const date_to = searchParams.get("date_to") || "";

    if (type === "overview") {
      const [students, faculty, revenue, attendance] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("faculty").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("fee_payments").select("amount_paid").eq("status", "paid"),
        supabase.from("attendance_records").select("status"),
      ]);

      const totalRevenue = (revenue.data || []).reduce((sum, p) => sum + ((p as Record<string, unknown>).amount_paid as number || 0), 0);
      const attendanceRecords = attendance.data || [];
      const present = attendanceRecords.filter((r) => (r as Record<string, unknown>).status === "present").length;

      return NextResponse.json({
        success: true,
        data: {
          students: students.count || 0,
          faculty: faculty.count || 0,
          total_revenue: totalRevenue,
          attendance_rate: attendanceRecords.length > 0 ? Math.round((present / attendanceRecords.length) * 100) : 0,
        },
        error: null,
      });
    }

    return NextResponse.json({ success: true, data: {}, error: null });
  } catch (err) {
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
