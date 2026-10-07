import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth-helpers";
import type { ApiSingleResponse, Student } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { supabase, user } = auth;
    const { id } = await params;

    const { data: student, error } = await supabase
      .from("students")
      .select(`
        *,
        user:users(id, email, phone, is_active),
        department:departments(id, name, code),
        program:programs(id, name, code, total_semesters, duration_years)
      `)
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json<ApiSingleResponse<Student>>({
        success: false,
        data: null,
        error: "Student not found",
      }, { status: 404 });
    }

    const firstName = (student as Record<string, unknown>).first_name as string || "";
    const lastName = (student as Record<string, unknown>).last_name as string || "";
    const fullName = `${firstName} ${lastName}`.trim();
    const userObj = (student as Record<string, unknown>).user as Record<string, unknown> | null;
    if (userObj) {
      userObj.full_name = fullName || (userObj.email as string)?.split("@")[0] || "";
      userObj.avatar_url = null;
    } else {
      (student as Record<string, unknown>).user = { id: (student as Record<string, unknown>).user_id, full_name: fullName, email: "", phone: null, avatar_url: null, is_active: true };
    }
    (student as Record<string, unknown>).semester = (student as Record<string, unknown>).current_semester;
    (student as Record<string, unknown>).is_active = (student as Record<string, unknown>).status === "active";
    (student as Record<string, unknown>).is_hosteler = (student as Record<string, unknown>).is_hosteler || false;
    (student as Record<string, unknown>).is_transport_user = (student as Record<string, unknown>).is_transport_user || false;
    (student as Record<string, unknown>).aadhar_number = (student as Record<string, unknown>).aadhar_number || null;
    (student as Record<string, unknown>).category = (student as Record<string, unknown>).category || null;

    const { data: attendance } = await supabase
      .from("attendance_records")
      .select(`
        id,
        status,
        attendance_class:attendance_classes(
          id,
          date,
          subject:subjects(id, name, code, credits)
        )
      `)
      .eq("student_id", id)
      .order("created_at", { ascending: false });

    const { data: results } = await supabase
      .from("semester_results")
      .select(`
        *,
        semester:semesters(id, number, academic_year:academic_years(id, name))
      `)
      .eq("student_id", id)
      .order("created_at", { ascending: false });

    const { data: feePayments } = await supabase
      .from("fee_payments")
      .select(`
        *,
        fee_structure:fee_structures(id, fee_type, amount, semester_number)
      `)
      .eq("student_id", id)
      .order("payment_date", { ascending: false });

    const { data: documents } = await supabase
      .from("documents")
      .select("*")
      .eq("student_id", id)
      .order("created_at", { ascending: false });

    const enrichedStudent = {
      ...student,
      attendance_data: attendance || [],
      results_data: results || [],
      fee_payments: feePayments || [],
      documents_data: documents || [],
    };

    return NextResponse.json<ApiSingleResponse<typeof enrichedStudent>>({
      success: true,
      data: enrichedStudent,
      error: null,
    });
  } catch (err) {
    return NextResponse.json<ApiSingleResponse<Student>>({
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Internal server error",
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const { supabase, user } = auth;
    const { id } = await params;
    const body = await request.json();
    const { user_id, ...updateData } = body;

    const cleanUpdate: Record<string, unknown> = {};
    const allowedFields = [
      "department_id", "program_id", "semester", "batch_year",
      "date_of_birth", "gender", "blood_group", "address", "city",
      "state", "pincode", "father_name", "father_phone", "mother_name",
      "mother_phone", "guardian_phone", "aadhar_number", "entrance_exam_score",
      "category", "is_hosteler", "is_transport_user", "is_active",
      "nationality", "religion", "community", "photo_url", "father_occupation",
    ];

    for (const field of allowedFields) {
      if (field in updateData) {
        cleanUpdate[field] = updateData[field];
      }
    }

    if (Object.keys(cleanUpdate).length === 0 && !updateData.first_name && !updateData.last_name && !updateData.phone && !updateData.email) {
      return NextResponse.json({
        success: false,
        data: null,
        error: "No fields to update",
      }, { status: 400 });
    }

    if (Object.keys(cleanUpdate).length > 0) {
      cleanUpdate.updated_at = new Date().toISOString();
      const { error } = await supabase
        .from("students")
        .update(cleanUpdate)
        .eq("id", id);

      if (error) {
        return NextResponse.json({
          success: false,
          data: null,
          error: error.message,
        }, { status: 400 });
      }
    }

    if (user_id && (updateData.first_name || updateData.last_name || updateData.phone || updateData.email)) {
      const userUpdate: Record<string, unknown> = {};
      if (updateData.first_name || updateData.last_name) {
        const { data: current } = await supabase
          .from("users")
          .select("full_name")
          .eq("id", user_id)
          .single();
        const parts = (current?.full_name || "").split(" ");
        const firstName = updateData.first_name || parts[0] || "";
        const lastName = updateData.last_name || parts.slice(1).join(" ") || "";
        userUpdate.full_name = `${firstName} ${lastName}`;
      }
      if (updateData.phone) userUpdate.phone = updateData.phone;
      if (updateData.email) userUpdate.email = updateData.email;

      if (Object.keys(userUpdate).length > 0) {
        await supabase.from("users").update(userUpdate).eq("id", user_id);
      }
    }

    return NextResponse.json({
      success: true,
      data: { id },
      error: null,
      message: "Student updated successfully",
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Internal server error",
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const { supabase, user } = auth;
    const { id } = await params;

    const { error } = await supabase
      .from("students")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return NextResponse.json({
        success: false,
        data: null,
        error: error.message,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: { id },
      error: null,
      message: "Student deactivated successfully",
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Internal server error",
    }, { status: 500 });
  }
}
