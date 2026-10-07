"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Save,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/use-auth";
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
import type { Department, Program, Subject, Student, AttendanceStatus } from "@/types";

type AttendanceStatusShort = "P" | "A" | "L" | "OD";

interface StudentAttendance {
  student: Student & { user?: { full_name: string } };
  status: AttendanceStatusShort;
  remarks: string;
}

const STATUS_MAP: Record<AttendanceStatusShort, AttendanceStatus> = {
  P: "present",
  A: "absent",
  L: "late",
  OD: "excused",
};

const STATUS_CONFIG: Record<AttendanceStatusShort, { label: string; color: string; bgColor: string }> = {
  P: { label: "Present", color: "text-emerald-700", bgColor: "bg-emerald-100 hover:bg-emerald-200 border-emerald-300" },
  A: { label: "Absent", color: "text-red-700", bgColor: "bg-red-100 hover:bg-red-200 border-red-300" },
  L: { label: "Late", color: "text-amber-700", bgColor: "bg-amber-100 hover:bg-amber-200 border-amber-300" },
  OD: { label: "On Duty", color: "text-blue-700", bgColor: "bg-blue-100 hover:bg-blue-200 border-blue-300" },
};

export default function MarkAttendancePage() {
  const router = useRouter();
  const { user, role } = useAuth();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();

  const [step, setStep] = React.useState(1);
  const [saving, setSaving] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [programs, setPrograms] = React.useState<Program[]>([]);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [students, setStudents] = React.useState<Student[]>([]);

  const [selectedDept, setSelectedDept] = React.useState("");
  const [selectedProgram, setSelectedProgram] = React.useState("");
  const [selectedSemester, setSelectedSemester] = React.useState("");
  const [selectedSubject, setSelectedSubject] = React.useState("");
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = React.useState("09:00");
  const [endTime, setEndTime] = React.useState("10:00");
  const [roomNumber, setRoomNumber] = React.useState("");

  const [studentAttendance, setStudentAttendance] = React.useState<StudentAttendance[]>([]);

  React.useEffect(() => {
    if (role !== "faculty" && role !== "admin" && role !== "super_admin") {
      router.push("/attendance");
    }
  }, [role, router]);

  React.useEffect(() => {
    async function loadDepts() {
      const { data } = await supabase
        .from("departments")
        .select("id, name, code")
        .eq("is_active", true)
        .order("name");
      if (data) setDepartments(data);
    }
    loadDepts();
  }, [supabase]);

  React.useEffect(() => {
    if (!selectedDept) { setPrograms([]); return; }
    async function loadPrograms() {
      const { data } = await supabase
        .from("programs")
        .select("id, name, code, department_id, total_semesters")
        .eq("department_id", selectedDept)
        .eq("is_active", true)
        .order("name");
      if (data) setPrograms(data);
    }
    loadPrograms();
  }, [selectedDept, supabase]);

  React.useEffect(() => {
    if (!selectedProgram || !selectedSemester) { setSubjects([]); return; }
    async function loadSubjects() {
      const { data } = await supabase
        .from("subjects")
        .select("id, name, code, credits, semester_number")
        .eq("program_id", selectedProgram)
        .eq("semester_number", parseInt(selectedSemester, 10))
        .eq("is_active", true)
        .order("name");
      if (data) setSubjects(data);
    }
    loadSubjects();
  }, [selectedProgram, selectedSemester, supabase]);

  const loadStudents = React.useCallback(async () => {
    if (!selectedProgram || !selectedSemester) return;

    const { data } = await supabase
      .from("students")
      .select(`
        *,
        user:users(full_name, email)
      `)
      .eq("program_id", selectedProgram)
      .eq("semester", parseInt(selectedSemester, 10))
      .eq("is_active", true)
      .order("roll_number", { ascending: true });

    if (data) {
      setStudents(data);
      setStudentAttendance(
        data.map((s) => ({
          student: s as Student & { user?: { full_name: string } },
          status: "P" as AttendanceStatusShort,
          remarks: "",
        }))
      );
    }
  }, [selectedProgram, selectedSemester, supabase]);

  const handleLoadStudents = () => {
    if (!selectedSubject) {
      toast({ title: "Error", description: "Please select a subject", variant: "destructive" });
      return;
    }
    loadStudents();
    setStep(2);
  };

  const updateStatus = (index: number, status: AttendanceStatusShort) => {
    setStudentAttendance((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], status };
      return next;
    });
  };

  const markAllPresent = () => {
    setStudentAttendance((prev) =>
      prev.map((sa) => ({ ...sa, status: "P" as AttendanceStatusShort }))
    );
    toast({ title: "All marked present", variant: "success" });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const records = studentAttendance.map((sa) => ({
        student_id: sa.student.id,
        status: STATUS_MAP[sa.status],
        remarks: sa.remarks || null,
      }));

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_id: selectedSubject,
          date: selectedDate,
          start_time: startTime,
          end_time: endTime,
          room_number: roomNumber || null,
          records,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast({ title: "Attendance Saved", description: data.message, variant: "success" });
        router.push("/attendance");
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save attendance",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setConfirmOpen(false);
    }
  };

  const presentCount = studentAttendance.filter((sa) => sa.status === "P").length;
  const absentCount = studentAttendance.filter((sa) => sa.status === "A").length;
  const lateCount = studentAttendance.filter((sa) => sa.status === "L").length;
  const odCount = studentAttendance.filter((sa) => sa.status === "OD").length;

  const semesterOptions = Array.from({ length: 8 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `Semester ${i + 1}`,
  }));

  const programData = programs.find((p) => p.id === selectedProgram);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => step === 1 ? router.push("/attendance") : setStep(1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mark Attendance</h1>
          <p className="text-sm text-muted-foreground">
            Step {step} of 2: {step === 1 ? "Select Class Details" : "Mark Student Attendance"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
            </div>
            {s < 2 && (
              <div className={cn("h-0.5 w-12", step > s ? "bg-primary" : "bg-muted")} />
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Class Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Department"
                value={selectedDept}
                onChange={(e) => { setSelectedDept(e.target.value); setSelectedProgram(""); setSelectedSemester(""); }}
                options={departments.map((d) => ({ value: d.id, label: d.name }))}
                placeholder="Select Department"
              />
              <Select
                label="Program"
                value={selectedProgram}
                onChange={(e) => { setSelectedProgram(e.target.value); setSelectedSemester(""); }}
                options={programs.map((p) => ({ value: p.id, label: p.name }))}
                placeholder="Select Program"
                disabled={!selectedDept}
              />
              <Select
                label="Semester"
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                options={semesterOptions.slice(0, programData?.total_semesters || 8)}
                placeholder="Select Semester"
                disabled={!selectedProgram}
              />
              <Select
                label="Subject"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                options={subjects.map((s) => ({ value: s.id, label: `${s.code} - ${s.name}` }))}
                placeholder="Select Subject"
                disabled={!selectedSemester}
              />
              <Input
                label="Date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              <Input
                label="Room Number"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g., Room 301"
              />
              <Input
                label="Start Time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <Input
                label="End Time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleLoadStudents} disabled={!selectedSubject}>
                Load Students
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{studentAttendance.length}</p>
                <p className="text-xs text-muted-foreground">Total Students</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">{presentCount}</p>
                <p className="text-xs text-muted-foreground">Present</p>
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
                <p className="text-2xl font-bold text-amber-600">{lateCount}</p>
                <p className="text-xs text-muted-foreground">Late</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{odCount}</p>
                <p className="text-xs text-muted-foreground">On Duty</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Student Attendance</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={markAllPresent}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark All Present
                </Button>
                <Button
                  size="sm"
                  onClick={() => setConfirmOpen(true)}
                  disabled={saving || studentAttendance.length === 0}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Attendance
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
                      <th className="px-3 py-2 text-center font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentAttendance.map((sa, idx) => (
                      <tr key={sa.student.id} className="border-b last:border-0">
                        <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                        <td className="px-3 py-2 font-medium text-primary">{sa.student.roll_number}</td>
                        <td className="px-3 py-2">{sa.student.user?.full_name || "N/A"}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-center gap-1">
                            {(["P", "A", "L", "OD"] as AttendanceStatusShort[]).map((status) => (
                              <button
                                key={status}
                                onClick={() => updateStatus(idx, status)}
                                className={cn(
                                  "h-9 min-w-[2.5rem] rounded-md border px-2 text-xs font-semibold transition-all",
                                  sa.status === status
                                    ? STATUS_CONFIG[status].bgColor + " " + STATUS_CONFIG[status].color
                                    : "border-input bg-transparent text-muted-foreground hover:bg-muted"
                                )}
                              >
                                {status}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {studentAttendance.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">No students found</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Attendance</AlertDialogTitle>
            <AlertDialogDescription>
              Save attendance for {studentAttendance.length} students?
              Present: {presentCount}, Absent: {absentCount}, Late: {lateCount}, On Duty: {odCount}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Attendance"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


