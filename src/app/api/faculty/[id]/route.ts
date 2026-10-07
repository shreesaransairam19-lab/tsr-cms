import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth-helpers";
import type { ApiSingleResponse, Faculty } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { supabase, user } = auth;
    const { id } = await params;

    const { data: faculty, error } = await supabase
      .from("faculty")
      .select(`
        *,
        user:users(id, email, phone, is_active),
        department:departments(id, name, code)
      `)
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json<ApiSingleResponse<Faculty>>({
        success: false,
        data: null,
        error: "Faculty not found",
      }, { status: 404 });
    }

    const fFirstName = (faculty as Record<string, unknown>).first_name as string || "";
    const fLastName = (faculty as Record<string, unknown>).last_name as string || "";
    const fFullName = `${fFirstName} ${fLastName}`.trim();
    const fUser = (faculty as Record<string, unknown>).user as Record<string, unknown> | null;
    if (fUser) {
      fUser.full_name = fFullName || (fUser.email as string)?.split("@")[0] || "";
      fUser.avatar_url = null;
    } else {
      (faculty as Record<string, unknown>).user = { id: (faculty as Record<string, unknown>).user_id, full_name: fFullName, email: "", phone: null, avatar_url: null, is_active: true };
    }

    const { data: subjects } = await supabase
      .from("subjects")
      .select(`
        *,
        program:programs(id, name, code)
      `)
      .eq("is_active", true);

    const { data: students } = await supabase
      .from("students")
      .select(`
        *,
        user:users(id, email),
        department:departments(id, name, code),
        program:programs(id, name, code)
      `)
      .eq("is_active", true)
      .limit(50);

    const enrichedStudents = (students || []).map((s: Record<string, unknown>) => {
      const sfn = (s.first_name as string) || "";
      const sln = (s.last_name as string) || "";
      const sFull = `${sfn} ${sln}`.trim();
      const su = s.user as Record<string, unknown> | null;
      if (su) {
        su.full_name = sFull || (su.email as string)?.split("@")[0] || "";
      } else {
        s.user = { id: s.user_id, full_name: sFull, email: "" };
      }
      return s;
    });

    const { data: documents } = await supabase
      .from("documents")
      .select("*")
      .eq("faculty_id", id)
      .order("created_at", { ascending: false });

    const enrichedFaculty = {
      ...faculty,
      subjects_data: subjects || [],
      students_data: enrichedStudents || [],
      documents_data: documents || [],
    };

    return NextResponse.json<ApiSingleResponse<typeof enrichedFaculty>>({
      success: true,
      data: enrichedFaculty,
      error: null,
    });
  } catch (err) {
    return NextResponse.json<ApiSingleResponse<Faculty>>({
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
      "department_id", "designation", "qualification", "specialization",
      "date_of_joining", "date_of_birth", "gender", "blood_group",
      "address", "phone", "emergency_contact", "pan_number", "basic_salary",
      "is_hod", "is_active",
    ];

    for (const field of allowedFields) {
      if (field in updateData) {
        cleanUpdate[field] = updateData[field];
      }
    }

    if (Object.keys(cleanUpdate).length === 0 && !updateData.first_name && !updateData.last_name && !updateData.email) {
      return NextResponse.json({
        success: false,
        data: null,
        error: "No fields to update",
      }, { status: 400 });
    }

    if (Object.keys(cleanUpdate).length > 0) {
      cleanUpdate.updated_at = new Date().toISOString();
      const { error } = await supabase
        .from("faculty")
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

    if (user_id && (updateData.first_name || updateData.last_name || updateData.email)) {
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
      if (updateData.email) userUpdate.email = updateData.email;

      if (Object.keys(userUpdate).length > 0) {
        await supabase.from("users").update(userUpdate).eq("id", user_id);
      }
    }

    return NextResponse.json({
      success: true,
      data: { id },
      error: null,
      message: "Faculty updated successfully",
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
      .from("faculty")
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
      message: "Faculty deactivated successfully",
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Internal server error",
    }, { status: 500 });
  }
}
