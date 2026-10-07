"use client";

import * as React from "react";
import { Wallet, IndianRupee, Users, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PayrollSummary {
  total_gross: number;
  total_deductions: number;
  total_net: number;
  paid_count: number;
  total_count: number;
}

export default function PayrollDashboardPage() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [summary, setSummary] = React.useState<PayrollSummary | null>(null);
  const [recentRecords, setRecentRecords] = React.useState<Record<string, unknown>[]>([]);

  React.useEffect(() => {
    async function loadData() {
      try {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const res = await fetch(`/api/payroll?action=summary&month=${currentMonth}&year=${currentYear}`);
        const result = await res.json();
        if (result.success && result.data) {
          setSummary(result.data);
          setRecentRecords(result.data.records?.slice(0, 5) || []);
        }
      } catch {
        toast({ title: "Error", description: "Failed to load payroll data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading payroll data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payroll Management</h1>
          <p className="text-sm text-muted-foreground">Manage faculty and staff salaries</p>
        </div>
        <Link href="/payroll/process">
          <Button><Wallet className="mr-2 h-4 w-4" /> Process Salary</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Gross Earnings</p><p className="text-2xl font-bold">{formatCurrency(summary?.total_gross || 0)}</p></div><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500"><IndianRupee className="h-6 w-6 text-white" /></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Deductions</p><p className="text-2xl font-bold text-red-600">{formatCurrency(summary?.total_deductions || 0)}</p></div><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500"><IndianRupee className="h-6 w-6 text-white" /></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Net Salary</p><p className="text-2xl font-bold text-emerald-600">{formatCurrency(summary?.total_net || 0)}</p></div><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500"><CheckCircle2 className="h-6 w-6 text-white" /></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Paid / Total</p><p className="text-2xl font-bold">{summary?.paid_count || 0}/{summary?.total_count || 0}</p></div><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500"><Users className="h-6 w-6 text-white" /></div></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Payroll Records</CardTitle>
          <Link href="/payroll/process"><Button variant="outline" size="sm">View All</Button></Link>
        </CardHeader>
        <CardContent>
          {recentRecords.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No payroll records this month. Process salary to get started.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Employee</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Basic</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Net Salary</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">Status</th>
                </tr></thead>
                <tbody>
                  {recentRecords.map((record) => (
                    <tr key={record.id as string} className="border-b last:border-0">
                      <td className="px-3 py-2">{(record as Record<string, unknown>).employee_id as string}</td>
                      <td className="px-3 py-2 text-right">{formatCurrency((record as Record<string, unknown>).basic_salary as number)}</td>
                      <td className="px-3 py-2 text-right font-medium">{formatCurrency((record as Record<string, unknown>).net_salary as number)}</td>
                      <td className="px-3 py-2 text-center">
                        <Badge variant={(record as Record<string, unknown>).status === "paid" ? "success" : (record as Record<string, unknown>).status === "processed" ? "warning" : "secondary"}>
                          {(record as Record<string, unknown>).status as string}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
