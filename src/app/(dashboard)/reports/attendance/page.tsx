"use client";

import * as React from "react";
import {
  Download,
  FileText,
  AlertTriangle,
  Filter,
  Search,
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
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Department, Program } from "@/types";

interface ReportRow {
  student_id: string;
  roll_number: string;
  full_name: string;
  subject_id: string;
  subject_name: string;
  subject_code: string;
  total_classes: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percentage: number;
}

interface SubjectReport {
  subject_name: string;
  subject_code: string;
  total_classes: number;
  total_records: number;
  total_present: number;
  total_absent: number;
  percentage: number;
}

export default function AttendanceReportPage() {
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();

  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [programs, setPrograms] = React.useState<Program[]>([]);
  const [subjects, setSubjects] = React.useState<{ id: string; name: string; code: string }[]>([]);

  const [departmentId, setDepartmentId] = React.useState("");
  const [programId, setProgramId] = React.useState("");
  const [semester, setSemester] = React.useState("");
  const [subjectId, setSubjectId] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [reportType, setReportType] = React.useState("student_wise");
  const [threshold, setThreshold] = React.useState("75");

  const [loading, setLoading] = React.useState(false);
  const [report, setReport] = React.useState<ReportRow[]>([]);
  const [subjectReport, setSubjectReport] = React.useState<SubjectReport[]>([]);
  const [lowAttendance, setLowAttendance] = React.useState<ReportRow[]>([]);
  const [summary, setSummary] = React.useState({ total_classes: 0, avg_attendance: 0 });

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
    if (!programId || !semester) { setSubjects([]); return; }
    async function loadSubjects() {
      const { data } = await supabase
        .from("subjects")
        .select("id, name, code")
        .eq("program_id", programId)
        .eq("semester_number", parseInt(semester, 10))
        .eq("is_active", true)
        .order("name");
      if (data) setSubjects(data);
    }
    loadSubjects();
  }, [programId, semester, supabase]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("report_type", reportType);
      params.set("threshold", threshold);
      if (departmentId) params.set("department_id", departmentId);
      if (programId) params.set("program_id", programId);
      if (semester) params.set("semester", semester);
      if (subjectId) params.set("subject_id", subjectId);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);

      const res = await fetch(`/api/attendance/report?${params.toString()}`);
      const data = await res.json();

      if (data.success && data.data) {
        if (reportType === "student_wise") {
          setReport(data.data.report || []);
          setLowAttendance(data.data.low_attendance || []);
        } else {
          setSubjectReport(data.data.report || []);
        }
        setSummary(data.data.summary || { total_classes: 0, avg_attendance: 0 });
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to fetch report",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (reportType === "student_wise") {
      if (report.length === 0) {
        toast({ title: "No data", description: "No data to export", variant: "destructive" });
        return;
      }
      const headers = ["Roll No", "Name", "Subject", "Total Classes", "Present", "Absent", "Late", "Excused", "Percentage"];
      const rows = report.map((r) => [
        r.roll_number, r.full_name, r.subject_name,
        r.total_classes.toString(), r.present.toString(), r.absent.toString(),
        r.late.toString(), r.excused.toString(), `${r.percentage}%`,
      ]);
      const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(",")).join("\n");
      downloadCSV(csv, `attendance_student_report_${new Date().toISOString().split("T")[0]}.csv`);
    } else {
      if (subjectReport.length === 0) {
        toast({ title: "No data", description: "No data to export", variant: "destructive" });
        return;
      }
      const headers = ["Subject Code", "Subject Name", "Total Classes", "Total Records", "Present", "Absent", "Percentage"];
      const rows = subjectReport.map((r) => [
        r.subject_code, r.subject_name, r.total_classes.toString(),
        r.total_records.toString(), r.total_present.toString(),
        r.total_absent.toString(), `${r.percentage}%`,
      ]);
      const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(",")).join("\n");
      downloadCSV(csv, `attendance_subject_report_${new Date().toISOString().split("T")[0]}.csv`);
    }
  };

  const exportPDF = async () => {
    const { default: jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF("landscape", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Attendance Report", pageWidth / 2, 15, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, pageWidth / 2, 22, { align: "center" });

    if (reportType === "student_wise") {
      autoTable(doc, {
        startY: 28,
        head: [["Roll No", "Name", "Subject", "Total", "Present", "Absent", "Late", "OD", "%"]],
        body: report.map((r) => [
          r.roll_number, r.full_name, r.subject_name,
          r.total_classes, r.present, r.absent, r.late, r.excused, `${r.percentage}%`,
        ]),
        theme: "grid",
        headStyles: { fillColor: [30, 58, 138], fontSize: 8 },
        bodyStyles: { fontSize: 7 },
      });
    } else {
      autoTable(doc, {
        startY: 28,
        head: [["Code", "Subject", "Classes", "Records", "Present", "Absent", "%"]],
        body: subjectReport.map((r) => [
          r.subject_code, r.subject_name, r.total_classes,
          r.total_records, r.total_present, r.total_absent, `${r.percentage}%`,
        ]),
        theme: "grid",
        headStyles: { fillColor: [30, 58, 138], fontSize: 8 },
        bodyStyles: { fontSize: 7 },
      });
    }

    doc.save(`attendance_report_${new Date().toISOString().split("T")[0]}.pdf`);
    toast({ title: "PDF exported", variant: "success" });
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const semesterOptions = Array.from({ length: 8 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `Semester ${i + 1}`,
  }));

  const filteredStudentReport = report.filter((r) => {
    if (subjectId) return r.subject_id === subjectId;
    return true;
  });

  const chartData = reportType === "subject_wise"
    ? subjectReport.map((r) => ({
        name: r.subject_code,
        percentage: r.percentage,
      }))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance Reports</h1>
          <p className="text-sm text-muted-foreground">Generate and export attendance reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportPDF}>
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <Select
              label="Department"
              value={departmentId}
              onChange={(e) => { setDepartmentId(e.target.value); setProgramId(""); }}
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
              placeholder="All Departments"
            />
            <Select
              label="Program"
              value={programId}
              onChange={(e) => { setProgramId(e.target.value); }}
              options={programs
                .filter((p) => !departmentId || p.department_id === departmentId)
                .map((p) => ({ value: p.id, label: p.name }))}
              placeholder="All Programs"
            />
            <Select
              label="Semester"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              options={semesterOptions}
              placeholder="All Semesters"
            />
            <Select
              label="Subject"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              options={subjects.map((s) => ({ value: s.id, label: `${s.code} - ${s.name}` }))}
              placeholder="All Subjects"
            />
            <Input
              label="Date From"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
            <Input
              label="Date To"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
            <Select
              label="Report Type"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              options={[
                { value: "student_wise", label: "Student-wise" },
                { value: "subject_wise", label: "Subject-wise" },
              ]}
            />
            <Select
              label="Low Attendance Threshold"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              options={[
                { value: "60", label: "60%" },
                { value: "65", label: "65%" },
                { value: "70", label: "70%" },
                { value: "75", label: "75%" },
                { value: "80", label: "80%" },
              ]}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={fetchReport} disabled={loading}>
              <Search className="mr-2 h-4 w-4" />
              {loading ? "Loading..." : "Generate Report"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{summary.total_classes}</p>
            <p className="text-xs text-muted-foreground">Total Classes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{summary.avg_attendance}%</p>
            <p className="text-xs text-muted-foreground">Average Attendance</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{lowAttendance.length}</p>
            <p className="text-xs text-muted-foreground">Low Attendance Alerts</p>
          </CardContent>
        </Card>
      </div>

      {reportType === "subject_wise" && chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subject-wise Attendance Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip formatter={(value: number) => [`${value}%`, "Attendance"]} />
                  <Bar dataKey="percentage" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {reportType === "student_wise" && (
        <>
          {lowAttendance.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  Low Attendance Alerts ({lowAttendance.length} students below {threshold}%)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lowAttendance.slice(0, 20).map((r, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3">
                      <div>
                        <p className="text-sm font-medium">{r.full_name}</p>
                        <p className="text-xs text-muted-foreground">{r.roll_number} - {r.subject_name}</p>
                      </div>
                      <Badge variant="destructive">{r.percentage}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Student-wise Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Roll No</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Name</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Subject</th>
                      <th className="px-3 py-2 text-center font-medium text-muted-foreground">Total</th>
                      <th className="px-3 py-2 text-center font-medium text-muted-foreground">Present</th>
                      <th className="px-3 py-2 text-center font-medium text-muted-foreground">Absent</th>
                      <th className="px-3 py-2 text-center font-medium text-muted-foreground">Late</th>
                      <th className="px-3 py-2 text-center font-medium text-muted-foreground">OD</th>
                      <th className="px-3 py-2 text-center font-medium text-muted-foreground">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudentReport.map((r, idx) => (
                      <tr key={idx} className="border-b last:border-0">
                        <td className="px-3 py-2 font-medium text-primary">{r.roll_number}</td>
                        <td className="px-3 py-2">{r.full_name}</td>
                        <td className="px-3 py-2 text-muted-foreground">{r.subject_code}</td>
                        <td className="px-3 py-2 text-center">{r.total_classes}</td>
                        <td className="px-3 py-2 text-center text-emerald-600">{r.present}</td>
                        <td className="px-3 py-2 text-center text-red-600">{r.absent}</td>
                        <td className="px-3 py-2 text-center text-amber-600">{r.late}</td>
                        <td className="px-3 py-2 text-center text-blue-600">{r.excused}</td>
                        <td className="px-3 py-2 text-center">
                          <Badge variant={r.percentage >= 75 ? "success" : r.percentage >= 60 ? "warning" : "destructive"}>
                            {r.percentage}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredStudentReport.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {loading ? "Loading..." : "No report data. Click 'Generate Report' to fetch data."}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {reportType === "subject_wise" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subject-wise Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Code</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Subject</th>
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">Classes</th>
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">Records</th>
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">Present</th>
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">Absent</th>
                    <th className="px-3 py-2 text-center font-medium text-muted-foreground">%</th>
                  </tr>
                </thead>
                <tbody>
                  {subjectReport.map((r, idx) => (
                    <tr key={idx} className="border-b last:border-0">
                      <td className="px-3 py-2 font-medium">{r.subject_code}</td>
                      <td className="px-3 py-2">{r.subject_name}</td>
                      <td className="px-3 py-2 text-center">{r.total_classes}</td>
                      <td className="px-3 py-2 text-center">{r.total_records}</td>
                      <td className="px-3 py-2 text-center text-emerald-600">{r.total_present}</td>
                      <td className="px-3 py-2 text-center text-red-600">{r.total_absent}</td>
                      <td className="px-3 py-2 text-center">
                        <Badge variant={r.percentage >= 75 ? "success" : r.percentage >= 60 ? "warning" : "destructive"}>
                          {r.percentage}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {subjectReport.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {loading ? "Loading..." : "No report data. Click 'Generate Report' to fetch data."}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
