import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "list";
    const month = searchParams.get("month") || "";
    const year = searchParams.get("year") || "";

    if (action === "components") {
      const { data, error } = await supabase.from("salary_components").select("*").eq("is_active", true).order("name");
      if (error) {
        if (error.message.includes("does not exist") || error.code === "42P01") {
          return NextResponse.json({ success: true, data: [], error: null });
        }
        return NextResponse.json({ success: false, data: null, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, data, error: null });
    }

    if (action === "summary") {
      let query = supabase.from("monthly_salaries").select(`
        id, employee_type, employee_id, month, year, basic_salary,
        gross_earnings, total_deductions, net_salary, status,
        payment_date
      `);
      if (month) query = query.eq("month", parseInt(month));
      if (year) query = query.eq("year", parseInt(year));

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) {
        if (error.message.includes("does not exist") || error.code === "42P01") {
          return NextResponse.json({ success: true, data: { items: [], total: 0, totalGross: 0, totalDeductions: 0, totalNet: 0, paid: 0, pending: 0 }, error: null });
        }
        return NextResponse.json({ success: false, data: null, error: error.message }, { status: 500 });
      }

      const totalGross = (data || []).reduce((sum: number, s: Record<string, unknown>) => sum + (s.gross_earnings as number || 0), 0);
      const totalDeductions = (data || []).reduce((sum: number, s: Record<string, unknown>) => sum + (s.total_deductions as number || 0), 0);
      const totalNet = (data || []).reduce((sum: number, s: Record<string, unknown>) => sum + (s.net_salary as number || 0), 0);
      const paidCount = (data || []).filter((s: Record<string, unknown>) => s.status === "paid").length;

      return NextResponse.json({
        success: true,
        data: { records: data || [], total_gross: totalGross, total_deductions: totalDeductions, total_net: totalNet, paid_count: paidCount, total_count: (data || []).length },
        error: null,
      });
    }

    if (action === "employees") {
      const { data: faculty } = await supabase.from("faculty").select("id, employee_id, basic_salary, designation, first_name, last_name, user:users(id, email)").eq("is_active", true);
      const { data: staff } = await supabase.from("admin_staff").select("id, employee_id, basic_salary, designation, first_name, last_name, user:users(id, email)").eq("is_active", true);

      const enrichUser = (row: Record<string, unknown>) => {
        const u = row.user as Record<string, unknown> | null;
        if (u) u.full_name = `${row.first_name || ""} ${row.last_name || ""}`.trim() || (u.email as string)?.split("@")[0] || "";
      };
      (faculty || []).forEach(enrichUser);
      (staff || []).forEach(enrichUser);

      const employees = [
        ...(faculty || []).map((f) => ({ ...f, type: "faculty" })),
        ...(staff || []).map((s) => ({ ...s, type: "admin_staff" })),
      ];

      return NextResponse.json({ success: true, data: employees, error: null });
    }

    const page = parseInt(searchParams.get("page") || "1", 10);
    const per_page = parseInt(searchParams.get("per_page") || "10", 10);

    let query = supabase.from("monthly_salaries").select(`
      *, employee:faculty(id, employee_id, first_name, last_name, user:users(id, email))
    `);
    if (month) query = query.eq("month", parseInt(month));
    if (year) query = query.eq("year", parseInt(year));

    const { count } = await supabase.from("monthly_salaries").select("*", { count: "exact", head: true });
    const from = (page - 1) * per_page;

    const { data, error } = await query.order("created_at", { ascending: false }).range(from, from + per_page - 1);
    if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 500 });

    (data || []).forEach((item: Record<string, unknown>) => {
      const fac = item.employee as Record<string, unknown> | null;
      if (fac) {
        const fu = fac.user as Record<string, unknown> | null;
        if (fu) fu.full_name = `${fac.first_name || ""} ${fac.last_name || ""}`.trim() || (fu.email as string)?.split("@")[0] || "";
      }
    });

    return NextResponse.json({
      success: true,
      data: { items: data || [], total: count || 0, page, per_page, total_pages: Math.ceil((count || 0) / per_page) },
      error: null,
    });
  } catch (err) {
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const { supabase, user } = auth;
    const body = await request.json();
    const { action } = body;

    if (action === "process_salary") {
      const { month, year, employee_ids } = body;
      if (!month || !year) return NextResponse.json({ success: false, data: null, error: "Month and year required" }, { status: 400 });

      const { data: components } = await supabase.from("salary_components").select("*").eq("is_active", true);
      const earnings = (components || []).filter((c: Record<string, unknown>) => c.type === "earning");
      const deductions = (components || []).filter((c: Record<string, unknown>) => c.type === "deduction");

      let query = supabase.from("faculty").select("id, basic_salary, user:users(id, email)").eq("is_active", true);
      if (employee_ids && employee_ids.length > 0) query = query.in("id", employee_ids);

      const { data: facultyList } = await query;
      const { data: existingSalaries } = await supabase.from("monthly_salaries").select("employee_id").eq("month", month).eq("year", year);

      const existingIds = new Set((existingSalaries || []).map((s: Record<string, unknown>) => s.employee_id));
      const salariesToInsert: Record<string, unknown>[] = [];

      for (const emp of (facultyList || [])) {
        if (existingIds.has(emp.id)) continue;
        const empData = emp as Record<string, unknown>;
        const basic = empData.basic_salary as number || 0;
        let gross = basic;
        let totalDeductions = 0;
        const components: Record<string, unknown>[] = [];

        for (const comp of earnings) {
          const compData = comp as Record<string, unknown>;
          const amount = compData.is_percentage ? (basic * (compData.default_value as number) / 100) : (compData.default_value as number);
          gross += amount;
          components.push({ component_id: compData.id, component_name: compData.name, component_code: compData.code, type: "earning", amount });
        }
        for (const comp of deductions) {
          const compData = comp as Record<string, unknown>;
          const amount = compData.is_percentage ? (basic * (compData.default_value as number) / 100) : (compData.default_value as number);
          totalDeductions += amount;
          components.push({ component_id: compData.id, component_name: compData.name, component_code: compData.code, type: "deduction", amount });
        }

        salariesToInsert.push({
          employee_type: "faculty", employee_id: emp.id, month, year,
          basic_salary: basic, components, gross_earnings: gross,
          total_deductions: totalDeductions, net_salary: gross - totalDeductions,
          status: "pending", processed_by: user?.id || null,
        });
      }

      if (salariesToInsert.length > 0) {
        const { error } = await supabase.from("monthly_salaries").insert(salariesToInsert);
        if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true, data: { processed: salariesToInsert.length }, error: null, message: `Processed ${salariesToInsert.length} salary records` });
    }

    if (action === "mark_paid") {
      const { id, payment_method, transaction_id } = body;
      const { error } = await supabase.from("monthly_salaries").update({
        status: "paid", payment_date: new Date().toISOString().split("T")[0],
        payment_method: payment_method || "bank_transfer", transaction_id: transaction_id || null,
      }).eq("id", id);
      if (error) return NextResponse.json({ success: false, data: null, error: error.message }, { status: 400 });
      return NextResponse.json({ success: true, data: { id }, error: null, message: "Marked as paid" });
    }

    return NextResponse.json({ success: false, data: null, error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}
