"use client";

import * as React from "react";
import {
  BarChart3,
  Users,
  GraduationCap,
  IndianRupee,
  ClipboardCheck,
  FileText,
  Download,
  TrendingUp,
  Building2,
  Bus,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency } from "@/lib/utils";

const REPORT_CATEGORIES = [
  {
    title: "Academic Reports",
    icon: GraduationCap,
    color: "bg-blue-500",
    reports: [
      { name: "Student Results", href: "/reports?category=results", description: "Semester-wise student results" },
      { name: "Subject Performance", href: "/reports?category=subject", description: "Subject-wise pass/fail analysis" },
      { name: "Backlog Report", href: "/reports?category=backlog", description: "Active backlogs by student" },
    ],
  },
  {
    title: "Attendance Reports",
    icon: ClipboardCheck,
    color: "bg-emerald-500",
    reports: [
      { name: "Daily Attendance", href: "/reports/attendance", description: "Day-wise attendance summary" },
      { name: "Subject-wise", href: "/reports/attendance?view=subject", description: "Attendance by subject" },
      { name: "Defaulter List", href: "/reports/attendance?view=defaulter", description: "Students below 75% attendance" },
    ],
  },
  {
    title: "Fee Reports",
    icon: IndianRupee,
    color: "bg-amber-500",
    reports: [
      { name: "Collection Summary", href: "/reports/fees", description: "Fee collection overview" },
      { name: "Outstanding Dues", href: "/reports/fees?view=dues", description: "Pending fee amounts" },
      { name: "Day-wise Collection", href: "/reports/fees?view=daily", description: "Daily collection report" },
    ],
  },
  {
    title: "Placement Reports",
    icon: TrendingUp,
    color: "bg-violet-500",
    reports: [
      { name: "Placement Stats", href: "/reports?category=placement", description: "Placement statistics" },
      { name: "Company-wise", href: "/reports?category=company", description: "Company-wise placements" },
      { name: "Package Analysis", href: "/reports?category=package", description: "Salary package analysis" },
    ],
  },
];

export default function ReportsDashboardPage() {
  const { toast } = useToast();
  const [stats, setStats] = React.useState({ students: 0, faculty: 0, total_revenue: 0, attendance_rate: 0 });
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/reports?type=overview")
      .then((r) => r.json())
      .then((result) => { if (result.success) setStats(result.data); })
      .catch(() => toast({ title: "Error", description: "Failed to load report data", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [toast]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">Generate and view college reports</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Students</p><p className="text-2xl font-bold">{stats.students}</p></div><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500"><GraduationCap className="h-6 w-6 text-white" /></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Faculty</p><p className="text-2xl font-bold">{stats.faculty}</p></div><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500"><Users className="h-6 w-6 text-white" /></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold">{formatCurrency(stats.total_revenue)}</p></div><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500"><IndianRupee className="h-6 w-6 text-white" /></div></div></CardContent></Card>
        <Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Attendance Rate</p><p className="text-2xl font-bold">{stats.attendance_rate}%</p></div><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500"><ClipboardCheck className="h-6 w-6 text-white" /></div></div></CardContent></Card>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {REPORT_CATEGORIES.map((category) => (
          <Card key={category.title}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${category.color}`}>
                  <category.icon className="h-4 w-4 text-white" />
                </div>
                {category.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {category.reports.map((report) => (
                  <Link key={report.name} href={report.href}>
                    <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent">
                      <div>
                        <p className="text-sm font-medium">{report.name}</p>
                        <p className="text-xs text-muted-foreground">{report.description}</p>
                      </div>
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
