import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get("program_id");
    const semester = searchParams.get("semester");
    const search = searchParams.get("search");

    let query = supabase.from("subjects").select("*, program:programs(id, name, code)").order("semester").order("name");

    if (programId) query = query.eq("program_id", programId);
    if (semester) query = query.eq("semester", Number(semester));
    if (search) query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);

    const { data, error } = await query;
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

    const { program_id, semester, code, name } = body;
    if (!program_id || !semester || !code || !name)
      return NextResponse.json({ success: false, data: null, error: "Program ID, semester, code and name required" }, { status: 400 });

    const { data, error } = await supabase
      .from("subjects")
      .insert({
        program_id,
        semester,
        code,
        name,
        type: body.type || null,
        credits: body.credits ?? null,
        lecture_hours: body.lecture_hours ?? null,
        tutorial_hours: body.tutorial_hours ?? null,
        practical_hours: body.practical_hours ?? null,
        is_elective: body.is_elective || false,
        is_active: true,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data, error: null, message: "Subject created" });
  } catch (err) {
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const body = await request.json();

    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ success: false, data: null, error: "ID required" }, { status: 400 });

    const updates: Record<string, unknown> = {};
    for (const key of [
      "program_id",
      "semester",
      "code",
      "name",
      "type",
      "credits",
      "lecture_hours",
      "tutorial_hours",
      "practical_hours",
      "is_elective",
      "is_active",
    ]) {
      if (key in fields) updates[key] = fields[key];
    }

    if (Object.keys(updates).length === 0)
      return NextResponse.json({ success: false, data: null, error: "No fields to update" }, { status: 400 });

    const { error } = await supabase.from("subjects").update(updates).eq("id", id);
    if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data: { id }, error: null, message: "Subject updated" });
  } catch (err) {
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, data: null, error: "ID required" }, { status: 400 });

    const { error } = await supabase.from("subjects").delete().eq("id", id);
    if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data: { id }, error: null, message: "Subject deleted" });
  } catch (err) {
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}
