"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Award,
  TrendingUp,
  Eye,
  CheckCircle2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
 YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { SemesterResult, ExamResult, Program } from "@/types";

interface ResultWithDetails {
  id: string;
  student_id: string;
  semester_id: string;
  sgpa: number | null;
  cgpa: number | null;
  total_marks: number | null;
  max_marks: number | null;
  percentage: number | null;
  is_passed: boolean;
  is_backlog: boolean;
  backlog_subjects: string[] | null;
  result_date: string;
  published_by: string;
  created_at: string;
  updated_at: string;
  student?: { id: string; roll_number: string; user?: { full_name: string }; program?: { name: string } };
  semester?: { number: number; academic_year?: { name: string } };
}

export default function ResultsPage() {
  const { role, user } = useAuth();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();

  const [loading, setLoading] = React.useState(true);
  const [results, setResults] = React.useState<ResultWithDetails[]>([]);
  const [programs, setPrograms] = React.useState<{ id: string; name: string }[]>([]);

  const [selectedProgram, setSelectedProgram] = React.useState("");
  const [selectedSemester, setSelectedSemester] = React.useState("");
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selectedResult, setSelectedResult] = React.useState<ResultWithDetails | null>(null);
  const [subjectResults, setSubjectResults] = React.useState<ExamResult[]>([]);

  const [publishing, setPublishing] = React.useState(false);

  React.useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: progs } = await supabase
          .from("programs")
          .select("id, name")
          .eq("is_active", true)
          .order("name");
        if (progs) setPrograms(progs);

        if (role === "student") {
          const { data: studentRecord } = await supabase
            .from("students")
            .select("id")
            .eq("user_id", user?.id)
            .single();

          if (studentRecord) {
            const { data: semResults } = await supabase
              .from("semester_results")
              .select(`
                *,
                semester:semesters(number, academic_year:academic_years(name))
              `)
              .eq("student_id", studentRecord.id)
              .order("created_at", { ascending: false });

            setResults((semResults || []) as unknown as ResultWithDetails[]);
          }
        } else {
          let query = supabase
            .from("semester_results")
            .select(`
              *,
              student:students(id, roll_number, user:users(full_name), program:programs(id, name)),
              semester:semesters(number, academic_year:academic_years(name))
            `)
            .order("created_at", { ascending: false })
            .limit(200);

          const { data } = await query;
          setResults((data || []) as unknown as ResultWithDetails[]);
        }
      } catch {
        toast({ title: "Error", description: "Failed to load results", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [role, user, supabase, toast]);

  const viewDetails = async (result: ResultWithDetails) => {
    setSelectedResult(result);

    const { data: examResults } = await supabase
      .from("exam_results")
      .select(`
        *,
        subject:subjects(name, code, credits, max_marks),
        exam_schedule:exam_schedules(exam_type, max_marks)
      `)
      .eq("student_id", result.student_id);

    setSubjectResults((examResults || []) as unknown as ExamResult[]);
    setDetailOpen(true);
  };

  const publishResults = async (result: ResultWithDetails) => {
    setPublishing(true);
    try {
      const res = await fetch("/api/exams/results", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "publish",
          student_id: result.student_id,
          semester_id: result.semester_id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast({ title: "Results Published", description: `SGPA: ${data.data.sgpa}, CGPA: ${data.data.cgpa}`, variant: "success" });
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to publish results",
        variant: "destructive",
      });
    } finally {
      setPublishing(false);
    }
  };

  const filteredResults = results.filter((r) => {
    if (selectedProgram) {
      const progId = (r.student as unknown as { program?: { id: string } })?.program?.id;
      if (progId !== selectedProgram) return false;
    }
    if (selectedSemester) {
      const semNum = r.semester?.number;
      if (semNum !== parseInt(selectedSemester, 10)) return false;
    }
    return true;
  });

  const studentCGPA = results.length > 0 ? results[0].cgpa : null;
  const studentSGPA = results.length > 0 ? results[0].sgpa : null;

  const gradeDistribution = results.reduce(
    (acc, r) => {
      if (!r.sgpa) return acc;
      if (r.sgpa >= 9) acc.O++;
      else if (r.sgpa >= 8) acc["A+"]++;
      else if (r.sgpa >= 7) acc.A++;
      else if (r.sgpa >= 6) acc["B+"]++;
      else if (r.sgpa >= 5) acc.B++;
      else if (r.sgpa >= 4) acc.C++;
      else acc.F++;
      return acc;
    },
    { O: 0, "A+": 0, A: 0, "B+": 0, B: 0, C: 0, F: 0 }
  );

  const chartData = Object.entries(gradeDistribution)
    .filter(([, count]) => count > 0)
    .map(([grade, count]) => ({ grade, count }));

  const semesterOptions = Array.from({ length: 8 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `Semester ${i + 1}`,
  }));

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  if (role === "student") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Results</h1>
          <p className="text-sm text-muted-foreground">View your examination results and CGPA</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current SGPA</p>
                  <p className="text-3xl font-bold">{studentSGPA ?? "-"}</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white text-lg font-bold">
                  {studentSGPA ?? "-"}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overall CGPA</p>
                  <p className="text-3xl font-bold">{studentCGPA ?? "-"}</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white text-lg font-bold">
                  {studentCGPA ?? "-"}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Semesters Cleared</p>
                  <p className="text-3xl font-bold">{results.filter((r) => r.is_passed).length}</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-500">
                  <Award className="h-7 w-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Semester Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="text-sm font-medium">
                      Semester {result.semester?.number || "?"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {result.semester?.academic_year?.name || ""}
                      {result.percentage && ` · ${result.percentage}%`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-bold">SGPA: {result.sgpa ?? "-"}</p>
                      <p className="text-xs text-muted-foreground">CGPA: {result.cgpa ?? "-"}</p>
                    </div>
                    <Badge variant={result.is_passed ? "success" : "destructive"}>
                      {result.is_passed ? "Pass" : "Fail"}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => viewDetails(result)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {results.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No results available yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" onOpenChange={setDetailOpen}>
            <DialogHeader>
              <DialogTitle>
                Semester {selectedResult?.semester?.number || "?"} Results
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {subjectResults.map((r, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">
                      {(r.subject as unknown as { name: string })?.name || ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(r.subject as unknown as { code: string })?.code || ""} · Credits: {(r.subject as unknown as { credits: number })?.credits || 0}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">
                      {r.marks_obtained ?? "AB"}/{(r.exam_schedule as unknown as { max_marks: number })?.max_marks || (r.subject as unknown as { max_marks: number })?.max_marks || 100}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant={r.grade === "F" || r.grade === "AB" ? "destructive" : "success"}>
                        {r.grade}
                      </Badge>
                      <span className="text-xs text-muted-foreground">GP: {r.grade_point ?? "-"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/exams">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Examination Results</h1>
          <p className="text-sm text-muted-foreground">View and manage examination results</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Results</p>
                <p className="text-2xl font-bold">{results.length}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Passed</p>
                <p className="text-2xl font-bold text-emerald-600">{results.filter((r) => r.is_passed).length}</p>
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
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">{results.filter((r) => !r.is_passed).length}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg CGPA</p>
                <p className="text-2xl font-bold">
                  {results.length > 0
                    ? (results.reduce((sum, r) => sum + (r.cgpa || 0), 0) / results.length).toFixed(2)
                    : "-"}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500">
                <Award className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label="Program"
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              options={programs.map((p) => ({ value: p.id, label: p.name }))}
              placeholder="All Programs"
            />
            <Select
              label="Semester"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              options={semesterOptions}
              placeholder="All Semesters"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Student Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Roll No</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Program</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">Sem</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">SGPA</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">CGPA</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">%</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">Status</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((result) => (
                  <tr key={result.id} className="border-b last:border-0">
                    <td className="px-3 py-2 font-medium text-primary">
                      {(result.student as unknown as { roll_number: string })?.roll_number || "-"}
                    </td>
                    <td className="px-3 py-2">
                      {(result.student as unknown as { user?: { full_name: string } })?.user?.full_name || "-"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {(result.student as unknown as { program?: { name: string } })?.program?.name || "-"}
                    </td>
                    <td className="px-3 py-2 text-center">{result.semester?.number || "-"}</td>
                    <td className="px-3 py-2 text-center font-bold">{result.sgpa ?? "-"}</td>
                    <td className="px-3 py-2 text-center font-bold">{result.cgpa ?? "-"}</td>
                    <td className="px-3 py-2 text-center">{result.percentage ?? "-"}%</td>
                    <td className="px-3 py-2 text-center">
                      <Badge variant={result.is_passed ? "success" : "destructive"}>
                        {result.is_passed ? "Pass" : "Fail"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => viewDetails(result)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(role === "admin" || role === "super_admin") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => publishResults(result)}
                            disabled={publishing}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredResults.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">No results found</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" onOpenChange={setDetailOpen}>
          <DialogHeader>
            <DialogTitle>
              Results - {selectedResult?.student?.user?.full_name || ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {subjectResults.map((r, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">
                    {(r.subject as unknown as { name: string })?.name || ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(r.subject as unknown as { code: string })?.code || ""} · {(r.exam_schedule as unknown as { exam_type: string })?.exam_type || ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">
                    {r.marks_obtained ?? "AB"}/{(r.exam_schedule as unknown as { max_marks: number })?.max_marks || (r.subject as unknown as { max_marks: number })?.max_marks || 100}
                  </p>
                  <Badge variant={r.grade === "F" || r.grade === "AB" ? "destructive" : "success"}>
                    {r.grade} ({r.grade_point ?? "-"} GP)
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
