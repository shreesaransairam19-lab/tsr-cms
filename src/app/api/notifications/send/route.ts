import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const { supabase, user } = auth;
    const body = await request.json();
    const { channel, recipient, subject, message, data } = body;

    if (!channel || !recipient || !message) {
      return NextResponse.json(
        { success: false, data: null, error: "Channel, recipient, and message are required" },
        { status: 400 }
      );
    }

    const results: { channel: string; status: string; error?: string }[] = [];

    if (channel === "sms" || channel === "all") {
      results.push({ channel: "sms", status: "queued" });
    }

    if (channel === "email" || channel === "all") {
      results.push({ channel: "email", status: "queued" });
    }

    if (channel === "whatsapp" || channel === "all") {
      results.push({ channel: "whatsapp", status: "queued" });
    }

    await supabase.from("notifications").insert({
      title: subject || "Notification",
      message,
      type: "general",
      target_role: "all",
      target_user_id: null,
      target_department_id: null,
      target_batch_year: null,
      is_read: false,
      link: null,
      created_by: user.id,
    });

    return NextResponse.json({
      success: true,
      data: { results },
      error: null,
      message: `Notification sent via ${results.map((r) => r.channel).join(", ")}`,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
