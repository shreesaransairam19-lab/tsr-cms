"use client";

import * as React from "react";
import {
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Download,
  Receipt,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

interface FeeItem {
  id: string;
  fee_type: string;
  amount: number;
  due_date: string;
  late_fee_per_day: number;
  paid: number;
  balance: number;
  status: string;
  description: string | null;
}

interface PaymentItem {
  id: string;
  fee_structure_id: string;
  amount_paid: number;
  payment_date: string;
  payment_method: string;
  receipt_number: string;
  status: string;
}

export default function StudentFeesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = React.useState(true);

  const [fees, setFees] = React.useState<FeeItem[]>([]);
  const [payments, setPayments] = React.useState<PaymentItem[]>([]);
  const [summary, setSummary] = React.useState({
    totalFee: 0,
    totalPaid: 0,
    totalBalance: 0,
  });

  React.useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: studentRecord } = await supabase
          .from("students")
          .select("id, program_id, semester")
          .eq("user_id", user?.id)
          .single();

        if (!studentRecord) return;

        const { data: feeStructures } = await supabase
          .from("fee_structures")
          .select("id, fee_type, amount, due_date, late_fee_per_day, description")
          .eq("program_id", studentRecord.program_id)
          .eq("semester_number", studentRecord.semester);

        const { data: paymentsData } = await supabase
          .from("fee_payments")
          .select("*")
          .eq("student_id", studentRecord.id)
          .order("payment_date", { ascending: false });

        const paidMap = new Map<string, number>();
        for (const p of paymentsData || []) {
          const current = paidMap.get(p.fee_structure_id) || 0;
          paidMap.set(p.fee_structure_id, current + p.amount_paid);
        }

        const feeItems: FeeItem[] = (feeStructures || []).map((fs) => {
          const paid = paidMap.get(fs.id) || 0;
          const balance = fs.amount - paid;
          return {
            id: fs.id,
            fee_type: fs.fee_type,
            amount: fs.amount,
            due_date: fs.due_date,
            late_fee_per_day: fs.late_fee_per_day,
            paid,
            balance: Math.max(0, balance),
            status: balance <= 0 ? "paid" : paid > 0 ? "partial" : "pending",
            description: fs.description,
          };
        });

        setFees(feeItems);
        setPayments((paymentsData || []) as PaymentItem[]);
        setSummary({
          totalFee: feeItems.reduce((sum, f) => sum + f.amount, 0),
          totalPaid: feeItems.reduce((sum, f) => sum + f.paid, 0),
          totalBalance: feeItems.reduce((sum, f) => sum + f.balance, 0),
        });
      } catch {
        toast({ title: "Error", description: "Failed to load fee data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, supabase, toast]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading fee details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Fees</h1>
        <p className="text-sm text-muted-foreground">View your fee structure and payment history</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Fee</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalFee)}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500">
                <IndianRupee className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(summary.totalPaid)}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Balance Due</p>
                <p className={cn("text-2xl font-bold", summary.totalBalance > 0 ? "text-red-600" : "text-emerald-600")}>
                  {formatCurrency(summary.totalBalance)}
                </p>
              </div>
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", summary.totalBalance > 0 ? "bg-red-500" : "bg-emerald-500")}>
                {summary.totalBalance > 0 ? (
                  <AlertCircle className="h-6 w-6 text-white" />
                ) : (
                  <CheckCircle2 className="h-6 w-6 text-white" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Fee Structure</CardTitle>
          {summary.totalBalance > 0 && (
            <Button size="sm">
              <CreditCard className="mr-2 h-4 w-4" />
              Pay Online
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {fees.map((fee) => (
              <div
                key={fee.id}
                className={cn(
                  "flex items-center justify-between rounded-lg border p-4",
                  fee.status === "paid" && "bg-emerald-50/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    fee.status === "paid" ? "bg-emerald-100" : fee.status === "partial" ? "bg-amber-100" : "bg-red-100"
                  )}>
                    {fee.status === "paid" ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Calendar className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">{fee.fee_type}</p>
                    <p className="text-xs text-muted-foreground">
                      Total: {formatCurrency(fee.amount)} · Due: {formatDate(fee.due_date)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={fee.status === "paid" ? "success" : fee.status === "partial" ? "warning" : "destructive"}>
                    {fee.status === "paid" ? "Paid" : fee.status === "partial" ? "Partial" : "Pending"}
                  </Badge>
                  {fee.balance > 0 && (
                    <p className="mt-1 text-sm font-medium text-red-600">
                      Due: {formatCurrency(fee.balance)}
                    </p>
                  )}
                  {fee.paid > 0 && fee.balance > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Paid: {formatCurrency(fee.paid)}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {fees.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">No fee records found</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Receipt No</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Amount</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Method</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium text-primary">{payment.receipt_number}</td>
                    <td className="px-3 py-2 text-muted-foreground">{formatDate(payment.payment_date)}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(payment.amount_paid)}</td>
                    <td className="px-3 py-2 capitalize">{payment.payment_method.replace("_", " ")}</td>
                    <td className="px-3 py-2 text-center">
                      <Badge variant={payment.status === "paid" ? "success" : "warning"}>
                        {payment.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                      No payment history
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
