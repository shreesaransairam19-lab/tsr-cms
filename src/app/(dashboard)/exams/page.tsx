"use client";

import * as React from "react";
import Link from "next/link";
import {
  Calendar,
  ClipboardCheck,
  BarChart3,
  Plus,
  Clock,
  BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDate, cn } from "@/lib/utils";
import type { ExamSchedule } from "@/types";

const EXAM_TYPE_LABELS: Record<string, string> = {
  internal: "Internal Assessment",
  semester: "Semester Exam",
  practical: "Practical Exam",
  viva: "Viva",
  backlog: "Backlog Exam",
};

const EXAM_TYPE_COLORS: Record<string, string> = {
  internal: "bg-blue-100 text-blue-800",
  semester: "bg-purple-100 text-purple-800",
  practical: "bg-emerald-100 text-emerald-800",
  viva: "bg-amber-100 text-amber-800",
  backlog: "bg-red-100 text-red-800",
};

export default function ExamsPage() {
  const { role, user } = useAuth();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = React.useState(true);

  const [upcomingExams, setUpcomingExams] = React.useState<(ExamSchedule & {
    subject?: { name: string; code: string; program?: { name: string } };
    semester?: { number: number };
  })[]>([]);

  const [stats, setStats] = React.useState({
    totalExams: 0,
    upcoming: 0,
    completed: 0,
    pendingResults: 0,
  });

  React.useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const today = new Date().toISOString().split("T")[0];

        const { data: exams } = await supabase
          .from("exam_schedules")
          .select(`
            *,
            subject:subjects(name, code, program:programs(name)),
            semester:semesters(number)
          `)
          .order("exam_date", { ascending: true })
          .limit(50);

        if (exams) {
          const upcoming = exams.filter((e) => e.exam_date >= today);
          const completed = exams.filter((e) => e.exam_date < today);

          setUpcomingExams(upcoming as typeof upcomingExams);

          const { count: resultCount } = await supabase
            .from("exam_results")
            .select("*", { count: "exact", head: true });

          setStats({
            totalExams: exams.length,
            upcoming: upcoming.length,
            completed: completed.length,
            pendingResults: resultCount || 0,
          });
        }
      } catch {
        toast({ title: "Error", description: "Failed to load exam data", variant: "destructive" });
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
          <p className="text-sm text-muted-foreground">Loading exams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Examination Management</h1>
          <p className="text-sm text-muted-foreground">Manage exams, schedules, and results</p>
        </div>
        <div className="flex gap-2">
          {(role === "admin" || role === "super_admin") && (
            <Link href="/exams/schedule">
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Create Exam
              </Button>
            </Link>
          )}
          {(role === "faculty" || role === "admin" || role === "super_admin") && (
            <Link href="/exams/marks">
              <Button variant="outline" size="sm">
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Enter Marks
              </Button>
            </Link>
          )}
          <Link href="/exams/results">
            <Button variant="outline" size="sm">
              <BarChart3 className="mr-2 h-4 w-4" />
              View Results
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Exams</p>
                <p className="text-2xl font-bold">{stats.totalExams}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold">{stats.upcoming}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Results Entered</p>
                <p className="text-2xl font-bold">{stats.pendingResults}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upcoming Examinations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {upcomingExams.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No upcoming exams scheduled</p>
            ) : (
              upcomingExams.map((exam) => {
                const examDate = new Date(exam.exam_date);
                const isToday = examDate.toISOString().split("T")[0] === new Date().toISOString().split("T")[0];
                const isPast = examDate < new Date();

                return (
                  <div
                    key={exam.id}
                    className={cn(
                      "flex items-center gap-4 rounded-lg border p-4 transition-colors",
                      isToday && "border-blue-300 bg-blue-50",
                      isPast && "opacity-60"
                    )}
                  >
                    <div className="flex h-14 w-14 flex-col items-center justify-center rounded-lg bg-primary/10 text-center">
                      <span className="text-xs font-medium text-primary">
                        {examDate.toLocaleDateString("en-IN", { month: "short" })}
                      </span>
                      <span className="text-lg font-bold text-primary">
                        {examDate.getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {(exam.subject as unknown as { name: string })?.name || "Unknown Subject"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(exam.subject as unknown as { code: string })?.code || ""}
                        {" · "}
                        {exam.start_time} - {exam.end_time}
                        {exam.room_number && ` · ${exam.room_number}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={EXAM_TYPE_COLORS[exam.exam_type] || ""}>
                        {EXAM_TYPE_LABELS[exam.exam_type] || exam.exam_type}
                      </Badge>
                      <div className="text-right text-sm">
                        <p className="font-medium">{exam.max_marks}</p>
                        <p className="text-xs text-muted-foreground">marks</p>
                      </div>
                    </div>
                    {isToday && (
                      <Badge variant="default">Today</Badge>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
