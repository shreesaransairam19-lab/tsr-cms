import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";
import { parseSheetUrl, readPublicSheet, rowsToObjects } from "@/lib/services/google-sheets";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const body = await request.json();
    const { sheet_url, data_type, field_mapping } = body;

    if (!sheet_url || !data_type) {
      return NextResponse.json({ success: false, data: null, error: "Sheet URL and data type required" }, { status: 400 });
    }

    const spreadsheetId = parseSheetUrl(sheet_url);
    if (!spreadsheetId) {
      return NextResponse.json({ success: false, data: null, error: "Invalid Google Sheets URL" }, { status: 400 });
    }

    const sheetData = await readPublicSheet({ spreadsheetId });

    if (sheetData.rows.length === 0) {
      return NextResponse.json({ success: false, data: null, error: "No data found in the sheet" }, { status: 400 });
    }

    const objects = rowsToObjects(sheetData.headers, sheetData.rows);
    const mapping = field_mapping || {};
    let imported = 0;
    let failed = 0;
    const errors: string[] = [];

    if (data_type === "students") {
      for (const row of objects) {
        try {
          const studentData: Record<string, unknown> = {};
          for (const [sheetField, dbField] of Object.entries(mapping)) {
            const normalizedField = sheetField.toLowerCase().replace(/\s+/g, "_");
            studentData[dbField as string] = row[normalizedField] || "";
          }

          const { error } = await supabase.from("students").upsert({
            roll_number: studentData.roll_number as string || row.roll_number || "",
            user: { full_name: studentData.full_name as string || row.full_name || "", email: studentData.email as string || row.email || "" },
            semester: parseInt(studentData.semester as string || row.semester || "1"),
            batch_year: parseInt(studentData.batch_year as string || row.batch_year || new Date().getFullYear().toString()),
            gender: studentData.gender as string || row.gender || "male",
          }, { onConflict: "roll_number" });

          if (error) {
            failed++;
            errors.push(error.message);
          } else {
            imported++;
          }
        } catch {
          failed++;
        }
      }
    } else if (data_type === "faculty") {
      for (const row of objects) {
        try {
          const { error } = await supabase.from("faculty").upsert({
            employee_id: row.employee_id || "",
            user: { full_name: row.full_name || "", email: row.email || "" },
            designation: row.designation || "Assistant Professor",
          }, { onConflict: "employee_id" });

          if (error) { failed++; errors.push(error.message); }
          else { imported++; }
        } catch { failed++; }
      }
    }

    return NextResponse.json({
      success: true,
      data: { imported, failed, total: sheetData.rows.length, errors: errors.slice(0, 10) },
      error: null,
      message: `Imported ${imported} records, ${failed} failed`,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
