import { NextRequest, NextResponse } from "next/server";
import {
  requireAuth,
  requireAdmin,
  getServiceClient,
  sanitizeSearch,
  sanitizeSortBy,
  sanitizePerPage,
  sanitizePage,
} from "@/lib/auth-helpers";
import type { FacultyFilters, ApiListResponse, Faculty } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { supabase, user } = auth;
    const { searchParams } = new URL(request.url);

    const page = sanitizePage(searchParams.get("page"));
    const per_page = sanitizePerPage(searchParams.get("per_page"));
    const search = sanitizeSearch(searchParams.get("search"));
    const department_id = searchParams.get("department_id") || "";
    const is_hod = searchParams.get("is_hod");
    const is_active = searchParams.get("is_active");
    const sort_by = sanitizeSortBy(searchParams.get("sort_by"), [
      "created_at",
      "updated_at",
      "employee_id",
      "designation",
      "date_of_joining",
    ]);
    const sort_order = (searchParams.get("sort_order") || "desc") as "asc" | "desc";

    let countQuery = supabase
      .from("faculty")
      .select("*", { count: "exact", head: true });

    let dataQuery = supabase
      .from("faculty")
      .select(`
        *,
        user:users(id, email, phone, is_active),
        department:departments(id, name, code)
      `);

    if (search) {
      countQuery = countQuery.or(`employee_id.ilike.%${search}%`);
      dataQuery = dataQuery.or(`employee_id.ilike.%${search}%`);
    }
    if (department_id) {
      countQuery = countQuery.eq("department_id", department_id);
      dataQuery = dataQuery.eq("department_id", department_id);
    }
    if (typeof is_hod === "string" && is_hod !== "") {
      const hod = is_hod === "true";
      countQuery = countQuery.eq("is_hod", hod);
      dataQuery = dataQuery.eq("is_hod", hod);
    }
    if (typeof is_active === "string" && is_active !== "") {
      const active = is_active === "true";
      countQuery = countQuery.eq("is_active", active);
      dataQuery = dataQuery.eq("is_active", active);
    }

    const { count, error: countError } = await countQuery;
    if (countError) {
      return NextResponse.json<ApiListResponse<Faculty>>({
        success: false,
        data: null,
        error: countError.message,
      }, { status: 500 });
    }

    const from = (page - 1) * per_page;
    const to = from + per_page - 1;

    const { data, error } = await dataQuery
      .order(sort_by, { ascending: sort_order === "asc" })
      .range(from, to);

    if (error) {
      return NextResponse.json<ApiListResponse<Faculty>>({
        success: false,
        data: null,
        error: error.message,
      }, { status: 500 });
    }

    const total = count || 0;
    const total_pages = Math.ceil(total / per_page);

    const enriched = (data || []).map((f: Record<string, unknown>) => {
      const firstName = (f.first_name as string) || "";
      const lastName = (f.last_name as string) || "";
      const fullName = `${firstName} ${lastName}`.trim();
      const user = f.user as Record<string, unknown> | null;
      if (user) {
        user.full_name = fullName || (user.email as string)?.split("@")[0] || "";
        user.avatar_url = null;
      } else {
        f.user = { id: f.user_id, full_name: fullName, email: "", phone: null, avatar_url: null, is_active: true };
      }
      return f;
    });

    return NextResponse.json<ApiListResponse<Faculty>>({
      success: true,
      data: {
        items: enriched as unknown as Faculty[],
        total,
        page,
        per_page,
        total_pages,
        has_next: page < total_pages,
        has_previous: page > 1,
      },
      error: null,
    });
  } catch (err) {
    return NextResponse.json<ApiListResponse<Faculty>>({
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Internal server error",
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const { supabase, user } = auth;
    const body = await request.json();

    const {
      first_name, last_name, email, phone, date_of_birth, gender,
      blood_group, address, emergency_contact, pan_number, photo_url,
      department_id, designation, qualification, specialization,
      date_of_joining, employment_type, basic_salary, is_hod,
    } = body;

    const { count } = await supabase
      .from("faculty")
      .select("*", { count: "exact", head: true })
      .eq("department_id", department_id);

    const { data: deptData } = await supabase
      .from("departments")
      .select("code")
      .eq("id", department_id)
      .single();

    const deptCode = deptData?.code || "FAC";
    const seq = (count || 0) + 1;
    const employee_id = `EMP${deptCode.toUpperCase().slice(0, 3)}${seq.toString().padStart(3, "0")}`;

    const admin = await getServiceClient();
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password: employee_id,
      email_confirm: true,
      user_metadata: {
        full_name: `${first_name} ${last_name}`,
        first_name,
        last_name,
      },
    });

    if (authError) {
      return NextResponse.json({
        success: false,
        data: null,
        error: `Failed to create user: ${authError.message}`,
      }, { status: 400 });
    }

    await supabase.from("users").insert({
      id: authData.user.id,
      email,
      role: "faculty",
      full_name: `${first_name} ${last_name}`,
      phone,
      avatar_url: photo_url,
      is_active: true,
    });

    const { data: faculty, error: facultyError } = await supabase
      .from("faculty")
      .insert({
        user_id: authData.user.id,
        employee_id,
        department_id,
        designation,
        qualification: qualification || null,
        specialization: specialization || null,
        date_of_joining,
        date_of_birth,
        gender,
        blood_group: blood_group || null,
        address: address || null,
        phone,
        emergency_contact: emergency_contact || null,
        pan_number: pan_number || null,
        basic_salary: basic_salary || 0,
        is_hod: is_hod || false,
        is_active: true,
      })
      .select()
      .single();

    if (facultyError) {
      await admin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({
        success: false,
        data: null,
        error: facultyError.message,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: { id: faculty.id, employee_id },
      error: null,
      message: "Faculty created successfully",
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Internal server error",
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const { supabase, user } = auth;
    const body = await request.json();
    const { id, user_id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        data: null,
        error: "Faculty ID is required",
      }, { status: 400 });
    }

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

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const { supabase, user } = auth;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({
        success: false,
        data: null,
        error: "Faculty ID is required",
      }, { status: 400 });
    }

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
