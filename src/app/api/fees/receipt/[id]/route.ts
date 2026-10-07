import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const { id } = await params;

    const { data: receipt, error: receiptError } = await supabase
      .from("fee_receipts")
      .select(`
        *,
        payment:fee_payments(
          *,
          student:students(
            id, roll_number, semester, first_name, last_name,
            user:users(id, email),
            program:programs(name),
            department:departments(name)
          ),
          fee_structure:fee_structures(
            fee_type, amount, semester_number,
            program:programs(name)
          )
        )
      `)
      .eq("id", id)
      .single();

    if (receiptError || !receipt) {
      return NextResponse.json({
        success: false, data: null, error: "Receipt not found",
      }, { status: 404 });
    }

    const payment = (receipt as unknown as Record<string, unknown>).payment as Record<string, unknown> | null;
    if (payment) {
      const student = payment.student as Record<string, unknown> | null;
      if (student) {
        const su = student.user as Record<string, unknown> | null;
        if (su) su.full_name = `${student.first_name || ""} ${student.last_name || ""}`.trim() || (su.email as string)?.split("@")[0] || "";
      }
    }

    return NextResponse.json({ success: true, data: receipt, error: null });
  } catch (err) {
    return NextResponse.json({
      success: false, data: null,
      error: err instanceof Error ? err.message : "Internal server error",
    }, { status: 500 });
  }
}
