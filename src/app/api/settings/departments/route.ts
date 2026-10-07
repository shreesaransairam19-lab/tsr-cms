import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const { data, error } = await supabase.from("departments").select("*, hod:faculty(id, first_name, last_name, user:users(id, email))").order("name");
    if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 500 });
    (data || []).forEach((item: Record<string, unknown>) => {
      const fac = item.hod as Record<string, unknown> | null;
      if (fac) {
        const fu = fac.user as Record<string, unknown> | null;
        if (fu) fu.full_name = `${fac.first_name || ""} ${fac.last_name || ""}`.trim() || (fu.email as string)?.split("@")[0] || "";
      }
    });
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
      const { code, name, description } = body;
      if (!code || !name) return NextResponse.json({ success: false, data: null, error: "Code and name required" }, { status: 400 });
      const { data, error } = await supabase.from("departments").insert({ code, name, description: description || null, is_active: true }).select().single();
      if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, data, error: null, message: "Department created" });
    }

    if (action === "update") {
      const { id, code, name, description } = body;
      if (!id) return NextResponse.json({ success: false, data: null, error: "ID required" }, { status: 400 });
      const { error } = await supabase.from("departments").update({ code, name, description, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, data: { id }, error: null, message: "Department updated" });
    }

    if (action === "delete") {
      const { id } = body;
      if (!id) return NextResponse.json({ success: false, data: null, error: "ID required" }, { status: 400 });
      const { error } = await supabase.from("departments").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, data: { id }, error: null, message: "Department deleted" });
    }

    return NextResponse.json({ success: false, data: null, error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}
