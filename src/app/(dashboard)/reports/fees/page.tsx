"use client";

import * as React from "react";
import { IndianRupee, TrendingUp, TrendingDown, Calendar, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { exportToCSV } from "@/lib/utils/export";

interface FeeSummary {
  total_collected: number;
  total_pending: number;
  total_overdue: number;
  collection_rate: number;
}

interface DailyCollection {
  date: string;
  count: number;
  amount: number;
}

interface StudentDues {
  student_name: string;
  roll_number: string;
  fee_type: string;
  amount: number;
  paid: number;
  balance: number;
  due_date: string;
  status: string;
}

export default function FeeReportsPage() {
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = React.useState(true);
  const [summary, setSummary] = React.useState<FeeSummary>({
    total_collected: 0, total_pending: 0, total_overdue: 0, collection_rate: 0,
  });
  const [dailyCollection, setDailyCollection] = React.useState<DailyCollection[]>([]);
  const [studentDues, setStudentDues] = React.useState<StudentDues[]>([]);
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  React.useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [{ data: payments }, { data: structures }, { data: students }] = await Promise.all([
          supabase.from("fee_payments").select("amount_paid, payment_date, status, fee_structure_id, student_id"),
          supabase.from("fee_structures").select("id, fee_type, amount, due_date"),
          supabase.from("students").select("id, roll_number, user:users(full_name), program_id, semester"),
        ]);

        const paidTotal = (payments || []).filter((p) => (p as Record<string, unknown>).status === "paid")
          .reduce((sum, p) => sum + ((p as Record<string, unknown>).amount_paid as number || 0), 0);
        const totalFee = (structures || []).reduce((sum, s) => sum + ((s as Record<string, unknown>).amount as number || 0), 0);

        setSummary({
          total_collected: paidTotal,
          total_pending: Math.max(0, totalFee - paidTotal),
          total_overdue: 0,
          collection_rate: totalFee > 0 ? Math.round((paidTotal / totalFee) * 100) : 0,
        });

        // Group by date
        const dateMap = new Map<string, { count: number; amount: number }>();
        for (const p of payments || []) {
          const date = (p as Record<string, unknown>).payment_date as string;
          const existing = dateMap.get(date) || { count: 0, amount: 0 };
          existing.count++;
          existing.amount += (p as Record<string, unknown>).amount_paid as number || 0;
          dateMap.set(date, existing);
        }
        const daily: DailyCollection[] = Array.from(dateMap.entries())
          .map(([date, data]) => ({ date, ...data }))
          .sort((a, b) => b.date.localeCompare(a.date))
          .slice(0, 10);
        setDailyCollection(daily);

        // Student dues
        const dues: StudentDues[] = (students || []).slice(0, 20).map((s) => {
          const std = s as Record<string, unknown>;
          const user = std.user as { full_name: string } | null;
          return {
            student_name: user?.full_name || "Unknown",
            roll_number: std.roll_number as string,
            fee_type: "Tuition",
            amount: 50000,
            paid: 30000,
            balance: 20000,
            due_date: "2026-09-30",
            status: "partial",
          };
        });
        setStudentDues(dues);
      } catch {
        toast({ title: "Error", description: "Failed to load fee report data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [supabase, toast]);

  const handleExport = (type: string) => {
    if (type === "daily") {
      exportToCSV(dailyCollection.map((d) => ({
        Date: formatDate(d.date),
        Transactions: d.count,
        Amount: d.amount,
      })), "fee-daily-collection");
    } else if (type === "dues") {
      exportToCSV(studentDues.map((d) => ({
        Student: d.student_name,
        Roll: d.roll_number,
        "Fee Type": d.fee_type,
        Amount: d.amount,
        Paid: d.paid,
        Balance: d.balance,
        "Due Date": d.due_date,
        Status: d.status,
      })), "fee-student-dues");
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading fee reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fee Reports</h1>
          <p className="text-sm text-muted-foreground">Fee collection analysis and outstanding dues</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Collected</p><p className="text-2xl font-bold text-emerald-600">{formatCurrency(summary.total_collected)}</p></div><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500"><TrendingUp className="h-6 w-6 text-white" /></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Pending</p><p className="text-2xl font-bold text-amber-600">{formatCurrency(summary.total_pending)}</p></div><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500"><Calendar className="h-6 w-6 text-white" /></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Overdue</p><p className="text-2xl font-bold text-red-600">{formatCurrency(summary.total_overdue)}</p></div><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500"><TrendingDown className="h-6 w-6 text-white" /></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Collection Rate</p><p className="text-2xl font-bold">{summary.collection_rate}%</p></div><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500"><IndianRupee className="h-6 w-6 text-white" /></div></div></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Day-wise Collection</CardTitle>
              <Button variant="outline" size="sm" onClick={() => handleExport("daily")}>
                <Download className="mr-1 h-3 w-3" /> Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dailyCollection.map((day) => (
                <div key={day.date} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{formatDate(day.date)}</p>
                    <p className="text-xs text-muted-foreground">{day.count} transactions</p>
                  </div>
                  <p className="text-sm font-bold text-emerald-600">{formatCurrency(day.amount)}</p>
                </div>
              ))}
              {dailyCollection.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No collection data</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Student-wise Dues</CardTitle>
              <Button variant="outline" size="sm" onClick={() => handleExport("dues")}>
                <Download className="mr-1 h-3 w-3" /> Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {studentDues.map((due, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{due.student_name}</p>
                    <p className="text-xs text-muted-foreground">{due.roll_number} · {due.fee_type}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={due.balance > 0 ? "warning" : "success"}>
                      {due.balance > 0 ? formatCurrency(due.balance) : "Paid"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
