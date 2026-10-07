import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth-helpers";
import type { ApiListResponse, FeePayment } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { supabase, user } = auth;
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const per_page = Math.min(parseInt(searchParams.get("per_page") || "20", 10), 100);
    const student_id = searchParams.get("student_id") || "";
    const fee_type = searchParams.get("fee_type") || "";
    const status = searchParams.get("status") || "";
    const date_from = searchParams.get("date_from") || "";
    const date_to = searchParams.get("date_to") || "";
    const summary = searchParams.get("summary") === "true";

    if (summary) {
      const { data: allPayments } = await supabase
        .from("fee_payments")
        .select("amount_paid, status, fee_structure:fee_structures(fee_type, amount, program:programs(name))");

      const totalCollected = allPayments
        ?.filter((p) => p.status === "paid" || p.status === "partial")
        .reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0;

      const { data: allStructures } = await supabase
        .from("fee_structures")
        .select("id, amount, fee_type");

      const totalExpected = allStructures?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0;

      const totalPending = totalExpected - totalCollected;

      const { data: recentPayments } = await supabase
        .from("fee_payments")
        .select(`
          *,
          student:students(id, roll_number, first_name, last_name, user:users(id, email)),
          fee_structure:fee_structures(fee_type, amount, program:programs(name))
        `)
        .order("payment_date", { ascending: false })
        .limit(10);

      (recentPayments || []).forEach((item: Record<string, unknown>) => {
        const student = item.student as Record<string, unknown> | null;
        if (student) {
          const su = student.user as Record<string, unknown> | null;
          if (su) su.full_name = `${student.first_name || ""} ${student.last_name || ""}`.trim() || (su.email as string)?.split("@")[0] || "";
        }
      });

      return NextResponse.json({
        success: true,
        data: {
          total_collected: totalCollected,
          total_pending: Math.max(0, totalPending),
          total_expected: totalExpected,
          collection_rate: totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100 * 100) / 100 : 0,
          recent_payments: recentPayments || [],
        },
        error: null,
      });
    }

    if (student_id) {
      let countQuery = supabase
        .from("fee_payments")
        .select("*", { count: "exact", head: true })
        .eq("student_id", student_id);

      let dataQuery = supabase
        .from("fee_payments")
        .select(`
          *,
          student:students(id, roll_number, first_name, last_name, user:users(id, email)),
          fee_structure:fee_structures(id, fee_type, amount, due_date, semester_number, program:programs(name))
        `)
        .eq("student_id", student_id);

      if (fee_type) {
        countQuery = countQuery.eq("fee_structure.fee_type", fee_type);
        dataQuery = dataQuery.eq("fee_structure.fee_type", fee_type);
      }
      if (status) {
        countQuery = countQuery.eq("status", status);
        dataQuery = dataQuery.eq("status", status);
      }
      if (date_from) {
        countQuery = countQuery.gte("payment_date", date_from);
        dataQuery = dataQuery.gte("payment_date", date_from);
      }
      if (date_to) {
        countQuery = countQuery.lte("payment_date", date_to);
        dataQuery = dataQuery.lte("payment_date", date_to);
      }

      const { count } = await countQuery;

      const from = (page - 1) * per_page;
      const to = from + per_page - 1;

      const { data: payments, error } = await dataQuery
        .order("payment_date", { ascending: false })
        .range(from, to);

      if (error) {
        return NextResponse.json<ApiListResponse<FeePayment>>({
          success: false, data: null, error: error.message,
        }, { status: 500 });
      }

      (payments || []).forEach((item: Record<string, unknown>) => {
        const student = item.student as Record<string, unknown> | null;
        if (student) {
          const su = student.user as Record<string, unknown> | null;
          if (su) su.full_name = `${student.first_name || ""} ${student.last_name || ""}`.trim() || (su.email as string)?.split("@")[0] || "";
        }
      });

      const total = count || 0;
      return NextResponse.json<ApiListResponse<FeePayment>>({
        success: true,
        data: {
          items: payments as unknown as FeePayment[],
          total,
          page,
          per_page,
          total_pages: Math.ceil(total / per_page),
          has_next: page < Math.ceil(total / per_page),
          has_previous: page > 1,
        },
        error: null,
      });
    }

    let countQuery = supabase
      .from("fee_payments")
      .select("*", { count: "exact", head: true });

    let dataQuery = supabase
      .from("fee_payments")
      .select(`
        *,
        student:students(id, roll_number, first_name, last_name, user:users(id, email), department:departments(name)),
        fee_structure:fee_structures(fee_type, amount, program:programs(name))
      `);

    if (fee_type) {
      countQuery = countQuery.eq("fee_structure.fee_type", fee_type);
      dataQuery = dataQuery.eq("fee_structure.fee_type", fee_type);
    }
    if (status) {
      countQuery = countQuery.eq("status", status);
      dataQuery = dataQuery.eq("status", status);
    }
    if (date_from) {
      countQuery = countQuery.gte("payment_date", date_from);
      dataQuery = dataQuery.gte("payment_date", date_from);
    }
    if (date_to) {
      countQuery = countQuery.lte("payment_date", date_to);
      dataQuery = dataQuery.lte("payment_date", date_to);
    }

    const { count } = await countQuery;

    const from = (page - 1) * per_page;
    const to = from + per_page - 1;

    const { data: payments, error } = await dataQuery
      .order("payment_date", { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json<ApiListResponse<FeePayment>>({
        success: false, data: null, error: error.message,
      }, { status: 500 });
    }

    (payments || []).forEach((item: Record<string, unknown>) => {
      const student = item.student as Record<string, unknown> | null;
      if (student) {
        const su = student.user as Record<string, unknown> | null;
        if (su) su.full_name = `${student.first_name || ""} ${student.last_name || ""}`.trim() || (su.email as string)?.split("@")[0] || "";
      }
    });

    const total = count || 0;
    return NextResponse.json<ApiListResponse<FeePayment>>({
      success: true,
      data: {
        items: payments as unknown as FeePayment[],
        total,
        page,
        per_page,
        total_pages: Math.ceil(total / per_page),
        has_next: page < Math.ceil(total / per_page),
        has_previous: page > 1,
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
    const { supabase, user } = auth;
    const body = await request.json();

    const {
      student_id,
      fee_structure_id,
      amount_paid,
      payment_method,
      transaction_id,
      remarks,
    } = body;

    if (!student_id || !fee_structure_id || !amount_paid || !payment_method) {
      return NextResponse.json({
        success: false, data: null,
        error: "student_id, fee_structure_id, amount_paid, and payment_method are required",
      }, { status: 400 });
    }

    const { data: feeStructure } = await supabase
      .from("fee_structures")
      .select("id, amount")
      .eq("id", fee_structure_id)
      .single();

    if (!feeStructure) {
      return NextResponse.json({
        success: false, data: null, error: "Fee structure not found",
      }, { status: 404 });
    }

    const { data: existingPayments } = await supabase
      .from("fee_payments")
      .select("amount_paid")
      .eq("student_id", student_id)
      .eq("fee_structure_id", fee_structure_id);

    const totalPaid = existingPayments?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0;
    const remaining = feeStructure.amount - totalPaid;

    if (amount_paid > remaining) {
      return NextResponse.json({
        success: false, data: null,
        error: `Amount exceeds remaining balance of ₹${remaining}`,
      }, { status: 400 });
    }

    const newTotalPaid = totalPaid + amount_paid;
    let feeStatus: string;
    if (newTotalPaid >= feeStructure.amount) {
      feeStatus = "paid";
    } else if (newTotalPaid > 0) {
      feeStatus = "partial";
    } else {
      feeStatus = "pending";
    }

    const receiptCount = await supabase
      .from("fee_payments")
      .select("*", { count: "exact", head: true });
    const seq = (receiptCount.count || 0) + 1;
    const date = new Date();
    const receiptNumber = `TSR/${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, "0")}/${seq.toString().padStart(4, "0")}`;

    const { data: payment, error: paymentError } = await supabase
      .from("fee_payments")
      .insert({
        student_id,
        fee_structure_id,
        amount_paid,
        payment_date: new Date().toISOString().split("T")[0],
        payment_method,
        transaction_id: transaction_id || null,
        receipt_number: receiptNumber,
        status: feeStatus,
        remarks: remarks || null,
        received_by: user.id,
      })
      .select("id")
      .single();

    if (paymentError) {
      return NextResponse.json({ success: false, data: null, error: paymentError.message }, { status: 400 });
    }

    await supabase
      .from("fee_receipts")
      .insert({
        receipt_number: receiptNumber,
        payment_id: payment.id,
        student_id,
        issued_date: new Date().toISOString().split("T")[0],
      });

    return NextResponse.json({
      success: true,
      data: { id: payment.id, receipt_number: receiptNumber },
      error: null,
      message: "Payment recorded successfully",
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({
      success: false, data: null,
      error: err instanceof Error ? err.message : "Internal server error",
    }, { status: 500 });
  }
}
