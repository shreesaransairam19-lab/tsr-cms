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
import type { ApiListResponse, Student } from "@/types";

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
    const program_id = searchParams.get("program_id") || "";
    const batch_year = searchParams.get("batch_year")
      ? parseInt(searchParams.get("batch_year")!, 10)
      : undefined;
    const is_active = searchParams.get("is_active");
    const semester = searchParams.get("semester")
      ? parseInt(searchParams.get("semester")!, 10)
      : undefined;
    const sort_by_raw = sanitizeSortBy(searchParams.get("sort_by"), [
      "created_at",
      "updated_at",
      "roll_number",
      "semester",
      "batch_year",
    ]);
    const sort_by = sort_by_raw === "semester" ? "current_semester" : sort_by_raw;
    const sort_order = (searchParams.get("sort_order") || "desc") as "asc" | "desc";

    let countQuery = supabase
      .from("students")
      .select("*", { count: "exact", head: true });

    let dataQuery = supabase
      .from("students")
      .select(`
        *,
        user:users(id, email, phone, is_active),
        department:departments(id, name, code),
        program:programs(id, name, code)
      `);

    if (search) {
      countQuery = countQuery.or(
        `roll_number.ilike.%${search}%`
      );
      dataQuery = dataQuery.or(
        `roll_number.ilike.%${search}%`
      );
    }
    if (department_id) {
      countQuery = countQuery.eq("department_id", department_id);
      dataQuery = dataQuery.eq("department_id", department_id);
    }
    if (program_id) {
      countQuery = countQuery.eq("program_id", program_id);
      dataQuery = dataQuery.eq("program_id", program_id);
    }
    if (batch_year) {
      countQuery = countQuery.eq("batch_year", batch_year);
      dataQuery = dataQuery.eq("batch_year", batch_year);
    }
    if (typeof is_active === "string" && is_active !== "") {
      const active = is_active === "true";
      const statusVal = active ? "active" : "inactive";
      countQuery = countQuery.eq("status", statusVal);
      dataQuery = dataQuery.eq("status", statusVal);
    }
    if (semester) {
      countQuery = countQuery.eq("current_semester", semester);
      dataQuery = dataQuery.eq("current_semester", semester);
    }

    const { count, error: countError } = await countQuery;
    if (countError) {
      return NextResponse.json<ApiListResponse<Student>>({
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
      return NextResponse.json<ApiListResponse<Student>>({
        success: false,
        data: null,
        error: error.message,
      }, { status: 500 });
    }

    const total = count || 0;
    const total_pages = Math.ceil(total / per_page);

    const enriched = (data || []).map((s: Record<string, unknown>) => {
      const firstName = (s.first_name as string) || "";
      const lastName = (s.last_name as string) || "";
      const fullName = `${firstName} ${lastName}`.trim();
      const user = s.user as Record<string, unknown> | null;
      if (user) {
        user.full_name = fullName || (user.email as string)?.split("@")[0] || "";
        user.avatar_url = null;
      } else {
        s.user = { id: s.user_id, full_name: fullName, email: "", phone: null, avatar_url: null, is_active: true };
      }
      s.semester = s.current_semester;
      s.is_active = s.status === "active";
      s.phone = s.phone || null;
      s.is_hosteler = s.is_hosteler || false;
      s.is_transport_user = s.is_transport_user || false;
      s.aadhar_number = s.aadhar_number || null;
      s.category = s.category || null;
      return s;
    });

    return NextResponse.json<ApiListResponse<Student>>({
      success: true,
      data: {
        items: enriched as unknown as Student[],
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
    return NextResponse.json<ApiListResponse<Student>>({
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
      first_name,
      last_name,
      email,
      phone,
      department_id,
      program_id,
      semester,
      batch_year,
      admission_date,
      date_of_birth,
      gender,
      blood_group,
      address,
      city,
      state,
      pincode,
      father_name,
      father_phone,
      mother_name,
      mother_phone,
      guardian_phone,
      aadhar_number,
      entrance_exam_score,
      category,
      is_hosteler,
      is_transport_user,
      nationality,
      religion,
      community,
      photo_url,
      father_occupation,
    } = body;

    const { data: deptData } = await supabase
      .from("departments")
      .select("code")
      .eq("id", department_id)
      .single();

    const { count } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("department_id", department_id)
      .eq("batch_year", batch_year);

    const deptCode = deptData?.code || "STU";
    const seq = (count || 0) + 1;
    const batch = batch_year.toString().slice(-2);
    const roll_number = `${batch}${deptCode.toUpperCase().slice(0, 3)}${seq.toString().padStart(3, "0")}`;

    const admin = await getServiceClient();
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password: roll_number,
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
      role: "student",
      full_name: `${first_name} ${last_name}`,
      phone,
      avatar_url: photo_url,
      is_active: true,
    });

    const { data: student, error: studentError } = await supabase
      .from("students")
      .insert({
        user_id: authData.user.id,
        roll_number,
        department_id,
        program_id,
        batch_year,
        semester,
        admission_date,
        date_of_birth,
        gender,
        blood_group: blood_group || null,
        address: address || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        father_name: father_name || null,
        father_phone: father_phone || null,
        mother_name: mother_name || null,
        mother_phone: mother_phone || null,
        guardian_phone: guardian_phone || null,
        aadhar_number: aadhar_number || null,
        entrance_exam_score: entrance_exam_score || null,
        category: category || null,
        is_hosteler: is_hosteler || false,
        is_transport_user: is_transport_user || false,
        is_active: true,
      })
      .select()
      .single();

    if (studentError) {
      await admin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({
        success: false,
        data: null,
        error: studentError.message,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: { id: student.id, roll_number },
      error: null,
      message: "Student created successfully",
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
        error: "Student ID is required",
      }, { status: 400 });
    }

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

    const { error } = await supabase
      .from("students")
      .update({ ...cleanUpdate, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return NextResponse.json({
        success: false,
        data: null,
        error: error.message,
      }, { status: 400 });
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
        error: "Student ID is required",
      }, { status: 400 });
    }

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
