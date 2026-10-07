import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { supabase } = auth;

    const { data, error } = await supabase.from("college_settings").select("*").order("setting_key");
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
    const { settings } = body;

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json({ success: false, data: null, error: "Settings array required" }, { status: 400 });
    }

    for (const setting of settings) {
      await supabase.from("college_settings").upsert({
        setting_key: setting.key,
        setting_value: setting.value,
      }, { onConflict: "setting_key" });
    }

    return NextResponse.json({ success: true, data: null, error: null });
  } catch (err) {
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}
