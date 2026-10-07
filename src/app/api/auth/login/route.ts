import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";
import { sanitizeSearch } from "@/lib/auth-helpers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { identifier, password, login_type, remember_me } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Email/roll number and password are required" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServerClient();
    const admin = await getSupabaseServiceClient();

    let email = identifier;
    let resolved = false;

    // An identifier with no "@" is a username. Supabase Auth only signs in
    // with an email, so look the account up first and use its email below.
    if (!identifier.includes("@")) {
      const { data: byUsername } = await admin
        .from("users")
        .select("email")
        .ilike("username", sanitizeSearch(identifier))
        .maybeSingle();

      if (byUsername?.email) {
        email = byUsername.email;
        resolved = true;
      }
    }

    if (!resolved && login_type === "roll_number") {
      const { data: student, error: studentError } = await admin
        .from("students")
        .select("user_id, roll_number")
        .ilike("roll_number", identifier)
        .maybeSingle();

      if (studentError || !student) {
        const { data: faculty, error: facultyError } = await admin
          .from("faculty")
          .select("user_id, employee_id")
          .ilike("employee_id", identifier)
          .maybeSingle();

        if (facultyError || !faculty) {
          return NextResponse.json(
            { error: "No account found with this roll/employee number" },
            { status: 401 }
          );
        }

        const { data: userRecord } = await admin
          .from("users")
          .select("email")
          .eq("id", faculty.user_id)
          .single();

        if (!userRecord?.email) {
          return NextResponse.json(
            { error: "No email found for this account" },
            { status: 401 }
          );
        }

        email = userRecord.email;
      } else {
        const { data: userRecord } = await admin
          .from("users")
          .select("email")
          .eq("id", student.user_id)
          .single();

        if (!userRecord?.email) {
          return NextResponse.json(
            { error: "No email found for this account" },
            { status: 401 }
          );
        }

        email = userRecord.email;
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "Login failed" },
        { status: 401 }
      );
    }

    const { data: userProfile } = await admin
      .from("users")
      .select("role, is_active")
      .eq("id", data.user.id)
      .single();

    if (!userProfile || !userProfile.is_active) {
      return NextResponse.json(
        { error: "Account is inactive. Contact administrator." },
        { status: 403 }
      );
    }

    let studentProfile = null;
    let facultyProfile = null;

    if (userProfile.role === "student") {
      const { data: sp } = await admin
        .from("students")
        .select("id, roll_number, first_name, last_name, department_id")
        .eq("user_id", data.user.id)
        .maybeSingle();
      studentProfile = sp;
    } else if (userProfile.role === "faculty") {
      const { data: fp } = await admin
        .from("faculty")
        .select("id, employee_id, first_name, last_name, department_id")
        .eq("user_id", data.user.id)
        .maybeSingle();
      facultyProfile = fp;
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: userProfile.role,
        student: studentProfile,
        faculty: facultyProfile,
      },
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
