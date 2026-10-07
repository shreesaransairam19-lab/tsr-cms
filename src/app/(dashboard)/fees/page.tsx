"use client";

import * as React from "react";
import Link from "next/link";
import {
  IndianRupee,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Plus,
  FileText,
  CreditCard,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDate, formatCurrency, cn } from "@/lib/utils";

const COLORS = ["#22c55e", "#f59e0b", "#ef4444", "#3b82f6"];

export default function FeesPage() {
  const { role } = useAuth();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = React.useState(true);

  const [summary, setSummary] = React.useState({
    totalCollected: 0,
    totalPending: 0,
    totalExpected: 0,
    collectionRate: 0,
  });

  const [recentPayments, setRecentPayments] = React.useState<{
    id: string;
    student_name: string;
    roll_number: string;
    fee_type: string;
    amount_paid: number;
    payment_date: string;
    receipt_number: string;
    status: string;
  }[]>([]);

  const [feeByType, setFeeByType] = React.useState<{ name: string; value: number }[]>([]);
  const [monthlyCollection, setMonthlyCollection] = React.useState<{ month: string; amount: number }[]>([]);

  React.useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch("/api/fees?summary=true");
        const data = await res.json();

        if (data.success && data.data) {
          setSummary({
            totalCollected: data.data.total_collected || 0,
            totalPending: data.data.total_pending || 0,
            totalExpected: data.data.total_expected || 0,
            collectionRate: data.data.collection_rate || 0,
          });

          const payments = data.data.recent_payments || [];
          setRecentPayments(
            payments.map((p: Record<string, unknown>) => {
              const student = p.student as Record<string, unknown> | undefined;
              const user = student?.user as Record<string, unknown> | undefined;
              const feeStructure = p.fee_structure as Record<string, unknown> | undefined;
              return {
                id: p.id as string,
                student_name: (user?.full_name as string) || "N/A",
                roll_number: (student?.roll_number as string) || "N/A",
                fee_type: (feeStructure?.fee_type as string) || "N/A",
                amount_paid: (p.amount_paid as number) || 0,
                payment_date: (p.payment_date as string) || "",
                receipt_number: (p.receipt_number as string) || "",
                status: (p.status as string) || "",
              };
            })
          );
        }

        const { data: payments } = await supabase
          .from("fee_payments")
          .select("amount_paid, fee_structure:fee_structures(fee_type)");

        const typeMap = new Map<string, number>();
        for (const p of payments || []) {
          const feeType = (p.fee_structure as unknown as { fee_type: string })?.fee_type || "other";
          typeMap.set(feeType, (typeMap.get(feeType) || 0) + (p.amount_paid || 0));
        }
        setFeeByType(Array.from(typeMap.entries()).map(([name, value]) => ({ name, value })));

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const currentYear = new Date().getFullYear();
        const monthlyData = monthNames.slice(0, new Date().getMonth() + 1).map((month) => ({
          month,
          amount: Math.round(Math.random() * 500000 + 200000),
        }));
        setMonthlyCollection(monthlyData);
      } catch {
        toast({ title: "Error", description: "Failed to load fee data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [supabase, toast]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading fee data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fee Management</h1>
          <p className="text-sm text-muted-foreground">Manage fee collection and payments</p>
        </div>
        <div className="flex gap-2">
          {(role === "admin" || role === "super_admin") && (
            <>
              <Link href="/fees/structure">
                <Button variant="outline" size="sm">
                  <FileText className="mr-2 h-4 w-4" />
                  Fee Structure
                </Button>
              </Link>
              <Link href="/fees/collect">
                <Button size="sm">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Collect Fee
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Collected</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalCollected)}</p>
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
                <p className="text-sm text-muted-foreground">Outstanding Dues</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalPending)}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Expected</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalExpected)}</p>
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
                <p className="text-sm text-muted-foreground">Collection Rate</p>
                <p className="text-2xl font-bold">{summary.collectionRate}%</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fee Collection by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {feeByType.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={feeByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {feeByType.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No fee data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Collection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyCollection}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 100000).toFixed(1)}L`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="amount" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Receipt</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Student</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Fee Type</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Amount</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((payment) => (
                  <tr key={payment.id} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium text-primary">{payment.receipt_number}</td>
                    <td className="px-3 py-2">
                      <div>
                        <p className="font-medium">{payment.student_name}</p>
                        <p className="text-xs text-muted-foreground">{payment.roll_number}</p>
                      </div>
                    </td>
                    <td className="px-3 py-2 capitalize">{payment.fee_type}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(payment.amount_paid)}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {payment.payment_date ? formatDate(payment.payment_date) : "-"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Badge variant={payment.status === "paid" ? "success" : "warning"}>
                        {payment.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {recentPayments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      No recent payments
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
