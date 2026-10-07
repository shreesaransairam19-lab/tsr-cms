import { Suspense } from "react";
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
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardContent } from "./dashboard-content";

async function getDashboardData() {
  const supabase = await getSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role || "student";

  if (role === "admin" || role === "super_admin") {
    const [studentsCount, facultyCount, notifications] = await Promise.all([
      supabase.from("students").select("id", { count: "exact", head: true }),
      supabase.from("faculty").select("id", { count: "exact", head: true }),
      supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    return {
      role,
      stats: {
        total_students: studentsCount.count || 0,
        total_faculty: facultyCount.count || 0,
        attendance_today: 87.5,
        fee_collection: 4250000,
        fee_pending: 1250000,
      },
      notifications: notifications.data || [],
    };
  }

  if (role === "faculty") {
    const [facultyRecord, notifications] = await Promise.all([
      supabase.from("faculty").select("*").eq("user_id", user.id).single(),
      supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    return {
      role,
      faculty: facultyRecord.data,
      notifications: notifications.data || [],
    };
  }

  const [studentRecord, notifications] = await Promise.all([
    supabase.from("students").select("*").eq("user_id", user.id).single(),
    supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return {
    role,
    student: studentRecord.data,
    notifications: notifications.data || [],
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <DashboardContent data={data} />
    </Suspense>
  );
}
