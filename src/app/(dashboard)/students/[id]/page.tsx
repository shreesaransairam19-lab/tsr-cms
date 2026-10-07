"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Student } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { StudentForm } from "@/components/forms/StudentForm";
import { formatDate, formatCurrency, getAttendanceStatus } from "@/lib/utils";
import {
  ArrowLeft,
  Edit,
  Printer,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  BookOpen,
  CreditCard,
  FileText,
  CheckCircle,
} from "lucide-react";

interface AttendanceEntry {
  subject: string;
  attended: number;
  total: number;
  percent: number;
}

interface SemesterResultEntry {
  semester: number;
  sgpa: number | null;
  cgpa: number | null;
  total_marks: number | null;
  max_marks: number | null;
  is_passed: boolean;
  result_date: string;
}

interface FeePaymentEntry {
  id: string;
  amount_paid: number;
  payment_date: string;
  payment_method: string;
  receipt_number: string;
  status: string;
  fee_type?: string;
}

interface DocumentEntry {
  id: string;
  title: string;
  type: string;
  file_url: string;
  created_at: string;
}

interface EnrichedStudent extends Student {
  attendance_data: Array<{
    id: string;
    status: string;
    attendance_class: {
      id: string;
      date: string;
      subject: { id: string; name: string; code: string; credits: number } | null;
    } | null;
  }>;
  results_data: SemesterResultEntry[];
  fee_payments: FeePaymentEntry[];
  documents_data: DocumentEntry[];
}

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();

  const [student, setStudent] = React.useState<EnrichedStudent | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [formOpen, setFormOpen] = React.useState(false);

  const fetchStudent = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/students/${id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setStudent(data.data);
      } else {
        toast({ title: "Error", description: "Student not found", variant: "destructive" });
        router.push("/students");
      }
    } catch {
      toast({ title: "Error", description: "Failed to load student", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [id, toast, router]);

  React.useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  const computeAttendance = (attendanceData: EnrichedStudent["attendance_data"]): AttendanceEntry[] => {
    const subjectMap = new Map<string, { subject: string; attended: number; total: number }>();

    for (const record of attendanceData) {
      if (!record.attendance_class?.subject) continue;
      const subjectId = record.attendance_class.subject.id;
      const subjectName = record.attendance_class.subject.name;

      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, { subject: subjectName, attended: 0, total: 0 });
      }

      const entry = subjectMap.get(subjectId)!;
      entry.total += 1;
      if (record.status === "present" || record.status === "late") {
        entry.attended += 1;
      }
    }

    return Array.from(subjectMap.values()).map((entry) => ({
      ...entry,
      percent: entry.total > 0 ? Math.round((entry.attended / entry.total) * 100) : 0,
    }));
  };

  const computeFees = (payments: FeePaymentEntry[]) => {
    const totalPaid = payments
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + p.amount_paid, 0);
    const totalPending = payments
      .filter((p) => p.status === "pending" || p.status === "partial")
      .reduce((sum, p) => sum + p.amount_paid, 0);
    return { totalPaid, totalPending, totalFee: totalPaid + totalPending };
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (!student) return null;

  const attendance = computeAttendance(student.attendance_data || []);
  const overallAttendance = attendance.length > 0
    ? Math.round(attendance.reduce((sum, a) => sum + a.percent, 0) / attendance.length)
    : 0;
  const fees = computeFees(student.fee_payments || []);
  const attendanceStatus = getAttendanceStatus(overallAttendance);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/students")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Student Profile</h1>
          <p className="text-sm text-muted-foreground">
            View and manage student details
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print
          </Button>
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <Avatar
              src={student.user?.avatar_url}
              fallback={student.user?.full_name || ""}
              size="xl"
            />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">{student.user?.full_name || "N/A"}</h2>
                <Badge variant={student.is_active ? "success" : "destructive"}>
                  {student.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Roll No: <span className="font-medium text-foreground">{student.roll_number}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                {student.department?.name || "N/A"} — {student.program?.name || "N/A"} (Sem {student.semester})
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 text-sm text-muted-foreground">
              <span>Batch {student.batch_year}</span>
              <span>Admitted {formatDate(student.admission_date)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">
            <User className="h-4 w-4 mr-1" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="attendance">
            <CheckCircle className="h-4 w-4 mr-1" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="grades">
            <BookOpen className="h-4 w-4 mr-1" />
            Grades
          </TabsTrigger>
          <TabsTrigger value="fees">
            <CreditCard className="h-4 w-4 mr-1" />
            Fees
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-1" />
            Documents
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="h-4 w-4" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date of Birth</span>
                  <span>{student.date_of_birth ? formatDate(student.date_of_birth) : "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gender</span>
                  <span className="capitalize">{student.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Blood Group</span>
                  <span>{student.blood_group || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nationality</span>
                  <span>{student.nationality || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span>{student.category || "N/A"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Phone className="h-4 w-4" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span>{student.user?.email || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span>{student.user?.phone || "N/A"}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                  <span>{student.address || "N/A"}, {student.city || ""} {student.state || ""} {student.pincode || ""}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4" />
                  Academic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Roll Number</span>
                  <span className="font-medium">{student.roll_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department</span>
                  <span>{student.department?.name || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Program</span>
                  <span>{student.program?.name || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Semester</span>
                  <span>Sem {student.semester}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Batch Year</span>
                  <span>{student.batch_year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hosteler</span>
                  <span>{student.is_hosteler ? "Yes" : "No"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Father&apos;s Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span>{student.father_name || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span>{student.father_phone || "N/A"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Mother&apos;s Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span>{student.mother_name || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span>{student.mother_phone || "N/A"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Guardian</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span>{student.guardian_phone || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Aadhar</span>
                  <span>{student.aadhar_number || "N/A"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance">
          <div className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Overall Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold">{overallAttendance}%</div>
                  <div className={`text-sm font-medium ${attendanceStatus.color}`}>
                    {attendanceStatus.status}
                  </div>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(overallAttendance, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Subject-wise Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                {attendance.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No attendance records found
                  </p>
                ) : (
                  <div className="space-y-4">
                    {attendance.map((entry) => {
                      const status = getAttendanceStatus(entry.percent);
                      return (
                        <div key={entry.subject} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{entry.subject}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {entry.attended}/{entry.total}
                              </span>
                              <span className={`text-sm font-medium ${status.color}`}>
                                {entry.percent}%
                              </span>
                            </div>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(entry.percent, 100)}%`,
                                backgroundColor: entry.percent >= 75 ? "hsl(var(--primary))" : entry.percent >= 60 ? "hsl(38, 92%, 50%)" : "hsl(0, 84%, 60%)",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="grades">
          <div className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Semester Results</CardTitle>
              </CardHeader>
              <CardContent>
                {!student.results_data || student.results_data.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No results found
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Semester</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">SGPA</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">CGPA</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Marks</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Percentage</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {student.results_data.map((result, index) => (
                          <tr key={index} className="border-b last:border-0">
                            <td className="py-3 px-2 font-medium">Sem {result.semester || index + 1}</td>
                            <td className="py-3 px-2">{result.sgpa?.toFixed(2) || "N/A"}</td>
                            <td className="py-3 px-2">{result.cgpa?.toFixed(2) || "N/A"}</td>
                            <td className="py-3 px-2">
                              {result.total_marks && result.max_marks
                                ? `${result.total_marks}/${result.max_marks}`
                                : "N/A"}
                            </td>
                            <td className="py-3 px-2">
                              {result.total_marks && result.max_marks
                                ? `${Math.round((result.total_marks / result.max_marks) * 100)}%`
                                : "N/A"}
                            </td>
                            <td className="py-3 px-2">
                              <Badge variant={result.is_passed ? "success" : "destructive"}>
                                {result.is_passed ? "Pass" : "Fail"}
                              </Badge>
                            </td>
                            <td className="py-3 px-2 text-muted-foreground">
                              {formatDate(result.result_date)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="fees">
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Total Fee</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(fees.totalFee)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Paid</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">{formatCurrency(fees.totalPaid)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pending</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{formatCurrency(fees.totalPending)}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                {!student.fee_payments || student.fee_payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No payment records found
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Receipt</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Type</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Amount</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Method</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {student.fee_payments.map((payment) => (
                          <tr key={payment.id} className="border-b last:border-0">
                            <td className="py-3 px-2 font-medium">{payment.receipt_number}</td>
                            <td className="py-3 px-2">{payment.fee_type || "Fee"}</td>
                            <td className="py-3 px-2">{formatCurrency(payment.amount_paid)}</td>
                            <td className="py-3 px-2 capitalize">{payment.payment_method?.replace("_", " ")}</td>
                            <td className="py-3 px-2">
                              <Badge
                                variant={
                                  payment.status === "paid" ? "success"
                                    : payment.status === "partial" ? "warning"
                                      : "destructive"
                                }
                              >
                                {payment.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-2 text-muted-foreground">
                              {formatDate(payment.payment_date)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <div className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Uploaded Documents</CardTitle>
              </CardHeader>
              <CardContent>
                {!student.documents_data || student.documents_data.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No documents uploaded
                  </p>
                ) : (
                  <div className="space-y-3">
                    {student.documents_data.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{doc.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {doc.type} — {formatDate(doc.created_at)}
                            </p>
                          </div>
                        </div>
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <StudentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        student={student}
        onSuccess={() => { fetchStudent(); setFormOpen(false); }}
      />
    </div>
  );
}
