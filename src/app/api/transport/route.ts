import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth-helpers";
import type { ApiResponse } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "list";

    if (action === "stops") {
      const route_id = searchParams.get("route_id") || "";
      let query = supabase.from("transport_stops").select("*, route:transport_routes(id, name, code)");
      if (route_id) query = query.eq("route_id", route_id);
      const { data, error } = await query.order("sequence");
      if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, data, error: null });
    }

    if (action === "allocations") {
      const { data, error } = await supabase.from("transport_allocations").select(`
        *,
        student:students(id, roll_number, first_name, last_name, user:users(id, email)),
        route:transport_routes(id, name, code, vehicle_number, driver_name, driver_phone),
        stop:transport_stops(id, name, arrival_time, departure_time)
      `      ).eq("is_active", true).order("allocation_date", { ascending: false });
      if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 500 });
      (data || []).forEach((item: Record<string, unknown>) => {
        const student = item.student as Record<string, unknown> | null;
        if (student) {
          const su = student.user as Record<string, unknown> | null;
          if (su) su.full_name = `${student.first_name || ""} ${student.last_name || ""}`.trim() || (su.email as string)?.split("@")[0] || "";
        }
      });
      return NextResponse.json({ success: true, data, error: null });
    }

    if (action === "stats") {
      const [routesRes, allocsRes] = await Promise.all([
        supabase.from("transport_routes").select("id, capacity, monthly_fee").eq("is_active", true),
        supabase.from("transport_allocations").select("id, route_id").eq("is_active", true),
      ]);
      const routes = routesRes.data || [];
      const allocs = allocsRes.data || [];
      const totalCapacity = routes.reduce((sum: number, r) => sum + (r.capacity || 0), 0);
      const totalAllocated = allocs.length;
      return NextResponse.json({
        success: true,
        data: {
          total_routes: routes.length,
          total_capacity: totalCapacity,
          total_allocated: totalAllocated,
          available_seats: Math.max(0, totalCapacity - totalAllocated),
        },
        error: null,
      });
    }

    const page = parseInt(searchParams.get("page") || "1", 10);
    const per_page = parseInt(searchParams.get("per_page") || "10", 10);
    const search = searchParams.get("search") || "";

    let countQuery = supabase.from("transport_routes").select("*", { count: "exact", head: true }).eq("is_active", true);
    let dataQuery = supabase.from("transport_routes").select("*");

    if (search) {
      const f = `name.ilike.%${search}%,code.ilike.%${search}%,vehicle_number.ilike.%${search}%`;
      countQuery = countQuery.or(f);
      dataQuery = dataQuery.or(f);
    }

    const { count } = await countQuery;
    const from = (page - 1) * per_page;
    const to = from + per_page - 1;

    const { data, error } = await dataQuery.order("created_at", { ascending: false }).range(from, to);
    if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 500 });

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
    const { supabase } = auth;
    const body = await request.json();
    const { action } = body;

    if (action === "add_route") {
      const { name, code, vehicle_number, driver_name, driver_phone, capacity, monthly_fee, stops } = body;
      if (!name || !code) return NextResponse.json({ success: false, data: null, error: "Name and code are required" }, { status: 400 });

      const { data: route, error } = await supabase
        .from("transport_routes")
        .insert({ name, code, vehicle_number: vehicle_number || "", driver_name: driver_name || "", driver_phone: driver_phone || "", capacity: capacity || 40, monthly_fee: monthly_fee || 0, is_active: true })
        .select()
        .single();
      if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 400 });

      if (stops && Array.isArray(stops) && stops.length > 0) {
        const stopInserts = stops.map((s: { name: string; sequence: number; arrival_time: string; departure_time: string; landmark?: string }, idx: number) => ({
          route_id: route.id,
          name: s.name,
          sequence: s.sequence || idx + 1,
          arrival_time: s.arrival_time || "",
          departure_time: s.departure_time || "",
          landmark: s.landmark || null,
        }));
        await supabase.from("transport_stops").insert(stopInserts);
      }

      return NextResponse.json({ success: true, data: route, error: null, message: "Route added successfully" });
    }

    if (action === "update_route") {
      const { id, stops, ...updateData } = body;
      if (!id) return NextResponse.json({ success: false, data: null, error: "Route ID required" }, { status: 400 });
      const { error } = await supabase.from("transport_routes").update({ ...updateData, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 400 });

      if (stops && Array.isArray(stops)) {
        await supabase.from("transport_stops").delete().eq("route_id", id);
        if (stops.length > 0) {
          const stopInserts = stops.map((s: { name: string; sequence: number; arrival_time: string; departure_time: string; landmark?: string }, idx: number) => ({
            route_id: id, name: s.name, sequence: s.sequence || idx + 1, arrival_time: s.arrival_time || "", departure_time: s.departure_time || "", landmark: s.landmark || null,
          }));
          await supabase.from("transport_stops").insert(stopInserts);
        }
      }

      return NextResponse.json({ success: true, data: { id }, error: null, message: "Route updated" });
    }

    if (action === "delete_route") {
      const { id } = body;
      if (!id) return NextResponse.json({ success: false, data: null, error: "Route ID required" }, { status: 400 });
      const { error } = await supabase.from("transport_routes").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, data: { id }, error: null, message: "Route deleted" });
    }

    return NextResponse.json({ success: false, data: null, error: "Invalid action" }, { status: 400 });
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
    const { id, ...updateData } = body;
    if (!id) return NextResponse.json({ success: false, data: null, error: "ID required" }, { status: 400 });
    const { error } = await supabase.from("transport_routes").update({ ...updateData, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data: { id }, error: null, message: "Route updated" });
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
    const { error } = await supabase.from("transport_routes").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data: { id }, error: null, message: "Route deleted" });
  } catch (err) {
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}
