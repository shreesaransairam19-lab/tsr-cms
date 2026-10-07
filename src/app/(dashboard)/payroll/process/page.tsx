"use client";

import * as React from "react";
import { CheckCircle2, Clock, Download, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";
import { downloadPayslip } from "@/lib/utils/payslip-generator";

interface Employee {
  id: string;
  employee_id: string;
  basic_salary: number;
  designation: string;
  type: string;
  user: { full_name: string } | null;
}

interface SalaryRecord {
  id: string;
  employee_id: string;
  employee_type: string;
  month: number;
  year: number;
  basic_salary: number;
  gross_earnings: number;
  total_deductions: number;
  net_salary: number;
  status: string;
  payment_date: string | null;
}

const MONTHS = [
  { value: "1", label: "January" }, { value: "2", label: "February" },
  { value: "3", label: "March" }, { value: "4", label: "April" },
  { value: "5", label: "May" }, { value: "6", label: "June" },
  { value: "7", label: "July" }, { value: "8", label: "August" },
  { value: "9", label: "September" }, { value: "10", label: "October" },
  { value: "11", label: "November" }, { value: "12", label: "December" },
];

export default function ProcessSalaryPage() {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [processing, setProcessing] = React.useState(false);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [selectedEmployees, setSelectedEmployees] = React.useState<Set<string>>(new Set());
  const [month, setMonth] = React.useState(String(new Date().getMonth() + 1));
  const [year, setYear] = React.useState(String(new Date().getFullYear()));
  const [records, setRecords] = React.useState<SalaryRecord[]>([]);

  React.useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [empRes, recordsRes] = await Promise.all([
          fetch("/api/payroll?action=employees"),
          fetch(`/api/payroll?action=summary&month=${month}&year=${year}`),
        ]);
        const empResult = await empRes.json();
        const recordsResult = await recordsRes.json();
        if (empResult.success) setEmployees(empResult.data || []);
        if (recordsResult.success) setRecords(recordsResult.data?.records || []);
      } catch {
        toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [month, year, toast]);

  const toggleEmployee = (id: string) => {
    setSelectedEmployees((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedEmployees.size === employees.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(employees.map((e) => e.id)));
    }
  };

  const processSalary = async () => {
    if (selectedEmployees.size === 0) {
      toast({ title: "Select Employees", description: "Please select at least one employee", variant: "destructive" });
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "process_salary", month: parseInt(month), year: parseInt(year), employee_ids: Array.from(selectedEmployees) }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      toast({ title: "Salary Processed", description: result.message, variant: "success" });
      setSelectedEmployees(new Set());
      const recordsRes = await fetch(`/api/payroll?action=summary&month=${month}&year=${year}`);
      const recordsResult = await recordsRes.json();
      if (recordsResult.success) setRecords(recordsResult.data?.records || []);
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const markPaid = async (id: string) => {
    try {
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_paid", id, payment_method: "bank_transfer" }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      toast({ title: "Marked as Paid", variant: "success" });
      setRecords((prev) => prev.map((r) => r.id === id ? { ...r, status: "paid" } : r));
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Process Salary</h1>
          <p className="text-sm text-muted-foreground">Generate and process monthly salary</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Select Period</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={month} onChange={(e) => setMonth(e.target.value)} options={MONTHS} className="w-[150px]" />
              <Input value={year} onChange={(e) => setYear(e.target.value)} className="w-[100px]" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <Switch checked={selectedEmployees.size === employees.length} onCheckedChange={selectAll} />
                <span className="text-sm font-medium">Select All ({employees.length} employees)</span>
              </div>
              <Button onClick={processSalary} disabled={processing || selectedEmployees.size === 0}>
                <Wallet className="mr-2 h-4 w-4" />
                {processing ? "Processing..." : `Process ${selectedEmployees.size} Salaries`}
              </Button>
            </div>

            {employees.map((emp) => {
              const existing = records.find((r) => r.employee_id === emp.id);
              return (
                <div key={emp.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <Switch checked={selectedEmployees.has(emp.id)} onCheckedChange={() => toggleEmployee(emp.id)} disabled={!!existing} />
                    <div>
                      <p className="text-sm font-medium">{emp.user?.full_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{emp.employee_id} · {emp.designation} · {emp.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium">{formatCurrency(emp.basic_salary)}</p>
                    {existing ? (
                      <div className="flex items-center gap-2">
                        <Badge variant={existing.status === "paid" ? "success" : "warning"}>{existing.status}</Badge>
                        {existing.status !== "paid" && (
                          <Button size="sm" variant="outline" onClick={() => markPaid(existing.id)}>
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Mark Paid
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
