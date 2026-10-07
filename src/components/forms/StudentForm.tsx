"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { studentFormSchema, type StudentFormInput } from "@/lib/validators/student";
import type { Student, Department, Program } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

interface StudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student | null;
  onSuccess?: () => void;
}

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const BLOOD_GROUP_OPTIONS = [
  { value: "A+", label: "A+" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B-", label: "B-" },
  { value: "AB+", label: "AB+" },
  { value: "AB-", label: "AB-" },
  { value: "O+", label: "O+" },
  { value: "O-", label: "O-" },
];

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Chandigarh", "Puducherry",
].map((s) => ({ value: s, label: s }));

export function StudentForm({ open, onOpenChange, student, onSuccess }: StudentFormProps) {
  const [step, setStep] = React.useState("personal");
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [programs, setPrograms] = React.useState<Program[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [photoUploading, setPhotoUploading] = React.useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/avatar", { method: "POST", body: fd });
      const data = await res.json();
      if (data.success) {
        form.setValue("photo_url", data.url);
        toast({ title: "Photo uploaded", variant: "success" });
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast({ title: "Upload failed", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setPhotoUploading(false);
      e.target.value = "";
    }
  };
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const isEditing = !!student;

  const nameParts = student?.user?.full_name?.split(" ") || ["", ""];
  const defaultFirstName = isEditing ? nameParts[0] : "";
  const defaultLastName = isEditing ? nameParts.slice(1).join(" ") : "";

  const form = useForm<StudentFormInput>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      first_name: defaultFirstName,
      last_name: defaultLastName,
      date_of_birth: student?.date_of_birth || "",
      gender: (student?.gender as "male" | "female" | "other") || "male",
      blood_group: student?.blood_group || "",
      nationality: student?.nationality || "",
      religion: student?.religion || "",
      community: student?.community || "",
      aadhar_number: student?.aadhar_number || "",
      photo_url: student?.photo_url || "",
      address: student?.address || "",
      city: student?.city || "",
      state: student?.state || "",
      pincode: student?.pincode || "",
      phone: student?.phone || student?.user?.phone || "",
      email: student?.user?.email || "",
      department_id: student?.department_id || "",
      program_id: student?.program_id || "",
      semester: student?.semester || 1,
      admission_date: student?.admission_date || new Date().toISOString().split("T")[0],
      batch_year: student?.batch_year || new Date().getFullYear(),
      entrance_exam_score: student?.entrance_exam_score || null,
      category: student?.category || "",
      is_hosteler: student?.is_hosteler || false,
      is_transport_user: student?.is_transport_user || false,
      father_name: student?.father_name || "",
      father_phone: student?.father_phone || "",
      father_occupation: student?.father_occupation || "",
      mother_name: student?.mother_name || "",
      mother_phone: student?.mother_phone || "",
      guardian_phone: student?.guardian_phone || "",
    },
  });

  React.useEffect(() => {
    if (open) {
      async function loadDeps() {
        const { data } = await supabase.from("departments").select("*").eq("is_active", true).order("name");
        if (data) setDepartments(data);
        if (student?.department_id) {
          const { data: progs } = await supabase
            .from("programs")
            .select("*")
            .eq("department_id", student.department_id)
            .eq("is_active", true)
            .order("name");
          if (progs) setPrograms(progs);
        }
      }
      loadDeps();

      if (!isEditing) {
        setStep("personal");
        form.reset({
          first_name: "",
          last_name: "",
          date_of_birth: "",
          gender: "male",
          blood_group: "",
          nationality: "",
          religion: "",
          community: "",
          aadhar_number: "",
          photo_url: "",
          address: "",
          city: "",
          state: "",
          pincode: "",
          phone: "",
          email: "",
          department_id: "",
          program_id: "",
          semester: 1,
          admission_date: new Date().toISOString().split("T")[0],
          batch_year: new Date().getFullYear(),
          entrance_exam_score: null,
          category: "",
          is_hosteler: false,
          is_transport_user: false,
          father_name: "",
          father_phone: "",
          father_occupation: "",
          mother_name: "",
          mother_phone: "",
          guardian_phone: "",
        });
      }
    }
  }, [open, student, isEditing, supabase, form]);

  const selectedDept = form.watch("department_id");

  React.useEffect(() => {
    if (selectedDept) {
      async function loadPrograms() {
        const { data } = await supabase
          .from("programs")
          .select("*")
          .eq("department_id", selectedDept)
          .eq("is_active", true)
          .order("name");
        if (data) setPrograms(data);
      }
      loadPrograms();
    } else {
      setPrograms([]);
    }
  }, [selectedDept, supabase]);

  const onSubmit = async (data: StudentFormInput) => {
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        nationality: data.nationality || null,
        religion: data.religion || null,
        community: data.community || null,
        aadhar_number: data.aadhar_number || null,
        blood_group: data.blood_group || null,
        photo_url: data.photo_url || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        pincode: data.pincode || null,
        father_name: data.father_name || null,
        father_phone: data.father_phone || null,
        father_occupation: data.father_occupation || null,
        mother_name: data.mother_name || null,
        mother_phone: data.mother_phone || null,
        guardian_phone: data.guardian_phone || null,
        entrance_exam_score: data.entrance_exam_score || null,
        category: data.community || null,
      };

      const url = "/api/students";
      const method = isEditing ? "PUT" : "POST";

      const body = isEditing
        ? { ...payload, id: student.id, user_id: student.user_id }
        : payload;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: isEditing ? "Student Updated" : "Student Created",
        description: isEditing
          ? "Student record has been updated successfully."
          : `Student created successfully. Roll Number: ${result.data.roll_number}`,
        variant: "success",
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const departmentOptions = departments.map((d) => ({ value: d.id, label: d.name }));
  const programOptions = programs.map((p) => ({ value: p.id, label: p.name }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Student" : "Add New Student"}</DialogTitle>
        </DialogHeader>

        <Tabs value={step} onValueChange={setStep}>
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="academic">Academic</TabsTrigger>
            <TabsTrigger value="parent">Parent</TabsTrigger>
            <TabsTrigger value="documents">Photo</TabsTrigger>
          </TabsList>

          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <TabsContent value="personal">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name *"
                  {...form.register("first_name")}
                  error={form.formState.errors.first_name?.message}
                />
                <Input
                  label="Last Name *"
                  {...form.register("last_name")}
                  error={form.formState.errors.last_name?.message}
                />
                <Input
                  label="Date of Birth *"
                  type="date"
                  {...form.register("date_of_birth")}
                  error={form.formState.errors.date_of_birth?.message}
                />
                <Select
                  label="Gender *"
                  options={GENDER_OPTIONS}
                  {...form.register("gender")}
                  error={form.formState.errors.gender?.message}
                />
                <Select
                  label="Blood Group"
                  options={BLOOD_GROUP_OPTIONS}
                  placeholder="Select blood group"
                  {...form.register("blood_group")}
                />
                <Input
                  label="Nationality"
                  {...form.register("nationality")}
                />
                <Input
                  label="Religion"
                  {...form.register("religion")}
                />
                <Input
                  label="Community / Category"
                  {...form.register("community")}
                />
                <Input
                  label="Aadhar Number"
                  {...form.register("aadhar_number")}
                />
              </div>
            </TabsContent>

            <TabsContent value="contact">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Textarea
                    label="Address"
                    {...form.register("address")}
                  />
                </div>
                <Input
                  label="City"
                  {...form.register("city")}
                />
                <Select
                  label="State"
                  options={INDIAN_STATES}
                  placeholder="Select state"
                  {...form.register("state")}
                />
                <Input
                  label="Pincode"
                  {...form.register("pincode")}
                />
                <Input
                  label="Phone *"
                  {...form.register("phone")}
                  error={form.formState.errors.phone?.message}
                />
                <div className="col-span-2">
                  <Input
                    label="Email *"
                    type="email"
                    {...form.register("email")}
                    error={form.formState.errors.email?.message}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="academic">
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Department *"
                  options={departmentOptions}
                  placeholder="Select department"
                  {...form.register("department_id")}
                  error={form.formState.errors.department_id?.message}
                />
                <Select
                  label="Program *"
                  options={programOptions}
                  placeholder={selectedDept ? "Select program" : "Select department first"}
                  {...form.register("program_id")}
                  error={form.formState.errors.program_id?.message}
                />
                <Input
                  label="Semester *"
                  type="number"
                  min={1}
                  max={12}
                  {...form.register("semester", { valueAsNumber: true })}
                  error={form.formState.errors.semester?.message}
                />
                <Input
                  label="Admission Date *"
                  type="date"
                  {...form.register("admission_date")}
                  error={form.formState.errors.admission_date?.message}
                />
                <Input
                  label="Batch Year *"
                  type="number"
                  min={2000}
                  max={2100}
                  {...form.register("batch_year", { valueAsNumber: true })}
                  error={form.formState.errors.batch_year?.message}
                />
                <Input
                  label="Entrance Exam Score"
                  type="number"
                  min={0}
                  {...form.register("entrance_exam_score", { valueAsNumber: true })}
                />
              </div>
            </TabsContent>

            <TabsContent value="parent">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Father's Name"
                  {...form.register("father_name")}
                />
                <Input
                  label="Father's Phone"
                  {...form.register("father_phone")}
                />
                <Input
                  label="Father's Occupation"
                  {...form.register("father_occupation")}
                />
                <Input
                  label="Mother's Name"
                  {...form.register("mother_name")}
                />
                <Input
                  label="Mother's Phone"
                  {...form.register("mother_phone")}
                />
                <Input
                  label="Guardian Phone"
                  {...form.register("guardian_phone")}
                />
              </div>
            </TabsContent>

            <TabsContent value="documents">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Profile Photo</label>
                  <div className="flex items-center gap-4">
                    {form.watch("photo_url") && (
                      <img
                        src={form.watch("photo_url")!}
                        alt="Preview"
                        className="h-20 w-20 rounded-full object-cover border"
                      />
                    )}
                    <label className="flex h-9 cursor-pointer items-center gap-2 rounded-md border border-dashed border-input bg-muted/50 px-4 text-sm text-muted-foreground transition-colors hover:bg-muted">
                      <Loader2 className={`h-4 w-4 ${photoUploading ? "animate-spin" : "hidden"}`} />
                      {photoUploading ? "Uploading..." : "Choose Photo"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handlePhotoUpload}
                        disabled={photoUploading}
                      />
                    </label>
                  </div>
                  {form.watch("photo_url") && (
                    <button
                      type="button"
                      className="w-fit text-xs text-destructive hover:underline"
                      onClick={() => form.setValue("photo_url", "")}
                    >
                      Remove photo
                    </button>
                  )}
                </div>
              </div>
            </TabsContent>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isEditing ? "Update Student" : "Add Student"}
              </Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
