import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth-helpers";
import type { ApiListResponse, Document } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const per_page = parseInt(searchParams.get("per_page") || "10", 10);
    const type = searchParams.get("type") || "";
    const student_id = searchParams.get("student_id") || "";
    const search = searchParams.get("search") || "";

    let countQuery = supabase.from("documents").select("*", { count: "exact", head: true });
    let dataQuery = supabase.from("documents").select(`
      *,
      student:students(id, roll_number, first_name, last_name, user:users(id, email)),
      faculty:faculty(id, employee_id, first_name, last_name, user:users(id, email))
    `);

    if (type) {
      countQuery = countQuery.eq("type", type);
      dataQuery = dataQuery.eq("type", type);
    }
    if (student_id) {
      countQuery = countQuery.eq("student_id", student_id);
      dataQuery = dataQuery.eq("student_id", student_id);
    }
    if (search) {
      const f = `title.ilike.%${search}%,description.ilike.%${search}%`;
      countQuery = countQuery.or(f);
      dataQuery = dataQuery.or(f);
    }

    const { count } = await countQuery;
    const from = (page - 1) * per_page;
    const to = from + per_page - 1;

    const { data, error } = await dataQuery.order("created_at", { ascending: false }).range(from, to);
    if (error) return NextResponse.json<ApiListResponse<Document>>({ success: false, data: null, error: error.message }, { status: 500 });

    (data || []).forEach((item: Record<string, unknown>) => {
      const student = item.student as Record<string, unknown> | null;
      if (student) {
        const su = student.user as Record<string, unknown> | null;
        if (su) su.full_name = `${student.first_name || ""} ${student.last_name || ""}`.trim() || (su.email as string)?.split("@")[0] || "";
      }
      const fac = item.faculty as Record<string, unknown> | null;
      if (fac) {
        const fu = fac.user as Record<string, unknown> | null;
        if (fu) fu.full_name = `${fac.first_name || ""} ${fac.last_name || ""}`.trim() || (fu.email as string)?.split("@")[0] || "";
      }
    });

    const total = count || 0;
    return NextResponse.json({
      success: true,
      data: { items: (data || []) as Document[], total, page, per_page, total_pages: Math.ceil(total / per_page), has_next: page * per_page < total, has_previous: page > 1 },
      error: null,
    });
  } catch (err) {
    return NextResponse.json<ApiListResponse<Document>>({ success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const { supabase, user } = auth;
    const body = await request.json();
    const { action } = body;

    if (action === "delete") {
      const { id } = body;
      if (!id) return NextResponse.json({ success: false, data: null, error: "ID required" }, { status: 400 });
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, data: { id }, error: null, message: "Document deleted" });
    }

    if (action === "verify") {
      const { id } = body;
      if (!id) return NextResponse.json({ success: false, data: null, error: "ID required" }, { status: 400 });
      const { error } = await supabase.from("documents").update({
        is_verified: true, verified_by: user?.id || "", verified_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, data: { id }, error: null, message: "Document verified" });
    }

    return NextResponse.json({ success: false, data: null, error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, data: null, error: "ID required" }, { status: 400 });
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data: { id }, error: null, message: "Document deleted" });
  } catch (err) {
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}
