"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Send, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import type { Department, Program, Subject, ExamSchedule, Student } from "@/types";

interface StudentMarkEntry {
  student: Student & { user?: { full_name: string } };
  marks_obtained: string;
  is_absent: boolean;
  remarks: string;
}

export default function EnterMarksPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();

  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [programs, setPrograms] = React.useState<Program[]>([]);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [examSchedules, setExamSchedules] = React.useState<ExamSchedule[]>([]);
  const [students, setStudents] = React.useState<Student[]>([]);

  const [selectedDept, setSelectedDept] = React.useState("");
  const [selectedProgram, setSelectedProgram] = React.useState("");
  const [selectedSemester, setSelectedSemester] = React.useState("");
  const [selectedSubject, setSelectedSubject] = React.useState("");
  const [selectedExam, setSelectedExam] = React.useState("");

  const [entries, setEntries] = React.useState<StudentMarkEntry[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    async function loadFilters() {
      const [depts, progs] = await Promise.all([
        supabase.from("departments").select("id, name, code").eq("is_active", true).order("name"),
        supabase.from("programs").select("id, name, code, department_id").eq("is_active", true).order("name"),
      ]);
      if (depts.data) setDepartments(depts.data);
      if (progs.data) setPrograms(progs.data);
    }
    loadFilters();
  }, [supabase]);

  React.useEffect(() => {
    if (!selectedProgram || !selectedSemester) { setSubjects([]); return; }
    async function loadSubjects() {
      const { data } = await supabase
        .from("subjects")
        .select("id, name, code, credits, max_marks")
        .eq("program_id", selectedProgram)
        .eq("semester_number", parseInt(selectedSemester, 10))
        .eq("is_active", true)
        .order("name");
      if (data) setSubjects(data);
    }
    loadSubjects();
  }, [selectedProgram, selectedSemester, supabase]);

  React.useEffect(() => {
    if (!selectedSubject || !selectedSemester) { setExamSchedules([]); return; }
    async function loadExams() {
      const { data } = await supabase
        .from("exam_schedules")
        .select("id, exam_type, exam_date, max_marks, passing_marks")
        .eq("subject_id", selectedSubject)
        .order("exam_date", { ascending: false });
      if (data) setExamSchedules(data);
    }
    loadExams();
  }, [selectedSubject, selectedSemester, supabase]);

  const loadData = async () => {
    if (!selectedSubject || !selectedProgram || !selectedSemester || !selectedExam) {
      toast({ title: "Error", description: "Please select all filters", variant: "destructive" });
      return;
    }

    try {
      const [studentsRes, existingRes] = await Promise.all([
        supabase
          .from("students")
          .select("*, user:users(full_name, email)")
          .eq("program_id", selectedProgram)
          .eq("semester", parseInt(selectedSemester, 10))
          .eq("is_active", true)
          .order("roll_number"),
        supabase
          .from("exam_results")
          .select("student_id, marks_obtained, is_absent, remarks")
          .eq("exam_schedule_id", selectedExam),
      ]);

      const studentList = studentsRes.data || [];
      setStudents(studentList as Student[]);

      const existingMap = new Map<string, { marks: number | null; absent: boolean; remarks: string | null }>();
      for (const r of existingRes.data || []) {
        existingMap.set(r.student_id, {
          marks: r.marks_obtained,
          absent: r.is_absent,
          remarks: r.remarks,
        });
      }

      setEntries(
        studentList.map((s) => {
          const existing = existingMap.get(s.id);
          return {
            student: s as Student & { user?: { full_name: string } },
            marks_obtained: existing?.marks?.toString() || "",
            is_absent: existing?.absent || false,
            remarks: existing?.remarks || "",
          };
        })
      );
      setLoaded(true);
    } catch {
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    }
  };

  const updateEntry = (index: number, field: keyof StudentMarkEntry, value: string | boolean) => {
    setEntries((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleSave = async (submitFinal: boolean) => {
    setSaving(true);
    try {
      const marks_entries = entries.map((e) => ({
        student_id: e.student.id,
        marks_obtained: e.is_absent ? null : e.marks_obtained ? parseFloat(e.marks_obtained) : null,
        is_absent: e.is_absent,
        remarks: e.remarks || null,
      }));

      const res = await fetch("/api/exams/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exam_schedule_id: selectedExam,
          marks_entries,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: submitFinal ? "Marks Submitted" : "Draft Saved",
          description: data.message || "Marks saved successfully",
          variant: "success",
        });
        if (submitFinal) {
          router.push("/exams/results");
        }
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save marks",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setConfirmOpen(false);
    }
  };

  const maxMarks = examSchedules.find((e) => e.id === selectedExam)?.max_marks || 100;

  const filledCount = entries.filter((e) => e.is_absent || e.marks_obtained !== "").length;
  const absentCount = entries.filter((e) => e.is_absent).length;
  const avgMarks = entries
    .filter((e) => !e.is_absent && e.marks_obtained !== "")
    .reduce((sum, e) => sum + parseFloat(e.marks_obtained), 0) /
    Math.max(1, entries.filter((e) => !e.is_absent && e.marks_obtained !== "").length);

  const semesterOptions = Array.from({ length: 8 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `Semester ${i + 1}`,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/exams")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Enter Marks</h1>
          <p className="text-sm text-muted-foreground">Enter marks for examination results</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Select
              label="Department"
              value={selectedDept}
              onChange={(e) => { setSelectedDept(e.target.value); setSelectedProgram(""); }}
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
              placeholder="Select Department"
            />
            <Select
              label="Program"
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              options={programs.filter((p) => !selectedDept || p.department_id === selectedDept).map((p) => ({ value: p.id, label: p.name }))}
              placeholder="Select Program"
            />
            <Select
              label="Semester"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              options={semesterOptions}
              placeholder="Select Semester"
            />
            <Select
              label="Subject"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              options={subjects.map((s) => ({ value: s.id, label: `${s.code} - ${s.name}` }))}
              placeholder="Select Subject"
            />
            <Select
              label="Exam"
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              options={examSchedules.map((e) => ({
                value: e.id,
                label: `${e.exam_type} - ${new Date(e.exam_date).toLocaleDateString("en-IN")}`,
              }))}
              placeholder="Select Exam"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={loadData} disabled={!selectedExam}>
              Load Students
            </Button>
          </div>
        </CardContent>
      </Card>

      {loaded && (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{entries.length}</p>
                <p className="text-xs text-muted-foreground">Total Students</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">{filledCount}</p>
                <p className="text-xs text-muted-foreground">Marks Entered</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{absentCount}</p>
                <p className="text-xs text-muted-foreground">Absent</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{!isNaN(avgMarks) ? avgMarks.toFixed(1) : "-"}</p>
                <p className="text-xs text-muted-foreground">Average (out of {maxMarks})</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Student Marks</CardTitle>
              <div className="flex gap-2">
                {entries.length > filledCount && (
                  <Badge variant="warning" className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {entries.length - filledCount} students pending
                  </Badge>
                )}
                <Button variant="outline" size="sm" onClick={() => handleSave(false)} disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Draft
                </Button>
                <Button size="sm" onClick={() => setConfirmOpen(true)} disabled={saving}>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Final
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">#</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Roll No</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
                      <th className="px-3 py-2 text-center font-medium text-muted-foreground">Marks (/{maxMarks})</th>
                      <th className="px-3 py-2 text-center font-medium text-muted-foreground">%</th>
                      <th className="px-3 py-2 text-center font-medium text-muted-foreground">Absent</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, idx) => {
                      const marks = entry.marks_obtained ? parseFloat(entry.marks_obtained) : 0;
                      const pct = entry.is_absent ? 0 : maxMarks > 0 ? Math.round((marks / maxMarks) * 100) : 0;

                      return (
                        <tr key={entry.student.id} className="border-b last:border-0">
                          <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                          <td className="px-3 py-2 font-medium text-primary">{entry.student.roll_number}</td>
                          <td className="px-3 py-2">{entry.student.user?.full_name || "N/A"}</td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              max={maxMarks}
                              value={entry.marks_obtained}
                              onChange={(e) => updateEntry(idx, "marks_obtained", e.target.value)}
                              disabled={entry.is_absent}
                              className={cn(
                                "w-20 rounded-md border bg-transparent px-2 py-1 text-center text-sm",
                                entry.is_absent && "opacity-50",
                                marks > maxMarks && "border-red-500"
                              )}
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            {entry.is_absent ? (
                              <span className="text-muted-foreground">-</span>
                            ) : (
                              <Badge variant={pct >= 50 ? "success" : pct >= 33 ? "warning" : "destructive"}>
                                {pct}%
                              </Badge>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={entry.is_absent}
                              onChange={(e) => {
                                updateEntry(idx, "is_absent", e.target.checked);
                                if (e.target.checked) updateEntry(idx, "marks_obtained", "");
                              }}
                              className="h-4 w-4"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={entry.remarks}
                              onChange={(e) => updateEntry(idx, "remarks", e.target.value)}
                              placeholder="-"
                              className="w-full rounded-md border bg-transparent px-2 py-1 text-sm"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Final Marks</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit the marks? This will calculate grades and SGPA.
              {entries.length - filledCount > 0 && (
                <span className="mt-2 block text-amber-600">
                  Warning: {entries.length - filledCount} students still have no marks entered.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleSave(true)} disabled={saving}>
              {saving ? "Submitting..." : "Submit Final"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
