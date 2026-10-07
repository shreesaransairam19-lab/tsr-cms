import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const { data, error } = await supabase.from("programs").select("*, department:departments(id, name, code)").order("name");
    if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, data, error: null });
  } catch (err) {
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const body = await request.json();
    const { action } = body;

    if (action === "create") {
      const { department_id, name, code, type, duration_years, total_semesters, total_credits } = body;
      if (!department_id || !name || !code) return NextResponse.json({ success: false, data: null, error: "Department, name, and code required" }, { status: 400 });
      const { data, error } = await supabase.from("programs").insert({
        department_id, name, code, type: type || "undergraduate",
        duration_years: duration_years || 4, total_semesters: total_semesters || 8,
        total_credits: total_credits || 160, is_active: true,
      }).select().single();
      if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, data, error: null, message: "Program created" });
    }

    if (action === "update") {
      const { id, ...updateData } = body;
      if (!id) return NextResponse.json({ success: false, data: null, error: "ID required" }, { status: 400 });
      const { error } = await supabase.from("programs").update({ ...updateData, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, data: { id }, error: null, message: "Program updated" });
    }

    if (action === "delete") {
      const { id } = body;
      if (!id) return NextResponse.json({ success: false, data: null, error: "ID required" }, { status: 400 });
      const { error } = await supabase.from("programs").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, data: { id }, error: null, message: "Program deleted" });
    }

    return NextResponse.json({ success: false, data: null, error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}
