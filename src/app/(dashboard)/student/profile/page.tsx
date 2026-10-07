"use client";

import * as React from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  BookOpen,
  Contact,
  Droplet,
  GraduationCap,
  Home,
  Bus,
  Library,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";

interface StudentProfile {
  id: string;
  roll_number: string;
  full_name: string;
  email: string;
  phone: string | null;
  gender: string | null;
  blood_group: string | null;
  date_of_birth: string | null;
  address: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  admission_year: number | null;
  semester: number;
  department_name: string | null;
  program_name: string | null;
  program_code: string | null;
}

export default function StudentProfilePage() {
  const { user } = useAuth();
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<StudentProfile | null>(null);

  React.useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("students")
          .select(
            "id, roll_number, full_name, email, phone, gender, blood_group, date_of_birth, address, guardian_name, guardian_phone, admission_year, semester, department:departments(name), program:programs(name, code)"
          )
          .eq("user_id", user?.id)
          .single();

        if (data) {
          setProfile({
            id: data.id,
            roll_number: data.roll_number,
            full_name: data.full_name,
            email: data.email,
            phone: data.phone,
            gender: data.gender,
            blood_group: data.blood_group,
            date_of_birth: data.date_of_birth,
            address: data.address,
            guardian_name: data.guardian_name,
            guardian_phone: data.guardian_phone,
            admission_year: data.admission_year,
            semester: data.semester,
            department_name: data.department?.name ?? null,
            program_name: data.program?.name ?? null,
            program_code: data.program?.code ?? null,
          });
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, supabase]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
          <p className="text-sm text-muted-foreground">Your student profile</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No student record found. Please contact the admin.
          </CardContent>
        </Card>
      </div>
    );
  }

  const infoItems = [
    { icon: Mail, label: "Email", value: profile.email },
    { icon: Phone, label: "Phone", value: profile.phone || "—" },
    { icon: Contact, label: "Roll Number", value: profile.roll_number },
    { icon: Calendar, label: "Date of Birth", value: profile.date_of_birth ? formatDate(profile.date_of_birth) : "—" },
    { icon: Droplet, label: "Blood Group", value: profile.blood_group || "—" },
    { icon: User, label: "Gender", value: profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : "—" },
    { icon: MapPin, label: "Address", value: profile.address || "—" },
    { icon: GraduationCap, label: "Guardian", value: profile.guardian_name ? `${profile.guardian_name} (${profile.guardian_phone || "—"})` : "—" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground">Your personal and academic information</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <Avatar src={undefined} fallback={profile.full_name} size="lg" />
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-semibold">{profile.full_name}</h2>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                <Badge variant="outline">{profile.roll_number}</Badge>
                <Badge variant="secondary">{profile.program_name || "—"}</Badge>
                <Badge variant="secondary">Semester {profile.semester}</Badge>
                {profile.department_name && <Badge variant="secondary">{profile.department_name}</Badge>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" /> Personal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {infoItems.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium">{item.value}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="h-4 w-4" /> Academic Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Program</p>
                <p className="text-sm font-medium">{profile.program_name || "—"} ({profile.program_code || "—"})</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <Home className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="text-sm font-medium">{profile.department_name || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Admission Year</p>
                <p className="text-sm font-medium">{profile.admission_year || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Current Semester</p>
                <p className="text-sm font-medium">{profile.semester}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Bus className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Transport</p>
              <p className="text-xs text-muted-foreground"><a href="/student/transport" className="text-primary underline">View details</a></p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <Home className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Hostel</p>
              <p className="text-xs text-muted-foreground"><a href="/student/hostel" className="text-primary underline">View details</a></p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <Library className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-medium">Library</p>
              <p className="text-xs text-muted-foreground"><a href="/library" className="text-primary underline">View details</a></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
