import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const body = await request.json();
    const { data_type, sheet_url, fields } = body;

    if (!data_type) {
      return NextResponse.json({ success: false, data: null, error: "Data type required" }, { status: 400 });
    }

    let data: Record<string, unknown>[] = [];

    if (data_type === "students") {
      const { data: students } = await supabase.from("students").select(`
        roll_number, semester, batch_year, gender, first_name, last_name,
        user:users(id, email, phone),
        department:departments(name, code),
        program:programs(name, code)
      `).eq("is_active", true);

      data = (students || []).map((s) => {
        const std = s as Record<string, unknown>;
        const user = std.user as { email: string; phone: string } | null;
        const dept = std.department as { name: string; code: string } | null;
        const prog = std.program as { name: string; code: string } | null;
        return {
          roll_number: std.roll_number,
          full_name: `${std.first_name || ""} ${std.last_name || ""}`.trim() || (user?.email as string)?.split("@")[0] || "",
          email: user?.email || "",
          phone: user?.phone || "",
          department: dept?.name || "",
          program: prog?.name || "",
          semester: std.semester,
          batch_year: std.batch_year,
          gender: std.gender,
        };
      });
    } else if (data_type === "faculty") {
      const { data: faculty } = await supabase.from("faculty").select(`
        employee_id, designation, basic_salary, first_name, last_name,
        user:users(id, email, phone),
        department:departments(name, code)
      `).eq("is_active", true);

      data = (faculty || []).map((f) => {
        const fac = f as Record<string, unknown>;
        const user = fac.user as { email: string; phone: string } | null;
        const dept = fac.department as { name: string; code: string } | null;
        return {
          employee_id: fac.employee_id,
          full_name: `${fac.first_name || ""} ${fac.last_name || ""}`.trim() || (user?.email as string)?.split("@")[0] || "",
          email: user?.email || "",
          phone: user?.phone || "",
          department: dept?.name || "",
          designation: fac.designation,
          basic_salary: fac.basic_salary,
        };
      });
    }

    if (data.length === 0) {
      return NextResponse.json({ success: false, data: null, error: "No data to export" }, { status: 400 });
    }

    // Return data as CSV content for download
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map((row) => headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(",")),
    ];

    return NextResponse.json({
      success: true,
      data: {
        csv: csvRows.join("\n"),
        count: data.length,
        headers,
      },
      error: null,
      message: `Exported ${data.length} records`,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
