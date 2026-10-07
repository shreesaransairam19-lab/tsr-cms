"use client";

import * as React from "react";
import { useRouter, useParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Faculty, Student, Subject } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { FacultyForm } from "@/components/forms/FacultyForm";
import { formatDate, formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  Edit,
  Printer,
  User,
  Phone,
  MapPin,
  Calendar,
  BookOpen,
  Users,
  FileText,
  GraduationCap,
  Briefcase,
} from "lucide-react";

interface EnrichedFaculty extends Faculty {
  subjects_data: (Subject & { program?: { id: string; name: string; code: string } })[];
  students_data: (Student & {
    user?: { id: string; full_name: string; email: string };
    department?: { id: string; name: string; code: string };
    program?: { id: string; name: string; code: string };
  })[];
  documents_data: Array<{
    id: string;
    title: string;
    type: string;
    file_url: string;
    created_at: string;
  }>;
}

export default function FacultyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();

  const [faculty, setFaculty] = React.useState<EnrichedFaculty | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [formOpen, setFormOpen] = React.useState(false);

  const fetchFaculty = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/faculty/${id}`);
      const data = await res.json();
      if (data.success && data.data) {
        setFaculty(data.data);
      } else {
        toast({ title: "Error", description: "Faculty not found", variant: "destructive" });
        router.push("/faculty");
      }
    } catch {
      toast({ title: "Error", description: "Failed to load faculty", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [id, toast, router]);

  React.useEffect(() => {
    fetchFaculty();
  }, [fetchFaculty]);

  const handlePrint = () => {
    window.print();
  };

  const calculateExperience = (dateOfJoining: string) => {
    const joinDate = new Date(dateOfJoining);
    const now = new Date();
    const diffMs = now.getTime() - joinDate.getTime();
    const years = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor((diffMs % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
    return `${years}y ${months}m`;
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

  if (!faculty) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/faculty")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Faculty Profile</h1>
          <p className="text-sm text-muted-foreground">
            View and manage faculty details
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
              src={faculty.user?.avatar_url}
              fallback={faculty.user?.full_name || ""}
              size="xl"
            />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">{faculty.user?.full_name || "N/A"}</h2>
                <Badge variant={faculty.is_active ? "success" : "destructive"}>
                  {faculty.is_active ? "Active" : "Inactive"}
                </Badge>
                {faculty.is_hod && (
                  <Badge variant="default">HOD</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Employee ID: <span className="font-medium text-foreground">{faculty.employee_id}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                {faculty.department?.name || "N/A"} — {faculty.designation}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 text-sm text-muted-foreground">
              <span>{faculty.qualification || "N/A"}</span>
              <span>Joined {formatDate(faculty.date_of_joining)}</span>
              <span>Experience: {calculateExperience(faculty.date_of_joining)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-1" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="classes">
            <BookOpen className="h-4 w-4 mr-1" />
            Classes
          </TabsTrigger>
          <TabsTrigger value="students">
            <Users className="h-4 w-4 mr-1" />
            Students
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
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
                  <span>{formatDate(faculty.date_of_birth)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gender</span>
                  <span className="capitalize">{faculty.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Blood Group</span>
                  <span>{faculty.blood_group || "N/A"}</span>
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
                  <span>{faculty.user?.email || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span>{faculty.phone || faculty.user?.phone || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Emergency</span>
                  <span>{faculty.emergency_contact || "N/A"}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-3 w-3 mt-0.5 text-muted-foreground shrink-0" />
                  <span>{faculty.address || "N/A"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Briefcase className="h-4 w-4" />
                  Professional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employee ID</span>
                  <span className="font-medium">{faculty.employee_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department</span>
                  <span>{faculty.department?.name || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Designation</span>
                  <span>{faculty.designation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Specialization</span>
                  <span>{faculty.specialization || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date of Joining</span>
                  <span>{formatDate(faculty.date_of_joining)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Salary</span>
                  <span>{formatCurrency(faculty.basic_salary)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <GraduationCap className="h-4 w-4" />
                  Qualifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Degree</span>
                  <span>{faculty.qualification || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Specialization</span>
                  <span>{faculty.specialization || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PAN</span>
                  <span>{faculty.pan_number || "N/A"}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="classes">
          <div className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assigned Subjects</CardTitle>
              </CardHeader>
              <CardContent>
                {!faculty.subjects_data || faculty.subjects_data.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No subjects assigned
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Code</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Subject</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Type</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Credits</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Semester</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Program</th>
                        </tr>
                      </thead>
                      <tbody>
                        {faculty.subjects_data.map((subject) => (
                          <tr key={subject.id} className="border-b last:border-0">
                            <td className="py-3 px-2 font-medium text-primary">{subject.code}</td>
                            <td className="py-3 px-2">{subject.name}</td>
                            <td className="py-3 px-2 capitalize">{subject.type}</td>
                            <td className="py-3 px-2">{subject.credits}</td>
                            <td className="py-3 px-2">Sem {subject.semester_number}</td>
                            <td className="py-3 px-2">{subject.program?.name || "N/A"}</td>
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

        <TabsContent value="students">
          <div className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Students ({faculty.students_data?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!faculty.students_data || faculty.students_data.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No students found
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Roll No</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Name</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Department</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Program</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Semester</th>
                          <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {faculty.students_data.map((student) => (
                          <tr
                            key={student.id}
                            className="border-b last:border-0 cursor-pointer hover:bg-muted/50"
                            onClick={() => router.push(`/students/${student.id}`)}
                          >
                            <td className="py-3 px-2 font-medium text-primary">{student.roll_number}</td>
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <Avatar
                                  src={student.user?.avatar_url || null}
                                  fallback={student.user?.full_name || ""}
                                  size="sm"
                                />
                                {student.user?.full_name || "N/A"}
                              </div>
                            </td>
                            <td className="py-3 px-2">{student.department?.name || "N/A"}</td>
                            <td className="py-3 px-2">{student.program?.name || "N/A"}</td>
                            <td className="py-3 px-2">Sem {student.semester}</td>
                            <td className="py-3 px-2">
                              <Badge variant={student.is_active ? "success" : "destructive"}>
                                {student.is_active ? "Active" : "Inactive"}
                              </Badge>
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
      </Tabs>

      <FacultyForm
        open={formOpen}
        onOpenChange={setFormOpen}
        faculty={faculty}
        onSuccess={() => { fetchFaculty(); setFormOpen(false); }}
      />
    </div>
  );
}
