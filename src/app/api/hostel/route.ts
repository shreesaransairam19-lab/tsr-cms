import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth-helpers";
import type { ApiResponse, ApiListResponse, HostelBlock, HostelRoom, HostelAllocation } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "";
    const block_id = searchParams.get("block_id") || "";
    const action = searchParams.get("action") || "list";

    if (action === "stats") {
      const [blocksResult, roomsResult, allocationsResult] = await Promise.all([
        supabase.from("hostel_blocks").select("*").eq("is_active", true),
        supabase.from("hostel_rooms").select("id, capacity, occupied, block_id, is_active").eq("is_active", true),
        supabase.from("hostel_allocations").select("id, student_id, room_id, is_active").eq("is_active", true),
      ]);

      const blocks = (blocksResult.data || []) as HostelBlock[];
      const rooms = roomsResult.data || [];
      const allocations = allocationsResult.data || [];

      const totalRooms = rooms.length;
      const totalCapacity = rooms.reduce((sum: number, r: Record<string, unknown>) => sum + (r.capacity as number), 0);
      const totalOccupied = rooms.reduce((sum: number, r: Record<string, unknown>) => sum + (r.occupied as number), 0);

      return NextResponse.json({
        success: true,
        data: {
          blocks,
          total_rooms: totalRooms,
          total_capacity: totalCapacity,
          total_occupied: totalOccupied,
          total_allocations: allocations.length,
          occupancy_rate: totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0,
        },
        error: null,
      });
    }

    if (action === "rooms") {
      let query = supabase
        .from("hostel_rooms")
        .select("*, block:hostel_blocks(id, name, type)")
        .eq("is_active", true);

      if (block_id) query = query.eq("block_id", block_id);

      const { data, error } = await query.order("room_number");
      if (error) {
        return NextResponse.json({ success: false, data: null, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, data, error: null });
    }

    if (action === "allocations") {
      let query = supabase.from("hostel_allocations").select(`
        *,
        student:students(id, roll_number, first_name, last_name, user:users(id, email)),
        room:hostel_rooms(id, room_number, block:hostel_blocks(id, name, type))
      `).eq("is_active", true);

      const { data, error } = await query.order("allocation_date", { ascending: false });
      if (error) {
        return NextResponse.json({ success: false, data: null, error: error.message }, { status: 500 });
      }
      (data || []).forEach((item: Record<string, unknown>) => {
        const student = item.student as Record<string, unknown> | null;
        if (student) {
          const su = student.user as Record<string, unknown> | null;
          if (su) su.full_name = `${student.first_name || ""} ${student.last_name || ""}`.trim() || (su.email as string)?.split("@")[0] || "";
        }
      });
      return NextResponse.json({ success: true, data, error: null });
    }

    let query = supabase.from("hostel_blocks").select("*").eq("is_active", true);
    if (type) query = query.eq("type", type);

    const { data, error } = await query.order("name");
    if (error) {
      return NextResponse.json<ApiListResponse<HostelBlock>>(
        { success: false, data: null, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data, error: null });
  } catch (err) {
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const body = await request.json();
    const { action } = body;

    if (action === "add_block") {
      const { name, type, total_rooms, warden_name, warden_phone, description } = body;
      if (!name || !type) {
        return NextResponse.json({ success: false, data: null, error: "Name and type are required" }, { status: 400 });
      }
      const { data, error } = await supabase
        .from("hostel_blocks")
        .insert({ name, type, total_rooms: total_rooms || 0, warden_name: warden_name || null, warden_phone: warden_phone || null, description: description || null, is_active: true })
        .select()
        .single();
      if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, data, error: null, message: "Block added successfully" });
    }

    if (action === "add_room") {
      const { block_id, room_number, floor, capacity, room_type, has_ac, monthly_rent } = body;
      if (!block_id || !room_number) {
        return NextResponse.json({ success: false, data: null, error: "Block and room number are required" }, { status: 400 });
      }
      const { data, error } = await supabase
        .from("hostel_rooms")
        .insert({
          block_id, room_number, floor: floor || 0, capacity: capacity || 2,
          occupied: 0, room_type: room_type || "double", has_ac: has_ac || false,
          monthly_rent: monthly_rent || 0, is_active: true,
        })
        .select()
        .single();
      if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, data, error: null, message: "Room added successfully" });
    }

    if (action === "update_room") {
      const { id, ...updateData } = body;
      if (!id) return NextResponse.json({ success: false, data: null, error: "Room ID required" }, { status: 400 });
      const { error } = await supabase.from("hostel_rooms").update({ ...updateData, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, data: { id }, error: null, message: "Room updated" });
    }

    if (action === "delete_room") {
      const { id } = body;
      if (!id) return NextResponse.json({ success: false, data: null, error: "Room ID required" }, { status: 400 });
      const { error } = await supabase.from("hostel_rooms").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, data: { id }, error: null, message: "Room removed" });
    }

    return NextResponse.json({ success: false, data: null, error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
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

    const { error } = await supabase.from("hostel_blocks").update({ ...updateData, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data: { id }, error: null, message: "Block updated" });
  } catch (err) {
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
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

    const { error } = await supabase.from("hostel_blocks").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data: { id }, error: null, message: "Block deleted" });
  } catch (err) {
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
