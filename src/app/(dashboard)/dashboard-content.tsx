"use client";

import Link from "next/link";
import {
  Users,
  GraduationCap,
  ClipboardCheck,
  IndianRupee,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Clock,
  Bell,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Severity colour coding for the notification type badge.
const NOTIF_TYPE_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "warning" | "success"
> = {
  info: "default",
  warning: "warning",
  urgent: "destructive",
  academic: "secondary",
  general: "secondary",
};

interface DashboardData {
  role: string;
  stats?: {
    total_students: number;
    total_faculty: number;
    attendance_today: number;
    fee_collection: number;
    fee_pending: number;
  };
  faculty?: Record<string, unknown>;
  student?: Record<string, unknown>;
  notifications: Record<string, unknown>[];
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: "up" | "down";
  trendValue?: string;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && trendValue && (
              <div className="flex items-center gap-1 pt-1">
                {trend === "up" ? (
                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span
                  className={`text-xs font-medium ${trend === "up" ? "text-emerald-500" : "text-red-500"}`}
                >
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl ${color || "bg-primary/10"}`}
          >
            <Icon className={`h-6 w-6 ${color ? "text-white" : "text-primary"}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminDashboard({ data }: { data: DashboardData }) {
  const stats = data.stats!;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of the college management system
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Students"
          value={stats.total_students}
          icon={GraduationCap}
          trend="up"
          trendValue="+12 this month"
          color="bg-blue-500"
        />
        <StatCard
          title="Total Faculty"
          value={stats.total_faculty}
          icon={Users}
          color="bg-violet-500"
        />
        <StatCard
          title="Attendance Today"
          value={`${stats.attendance_today}%`}
          icon={ClipboardCheck}
          trend="up"
          trendValue="+2.3% vs last week"
          color="bg-emerald-500"
        />
        <StatCard
          title="Fee Collected"
          value={`₹${(stats.fee_collection / 100000).toFixed(1)}L`}
          subtitle={`₹${(stats.fee_pending / 100000).toFixed(1)}L pending`}
          icon={IndianRupee}
          trend="up"
          trendValue="+8.5% vs last month"
          color="bg-amber-500"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {data.notifications.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No recent notifications
              </p>
            ) : (
              <div className="space-y-3">
                {data.notifications.slice(0, 5).map((notif) => (
                  <div
                    key={notif.id as string}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    <Bell className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{notif.title as string}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {notif.message as string}
                      </p>
                    </div>
                    <Badge variant={NOTIF_TYPE_VARIANT[notif.type as string] || "secondary"}>
                      {notif.type as string}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/students" className="flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-accent">
                <GraduationCap className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Manage Students</span>
              </Link>
              <Link href="/faculty" className="flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-accent">
                <Users className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Manage Faculty</span>
              </Link>
              <Link href="/reports" className="flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-accent">
                <FileText className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">View Reports</span>
              </Link>
              <Link href="/reports/attendance" className="flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-accent">
                <BarChart3 className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">Analytics</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FacultyDashboard({ data }: { data: DashboardData }) {
  const todayClasses = [
    {
      subject: "Data Structures",
      time: "09:00 - 10:00",
      room: "Room 301",
      students: { present: 42, total: 45 },
    },
    {
      subject: "Algorithms",
      time: "11:00 - 12:00",
      room: "Room 205",
      students: { present: 38, total: 45 },
    },
    {
      subject: "Database Systems",
      time: "02:00 - 03:00",
      room: "Lab 102",
      students: { present: 0, total: 40 },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Faculty Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s your overview for today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Classes"
          value={3}
          icon={Calendar}
          color="bg-blue-500"
        />
        <StatCard
          title="Avg Attendance"
          value="88.7%"
          icon={ClipboardCheck}
          trend="up"
          trendValue="+1.2% this week"
          color="bg-emerald-500"
        />
        <StatCard
          title="Pending Evaluations"
          value={12}
          icon={FileText}
          color="bg-amber-500"
        />
        <StatCard
          title="Subjects Assigned"
          value={3}
          icon={BookOpen}
          color="bg-violet-500"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today&apos;s Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayClasses.map((cls, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 rounded-lg border p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{cls.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {cls.time} &middot; {cls.room}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {cls.students.present}/{cls.students.total}
                    </p>
                    <p className="text-xs text-muted-foreground">students</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {data.notifications.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No recent notifications
              </p>
            ) : (
              <div className="space-y-3">
                {data.notifications.slice(0, 4).map((notif) => (
                  <div
                    key={notif.id as string}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    <Bell className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{notif.title as string}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {notif.message as string}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StudentDashboard({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Student Dashboard</h1>
        <p className="text-muted-foreground">
          Here&apos;s your academic overview
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Attendance"
          value="85.2%"
          icon={ClipboardCheck}
          trend="up"
          trendValue="+1.5% this month"
          color="bg-emerald-500"
        />
        <StatCard
          title="Current SGPA"
          value="8.4"
          icon={BarChart3}
          trend="up"
          trendValue="+0.3 vs last sem"
          color="bg-blue-500"
        />
        <StatCard
          title="Fee Status"
          value="₹45,000"
          subtitle="Due by 30th"
          icon={IndianRupee}
          color="bg-amber-500"
        />
        <StatCard
          title="Upcoming Exams"
          value={2}
          icon={FileText}
          color="bg-violet-500"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { subject: "Data Structures", attended: 38, total: 42, percent: 90.5 },
                { subject: "Algorithms", attended: 35, total: 40, percent: 87.5 },
                { subject: "Database Systems", attended: 30, total: 38, percent: 78.9 },
                { subject: "Operating Systems", attended: 36, total: 40, percent: 90.0 },
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.subject}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.attended}/{item.total} ({item.percent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.percent >= 85
                          ? "bg-emerald-500"
                          : item.percent >= 75
                            ? "bg-amber-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming Exams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  subject: "Data Structures",
                  type: "Internal 2",
                  date: "25 Aug 2026",
                },
                {
                  subject: "Algorithms",
                  type: "Internal 2",
                  date: "27 Aug 2026",
                },
              ].map((exam, idx) => (
                <div key={idx} className="rounded-lg border p-3">
                  <p className="text-sm font-medium">{exam.subject}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="secondary">{exam.type}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {exam.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Fee Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  type: "Tuition Fee",
                  amount: 35000,
                  status: "paid",
                  due: null,
                },
                {
                  type: "Exam Fee",
                  amount: 5000,
                  status: "pending",
                  due: "30 Aug 2026",
                },
                {
                  type: "Library Fine",
                  amount: 200,
                  status: "pending",
                  due: "20 Aug 2026",
                },
              ].map((fee, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{fee.type}</p>
                    <p className="text-xs text-muted-foreground">
                      ₹{fee.amount.toLocaleString("en-IN")}
                      {fee.due && ` · Due: ${fee.due}`}
                    </p>
                  </div>
                  <Badge
                    variant={
                      fee.status === "paid"
                        ? "success"
                        : fee.due &&
                            new Date(fee.due) < new Date()
                          ? "destructive"
                          : "warning"
                    }
                  >
                    {fee.status === "paid" ? (
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                    ) : (
                      <AlertCircle className="mr-1 h-3 w-3" />
                    )}
                    {fee.status === "paid" ? "Paid" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {data.notifications.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No recent notifications
              </p>
            ) : (
              <div className="space-y-3">
                {data.notifications.slice(0, 4).map((notif) => (
                  <div
                    key={notif.id as string}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    <Bell className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{notif.title as string}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {notif.message as string}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function DashboardContent({ data }: { data: DashboardData }) {
  switch (data.role) {
    case "admin":
    case "super_admin":
      return <AdminDashboard data={data} />;
    case "faculty":
      return <FacultyDashboard data={data} />;
    default:
      return <StudentDashboard data={data} />;
  }
}
