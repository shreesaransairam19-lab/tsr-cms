"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Calendar, Clock, MapPin, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDate, cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { Department, Program, Subject, ExamType } from "@/types";

const EXAM_TYPES: { value: ExamType; label: string }[] = [
  { value: "internal", label: "Internal Assessment" },
  { value: "semester", label: "Semester Exam" },
  { value: "practical", label: "Practical Exam" },
  { value: "viva", label: "Viva" },
  { value: "backlog", label: "Backlog Exam" },
];

interface ExamScheduleItem {
  id: string;
  subject_id: string;
  semester_id: string;
  exam_type: ExamType;
  exam_date: string;
  start_time: string;
  end_time: string;
  room_number: string | null;
  max_marks: number;
  passing_marks: number;
  instructions: string | null;
  subject?: { name: string; code: string };
  semester?: { number: number };
}

export default function ExamSchedulePage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();

  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [programs, setPrograms] = React.useState<Program[]>([]);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [semesters, setSemesters] = React.useState<{ id: string; number: number }[]>([]);
  const [exams, setExams] = React.useState<ExamScheduleItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [formOpen, setFormOpen] = React.useState(false);

  const [selectedDept, setSelectedDept] = React.useState("");
  const [selectedProgram, setSelectedProgram] = React.useState("");
  const [selectedSemester, setSelectedSemester] = React.useState("");
  const [selectedSubject, setSelectedSubject] = React.useState("");

  const [formData, setFormData] = React.useState({
    exam_type: "internal" as ExamType,
    exam_date: "",
    start_time: "09:00",
    end_time: "11:00",
    room_number: "",
    max_marks: "100",
    passing_marks: "40",
    instructions: "",
  });

  React.useEffect(() => {
    async function loadFilters() {
      const [depts, progs] = await Promise.all([
        supabase.from("departments").select("id, name, code").eq("is_active", true).order("name"),
        supabase.from("programs").select("id, name, code, department_id, total_semesters").eq("is_active", true).order("name"),
      ]);
      if (depts.data) setDepartments(depts.data);
      if (progs.data) setPrograms(progs.data);
    }
    loadFilters();
  }, [supabase]);

  React.useEffect(() => {
    if (!selectedProgram) { setSemesters([]); return; }
    const prog = programs.find((p) => p.id === selectedProgram);
    const count = prog?.total_semesters || 8;
    setSemesters(Array.from({ length: count }, (_, i) => ({ id: `sem_${i + 1}`, number: i + 1 })));
  }, [selectedProgram, programs]);

  React.useEffect(() => {
    if (!selectedProgram || !selectedSemester) { setSubjects([]); return; }
    async function loadSubjects() {
      const { data } = await supabase
        .from("subjects")
        .select("id, name, code, credits")
        .eq("program_id", selectedProgram)
        .eq("semester_number", parseInt(selectedSemester, 10))
        .eq("is_active", true)
        .order("name");
      if (data) setSubjects(data);
    }
    loadSubjects();
  }, [selectedProgram, selectedSemester, supabase]);

  const loadExams = React.useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("exam_schedules")
        .select(`
          *,
          subject:subjects(name, code),
          semester:semesters(number)
        `)
        .order("exam_date", { ascending: true });

      if (selectedSubject) query = query.eq("subject_id", selectedSubject);

      const { data } = await query;
      if (data) setExams(data as unknown as ExamScheduleItem[]);
    } catch {
      toast({ title: "Error", description: "Failed to load exams", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [selectedSubject, supabase, toast]);

  React.useEffect(() => { loadExams(); }, [loadExams]);

  const openCreateForm = () => {
    if (!selectedSubject) {
      toast({ title: "Error", description: "Please select a subject first", variant: "destructive" });
      return;
    }
    setFormOpen(true);
  };

  const handleCreate = async () => {
    if (!formData.exam_date || !formData.start_time || !formData.end_time) {
      toast({ title: "Error", description: "Date and time are required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_id: selectedSubject,
          semester_id: semesters.find((s) => s.number === parseInt(selectedSemester, 10))?.id || "",
          exam_type: formData.exam_type,
          exam_date: formData.exam_date,
          start_time: formData.start_time,
          end_time: formData.end_time,
          room_number: formData.room_number || null,
          max_marks: parseInt(formData.max_marks, 10),
          passing_marks: parseInt(formData.passing_marks, 10),
          instructions: formData.instructions || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast({ title: "Success", description: "Exam scheduled successfully", variant: "success" });
        setFormOpen(false);
        setFormData({
          exam_type: "internal", exam_date: "", start_time: "09:00", end_time: "11:00",
          room_number: "", max_marks: "100", passing_marks: "40", instructions: "",
        });
        loadExams();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create exam",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const semesterOptions = Array.from({ length: 8 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `Semester ${i + 1}`,
  }));

  const examTypeColors: Record<string, string> = {
    internal: "bg-blue-100 text-blue-800",
    semester: "bg-purple-100 text-purple-800",
    practical: "bg-emerald-100 text-emerald-800",
    viva: "bg-amber-100 text-amber-800",
    backlog: "bg-red-100 text-red-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/exams")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Exam Schedule</h1>
          <p className="text-sm text-muted-foreground">Create and manage examination schedules</p>
        </div>
        <Button onClick={openCreateForm}>
          <Plus className="mr-2 h-4 w-4" />
          Create Exam
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 sm:grid-cols-4">
            <Select
              label="Department"
              value={selectedDept}
              onChange={(e) => { setSelectedDept(e.target.value); setSelectedProgram(""); }}
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
              placeholder="All Departments"
            />
            <Select
              label="Program"
              value={selectedProgram}
              onChange={(e) => { setSelectedProgram(e.target.value); }}
              options={programs.filter((p) => !selectedDept || p.department_id === selectedDept).map((p) => ({ value: p.id, label: p.name }))}
              placeholder="All Programs"
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
              placeholder="All Subjects"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scheduled Examinations</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : exams.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No exams scheduled</p>
          ) : (
            <div className="space-y-3">
              {exams.map((exam) => {
                const examDate = new Date(exam.exam_date);
                return (
                  <div key={exam.id} className="flex items-center gap-4 rounded-lg border p-4">
                    <div className="flex h-14 w-14 flex-col items-center justify-center rounded-lg bg-primary/10 text-center">
                      <span className="text-xs font-medium text-primary">
                        {examDate.toLocaleDateString("en-IN", { month: "short" })}
                      </span>
                      <span className="text-lg font-bold text-primary">{examDate.getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        {exam.subject?.name || "Unknown"} ({exam.subject?.code || ""})
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {exam.start_time} - {exam.end_time}
                        </span>
                        {exam.room_number && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {exam.room_number}
                          </span>
                        )}
                        <span>Sem {exam.semester?.number || "?"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={examTypeColors[exam.exam_type] || ""}>
                        {EXAM_TYPES.find((t) => t.value === exam.exam_type)?.label || exam.exam_type}
                      </Badge>
                      <div className="text-right text-sm">
                        <p className="font-medium">{exam.max_marks}</p>
                        <p className="text-xs text-muted-foreground">Max Marks</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg" onOpenChange={setFormOpen}>
          <DialogHeader>
            <DialogTitle>Create Exam Schedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select
              label="Exam Type"
              value={formData.exam_type}
              onChange={(e) => setFormData({ ...formData, exam_type: e.target.value as ExamType })}
              options={EXAM_TYPES}
            />
            <Input
              label="Exam Date"
              type="date"
              value={formData.exam_date}
              onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              />
              <Input
                label="End Time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              />
            </div>
            <Input
              label="Room Number"
              value={formData.room_number}
              onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
              placeholder="e.g., Hall A-101"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Max Marks"
                type="number"
                value={formData.max_marks}
                onChange={(e) => setFormData({ ...formData, max_marks: e.target.value })}
              />
              <Input
                label="Passing Marks"
                type="number"
                value={formData.passing_marks}
                onChange={(e) => setFormData({ ...formData, passing_marks: e.target.value })}
              />
            </div>
            <Textarea
              label="Instructions"
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="Optional instructions for the exam..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? "Creating..." : "Create Exam"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
