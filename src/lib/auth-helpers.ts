import { NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/server";

export async function requireAuth() {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        supabase,
        user: null,
        response: NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        ),
      };
    }

    const { data: profile } = await supabase
      .from("users")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (profile?.is_active === false) {
      return {
        supabase,
        user: null,
        response: NextResponse.json(
          { success: false, error: "Account disabled" },
          { status: 403 }
        ),
      };
    }

    return {
      supabase,
      user: { ...user, role: profile?.role || "student" },
      response: null,
    };
  } catch (err) {
    console.error("Auth error:", err);
    return {
      supabase: null,
      user: null,
      response: NextResponse.json(
        { success: false, error: "Authentication failed" },
        { status: 401 }
      ),
    };
  }
}

export async function requireAdmin() {
  const auth = await requireAuth();
  if (auth.response) return auth;

  if (auth.user?.role !== "admin" && auth.user?.role !== "super_admin") {
    return {
      ...auth,
      user: null,
      response: NextResponse.json(
        { success: false, error: "Forbidden: admin access required" },
        { status: 403 }
      ),
    };
  }

  return auth;
}

export async function requireFacultyOrAdmin() {
  const auth = await requireAuth();
  if (auth.response) return auth;

  if (
    auth.user?.role !== "admin" &&
    auth.user?.role !== "super_admin" &&
    auth.user?.role !== "faculty"
  ) {
    return {
      ...auth,
      user: null,
      response: NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      ),
    };
  }

  return auth;
}

export async function getServiceClient() {
  return getSupabaseServiceClient();
}

export function sanitizeSearch(value: string | null): string {
  if (!value) return "";
  return value.replace(/[%_]/g, "\\$&").slice(0, 200);
}

export function sanitizeSortBy(value: string | null, allowed: string[]): string {
  if (!value || !allowed.includes(value)) return allowed[0];
  return value;
}

export function sanitizePerPage(value: string | null): number {
  const n = parseInt(value || "10", 10);
  if (isNaN(n) || n < 1) return 10;
  return Math.min(n, 100);
}

export function sanitizePage(value: string | null): number {
  const n = parseInt(value || "1", 10);
  if (isNaN(n) || n < 1) return 1;
  return n;
}
