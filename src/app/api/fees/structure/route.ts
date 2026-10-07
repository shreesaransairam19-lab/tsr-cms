import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth-helpers";
import type { ApiListResponse, FeeStructure } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const { searchParams } = new URL(request.url);

    const program_id = searchParams.get("program_id") || "";
    const semester_number = searchParams.get("semester") || "";
    const fee_type = searchParams.get("fee_type") || "";
    const academic_year_id = searchParams.get("academic_year_id") || "";

    let query = supabase
      .from("fee_structures")
      .select(`
        *,
        program:programs(id, name, code, department:departments(name)),
        academic_year:academic_years(id, name)
      `);

    if (program_id) query = query.eq("program_id", program_id);
    if (semester_number) query = query.eq("semester_number", parseInt(semester_number, 10));
    if (fee_type) query = query.eq("fee_type", fee_type);
    if (academic_year_id) query = query.eq("academic_year_id", academic_year_id);

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json<ApiListResponse<FeeStructure>>({
        success: false, data: null, error: error.message,
      }, { status: 500 });
    }

    return NextResponse.json<ApiListResponse<FeeStructure>>({
      success: true,
      data: {
        items: data as unknown as FeeStructure[],
        total: data?.length || 0,
        page: 1,
        per_page: data?.length || 0,
        total_pages: 1,
        has_next: false,
        has_previous: false,
      },
      error: null,
    });
  } catch (err) {
    return NextResponse.json({
      success: false, data: null,
      error: err instanceof Error ? err.message : "Internal server error",
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const body = await request.json();

    const {
      program_id,
      academic_year_id,
      semester_number,
      fee_type,
      amount,
      due_date,
      late_fee_per_day,
      is_mandatory,
      description,
    } = body;

    if (!program_id || !academic_year_id || !semester_number || !fee_type || !amount || !due_date) {
      return NextResponse.json({
        success: false, data: null,
        error: "program_id, academic_year_id, semester_number, fee_type, amount, and due_date are required",
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("fee_structures")
      .insert({
        program_id,
        academic_year_id,
        semester_number,
        fee_type,
        amount,
        due_date,
        late_fee_per_day: late_fee_per_day || 0,
        is_mandatory: is_mandatory ?? true,
        description: description || null,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ success: false, data: null, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true, data: { id: data.id }, error: null,
      message: "Fee structure created successfully",
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({
      success: false, data: null,
      error: err instanceof Error ? err.message : "Internal server error",
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const body = await request.json();

    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({
        success: false, data: null, error: "Fee structure ID is required",
      }, { status: 400 });
    }

    const cleanUpdate: Record<string, unknown> = {};
    const allowedFields = [
      "program_id", "academic_year_id", "semester_number", "fee_type",
      "amount", "due_date", "late_fee_per_day", "is_mandatory", "description",
    ];

    for (const field of allowedFields) {
      if (field in updateData) {
        cleanUpdate[field] = updateData[field];
      }
    }

    if (Object.keys(cleanUpdate).length === 0) {
      return NextResponse.json({
        success: false, data: null, error: "No fields to update",
      }, { status: 400 });
    }

    cleanUpdate.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from("fee_structures")
      .update(cleanUpdate)
      .eq("id", id);

    if (error) {
      return NextResponse.json({ success: false, data: null, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true, data: { id }, error: null, message: "Fee structure updated",
    });
  } catch (err) {
    return NextResponse.json({
      success: false, data: null,
      error: err instanceof Error ? err.message : "Internal server error",
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({
        success: false, data: null, error: "Fee structure ID is required",
      }, { status: 400 });
    }

    const { error } = await supabase.from("fee_structures").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ success: false, data: null, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true, data: { id }, error: null, message: "Fee structure deleted",
    });
  } catch (err) {
    return NextResponse.json({
      success: false, data: null,
      error: err instanceof Error ? err.message : "Internal server error",
    }, { status: 500 });
  }
}
