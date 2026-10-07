import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth-helpers";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const body = await request.json();
    const { action, student_id, route_id, stop_id, allocation_id, academic_year_id } = body;

    if (action === "allocate") {
      if (!student_id || !route_id || !stop_id) {
        return NextResponse.json(
          { success: false, data: null, error: "Student, route, and stop are required" },
          { status: 400 }
        );
      }

      const { data: existing } = await supabase
        .from("transport_allocations")
        .select("id")
        .eq("student_id", student_id)
        .eq("is_active", true)
        .single();

      if (existing) {
        return NextResponse.json(
          { success: false, data: null, error: "Student already has an active transport allocation" },
          { status: 400 }
        );
      }

      const { data: route } = await supabase
        .from("transport_routes")
        .select("id, capacity")
        .eq("id", route_id)
        .single();

      if (!route) return NextResponse.json({ success: false, data: null, error: "Route not found" }, { status: 404 });

      const { count } = await supabase
        .from("transport_allocations")
        .select("id", { count: "exact", head: true })
        .eq("route_id", route_id)
        .eq("is_active", true);

      if ((count || 0) >= route.capacity) {
        return NextResponse.json({ success: false, data: null, error: "Route is at full capacity" }, { status: 400 });
      }

      const { data: allocation, error: allocError } = await supabase
        .from("transport_allocations")
        .insert({
          student_id, route_id, stop_id,
          academic_year_id: academic_year_id || null,
          allocation_date: new Date().toISOString().split("T")[0],
          is_active: true,
        })
        .select()
        .single();

      if (allocError) return NextResponse.json({ success: false, data: null, error: allocError.message }, { status: 400 });

      await supabase.from("students").update({ is_transport_user: true, updated_at: new Date().toISOString() }).eq("id", student_id);

      return NextResponse.json({ success: true, data: allocation, error: null, message: "Student allocated to route successfully" });
    }

    if (action === "deallocate") {
      if (!allocation_id) return NextResponse.json({ success: false, data: null, error: "Allocation ID required" }, { status: 400 });

      const { data: allocation } = await supabase
        .from("transport_allocations")
        .select("id, student_id")
        .eq("id", allocation_id)
        .eq("is_active", true)
        .single();

      if (!allocation) return NextResponse.json({ success: false, data: null, error: "Active allocation not found" }, { status: 404 });

      const { error } = await supabase
        .from("transport_allocations")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", allocation_id);

      if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 400 });

      const { data: otherAllocs } = await supabase
        .from("transport_allocations")
        .select("id")
        .eq("student_id", allocation.student_id)
        .eq("is_active", true);

      if (!otherAllocs || otherAllocs.length === 0) {
        await supabase.from("students").update({ is_transport_user: false, updated_at: new Date().toISOString() }).eq("id", allocation.student_id);
      }

      return NextResponse.json({ success: true, data: { id: allocation_id }, error: null, message: "Deallocation successful" });
    }

    return NextResponse.json({ success: false, data: null, error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const { searchParams } = new URL(request.url);
    const student_id = searchParams.get("student_id") || "";

    let query = supabase.from("transport_allocations").select(`
      *,
      student:students(id, roll_number, first_name, last_name, user:users(id, email)),
      route:transport_routes(id, name, code, vehicle_number, driver_name, driver_phone, monthly_fee),
      stop:transport_stops(id, name, arrival_time, departure_time)
    `);

    if (student_id) query = query.eq("student_id", student_id).eq("is_active", true);
    else query = query.eq("is_active", true);

    const { data, error } = await query.order("allocation_date", { ascending: false });
    if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 500 });
    (data || []).forEach((item: Record<string, unknown>) => {
      const student = item.student as Record<string, unknown> | null;
      if (student) {
        const su = student.user as Record<string, unknown> | null;
        if (su) su.full_name = `${student.first_name || ""} ${student.last_name || ""}`.trim() || (su.email as string)?.split("@")[0] || "";
      }
    });
    return NextResponse.json({ success: true, data, error: null });
  } catch (err) {
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}
