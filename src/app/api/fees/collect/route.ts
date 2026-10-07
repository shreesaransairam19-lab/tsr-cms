import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const { searchParams } = new URL(request.url);

    const student_id = searchParams.get("student_id") || "";
    const search = searchParams.get("search") || "";

    if (search) {
      const { data: students, error: studentError } = await supabase
        .from("students")
        .select(`
          id, roll_number, semester, program_id, first_name, last_name,
          user:users(id, email),
          program:programs(id, name),
          department:departments(name)
        `)
        .or(`roll_number.ilike.%${search}%`)
        .eq("is_active", true)
        .limit(10);

      if (studentError) {
        return NextResponse.json({ success: false, data: null, error: studentError.message }, { status: 500 });
      }

      (students || []).forEach((item: Record<string, unknown>) => {
        const su = item.user as Record<string, unknown> | null;
        if (su) su.full_name = `${item.first_name || ""} ${item.last_name || ""}`.trim() || (su.email as string)?.split("@")[0] || "";
      });

      const results = await Promise.all(
        (students || []).map(async (student) => {
          const { data: feeStructures } = await supabase
            .from("fee_structures")
            .select("id, fee_type, amount, due_date, semester_number")
            .eq("program_id", student.program_id)
            .eq("semester_number", student.semester);

          const { data: payments } = await supabase
            .from("fee_payments")
            .select("fee_structure_id, amount_paid, status")
            .eq("student_id", student.id);

          const paidMap = new Map<string, number>();
          for (const p of payments || []) {
            const current = paidMap.get(p.fee_structure_id) || 0;
            paidMap.set(p.fee_structure_id, current + p.amount_paid);
          }

          const outstanding = (feeStructures || []).map((fs) => {
            const paid = paidMap.get(fs.id) || 0;
            const balance = fs.amount - paid;
            return {
              fee_structure_id: fs.id,
              fee_type: fs.fee_type,
              amount: fs.amount,
              due_date: fs.due_date,
              paid,
              balance: Math.max(0, balance),
              status: balance <= 0 ? "paid" : paid > 0 ? "partial" : "pending",
            };
          }).filter((f) => f.balance > 0);

          return {
            ...student,
            total_fee: (feeStructures || []).reduce((sum, fs) => sum + fs.amount, 0),
            total_paid: (payments || []).reduce((sum, p) => sum + p.amount_paid, 0),
            outstanding_fees: outstanding,
          };
        })
      );

      return NextResponse.json({ success: true, data: results, error: null });
    }

    if (student_id) {
      const { data: student } = await supabase
        .from("students")
        .select(`
          id, roll_number, semester, program_id, first_name, last_name,
          user:users(id, email),
          program:programs(id, name),
          department:departments(name)
        `)
        .eq("id", student_id)
        .single();

      if (!student) {
        return NextResponse.json({ success: false, data: null, error: "Student not found" }, { status: 404 });
      }

      const sUser = (student as unknown as Record<string, unknown>).user as Record<string, unknown> | null;
      if (sUser) {
        const sRec = student as unknown as Record<string, unknown>;
        sUser.full_name = `${sRec.first_name || ""} ${sRec.last_name || ""}`.trim() || (sUser.email as string)?.split("@")[0] || "";
      }

      const { data: feeStructures } = await supabase
        .from("fee_structures")
        .select("id, fee_type, amount, due_date, late_fee_per_day, semester_number, description")
        .eq("program_id", student.program_id)
        .eq("semester_number", student.semester);

      const { data: payments } = await supabase
        .from("fee_payments")
        .select("*")
        .eq("student_id", student_id)
        .order("payment_date", { ascending: false });

      const paidMap = new Map<string, number>();
      for (const p of payments || []) {
        const current = paidMap.get(p.fee_structure_id) || 0;
        paidMap.set(p.fee_structure_id, current + p.amount_paid);
      }

      const fees = (feeStructures || []).map((fs) => {
        const paid = paidMap.get(fs.id) || 0;
        const balance = fs.amount - paid;
        return {
          ...fs,
          paid,
          balance: Math.max(0, balance),
          status: balance <= 0 ? "paid" : paid > 0 ? "partial" : "pending",
        };
      });

      return NextResponse.json({
        success: true,
        data: {
          student,
          fees,
          total_fee: fees.reduce((sum, f) => sum + f.amount, 0),
          total_paid: fees.reduce((sum, f) => sum + f.paid, 0),
          total_balance: fees.reduce((sum, f) => sum + f.balance, 0),
          payments: payments || [],
        },
        error: null,
      });
    }

    return NextResponse.json({
      success: false, data: null, error: "student_id or search parameter required",
    }, { status: 400 });
  } catch (err) {
    return NextResponse.json({
      success: false, data: null,
      error: err instanceof Error ? err.message : "Internal server error",
    }, { status: 500 });
  }
}
