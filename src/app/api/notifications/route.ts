import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth-helpers";
import type { ApiListResponse, Notification } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { supabase, user } = auth;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const per_page = parseInt(searchParams.get("per_page") || "20", 10);
    const type = searchParams.get("type") || "";
    const unread_only = searchParams.get("unread_only") === "true";

    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
    const role = profile?.role || "student";

    let countQuery = supabase.from("notifications").select("*", { count: "exact", head: true });
    let dataQuery = supabase.from("notifications").select("*");

    countQuery = countQuery.or(`target_role.eq.all,target_role.eq.${role},target_user_id.eq.${user.id}`);
    dataQuery = dataQuery.or(`target_role.eq.all,target_role.eq.${role},target_user_id.eq.${user.id}`);

    if (type) {
      countQuery = countQuery.eq("type", type);
      dataQuery = dataQuery.eq("type", type);
    }
    if (unread_only) {
      countQuery = countQuery.eq("is_read", false);
      dataQuery = dataQuery.eq("is_read", false);
    }

    const { count } = await countQuery;
    const from = (page - 1) * per_page;
    const to = from + per_page - 1;

    const { data, error } = await dataQuery.order("created_at", { ascending: false }).range(from, to);
    if (error) return NextResponse.json<ApiListResponse<Notification>>({ success: false, data: null, error: error.message }, { status: 500 });

    const total = count || 0;
    return NextResponse.json({
      success: true,
      data: { items: data || [], total, page, per_page, total_pages: Math.ceil(total / per_page), has_next: page * per_page < total, has_previous: page > 1 },
      error: null,
    });
  } catch (err) {
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const { supabase, user } = auth;
    const body = await request.json();
    const { action } = body;

    if (action === "mark_read") {
      const { id, ids } = body;
      if (ids && Array.isArray(ids)) {
        await supabase.from("notifications").update({ is_read: true }).in("id", ids);
      } else if (id) {
        await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      }
      return NextResponse.json({ success: true, data: null, error: null, message: "Marked as read" });
    }

    if (action === "mark_unread") {
      const { id } = body;
      if (id) await supabase.from("notifications").update({ is_read: false }).eq("id", id);
      return NextResponse.json({ success: true, data: null, error: null, message: "Marked as unread" });
    }

    if (action === "mark_all_read") {
      const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
      const role = profile?.role || "student";
      await supabase.from("notifications").update({ is_read: true }).or(`target_role.eq.all,target_role.eq.${role},target_user_id.eq.${user.id}`).eq("is_read", false);
      return NextResponse.json({ success: true, data: null, error: null, message: "All marked as read" });
    }

    if (action === "create") {
      const { title, message, type, target_role, target_user_id, target_department_id, link } = body;

      const { data, error } = await supabase
        .from("notifications")
        .insert({
          title, message, type: type || "info",
          target_role: target_role || "all",
          target_user_id: target_user_id || null,
          target_department_id: target_department_id || null,
          target_batch_year: null,
          is_read: false,
          link: link || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, data, error: null, message: "Notification created" });
    }

    return NextResponse.json({ success: false, data: null, error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}
