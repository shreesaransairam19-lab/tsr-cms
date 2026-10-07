import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth-helpers";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const body = await request.json();
    const { action, student_id, room_id, allocation_id, academic_year_id } = body;

    if (action === "allocate") {
      if (!student_id || !room_id) {
        return NextResponse.json(
          { success: false, data: null, error: "Student ID and Room ID are required" },
          { status: 400 }
        );
      }

      const { data: existing } = await supabase
        .from("hostel_allocations")
        .select("id")
        .eq("student_id", student_id)
        .eq("is_active", true)
        .single();

      if (existing) {
        return NextResponse.json(
          { success: false, data: null, error: "Student already has an active hostel allocation" },
          { status: 400 }
        );
      }

      const { data: room } = await supabase
        .from("hostel_rooms")
        .select("id, capacity, occupied")
        .eq("id", room_id)
        .single();

      if (!room) {
        return NextResponse.json(
          { success: false, data: null, error: "Room not found" },
          { status: 404 }
        );
      }

      if (room.occupied >= room.capacity) {
        return NextResponse.json(
          { success: false, data: null, error: "Room is fully occupied" },
          { status: 400 }
        );
      }

      const { data: allocation, error: allocError } = await supabase
        .from("hostel_allocations")
        .insert({
          student_id,
          room_id,
          academic_year_id: academic_year_id || null,
          allocation_date: new Date().toISOString().split("T")[0],
          security_deposit: 0,
          is_active: true,
        })
        .select()
        .single();

      if (allocError) {
        return NextResponse.json(
          { success: false, data: null, error: allocError.message },
          { status: 400 }
        );
      }

      await supabase
        .from("hostel_rooms")
        .update({ occupied: room.occupied + 1, updated_at: new Date().toISOString() })
        .eq("id", room_id);

      await supabase
        .from("students")
        .update({ is_hosteler: true, updated_at: new Date().toISOString() })
        .eq("id", student_id);

      return NextResponse.json({
        success: true,
        data: allocation,
        error: null,
        message: "Student allocated to room successfully",
      });
    }

    if (action === "deallocate") {
      if (!allocation_id) {
        return NextResponse.json(
          { success: false, data: null, error: "Allocation ID is required" },
          { status: 400 }
        );
      }

      const { data: allocation } = await supabase
        .from("hostel_allocations")
        .select("id, student_id, room_id")
        .eq("id", allocation_id)
        .eq("is_active", true)
        .single();

      if (!allocation) {
        return NextResponse.json(
          { success: false, data: null, error: "Active allocation not found" },
          { status: 404 }
        );
      }

      const { error } = await supabase
        .from("hostel_allocations")
        .update({
          is_active: false,
          checkout_date: new Date().toISOString().split("T")[0],
          updated_at: new Date().toISOString(),
        })
        .eq("id", allocation_id);

      if (error) {
        return NextResponse.json(
          { success: false, data: null, error: error.message },
          { status: 400 }
        );
      }

      const { data: room } = await supabase
        .from("hostel_rooms")
        .select("occupied")
        .eq("id", allocation.room_id)
        .single();

      if (room && room.occupied > 0) {
        await supabase
          .from("hostel_rooms")
          .update({ occupied: room.occupied - 1, updated_at: new Date().toISOString() })
          .eq("id", allocation.room_id);
      }

      const { data: otherAllocations } = await supabase
        .from("hostel_allocations")
        .select("id")
        .eq("student_id", allocation.student_id)
        .eq("is_active", true);

      if (!otherAllocations || otherAllocations.length === 0) {
        await supabase
          .from("students")
          .update({ is_hosteler: false, updated_at: new Date().toISOString() })
          .eq("id", allocation.student_id);
      }

      return NextResponse.json({
        success: true,
        data: { id: allocation_id },
        error: null,
        message: "Student deallocated successfully",
      });
    }

    return NextResponse.json(
      { success: false, data: null, error: "Invalid action. Use 'allocate' or 'deallocate'" },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const { searchParams } = new URL(request.url);
    const student_id = searchParams.get("student_id") || "";

    let query = supabase.from("hostel_allocations").select(`
      *,
      student:students(id, roll_number, first_name, last_name, user:users(id, email)),
      room:hostel_rooms(id, room_number, floor, capacity, room_type, has_ac, monthly_rent, block:hostel_blocks(id, name, type))
    `);

    if (student_id) {
      query = query.eq("student_id", student_id).eq("is_active", true);
    } else {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query.order("allocation_date", { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, data: null, error: error.message },
        { status: 500 }
      );
    }

    (data || []).forEach((item: Record<string, unknown>) => {
      const student = item.student as Record<string, unknown> | null;
      if (student) {
        const su = student.user as Record<string, unknown> | null;
        if (su) su.full_name = `${student.first_name || ""} ${student.last_name || ""}`.trim() || (su.email as string)?.split("@")[0] || "";
      }
    });

    return NextResponse.json({ success: true, data, error: null });
  } catch (err) {
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
