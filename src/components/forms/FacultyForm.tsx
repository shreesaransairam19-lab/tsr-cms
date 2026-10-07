"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { facultyFormSchema, type FacultyFormInput } from "@/lib/validators/faculty";
import type { Faculty, Department } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

interface FacultyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  faculty?: Faculty | null;
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

const DESIGNATION_OPTIONS = [
  { value: "Professor", label: "Professor" },
  { value: "Associate Professor", label: "Associate Professor" },
  { value: "Assistant Professor", label: "Assistant Professor" },
  { value: "Lecturer", label: "Lecturer" },
  { value: "Lab Assistant", label: "Lab Assistant" },
  { value: "HOD", label: "Head of Department" },
  { value: "Dean", label: "Dean" },
  { value: "Director", label: "Director" },
];

const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "visiting", label: "Visiting" },
];

export function FacultyForm({ open, onOpenChange, faculty, onSuccess }: FacultyFormProps) {
  const [step, setStep] = React.useState("personal");
  const [departments, setDepartments] = React.useState<Department[]>([]);
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
  const isEditing = !!faculty;

  const nameParts = faculty?.user?.full_name?.split(" ") || ["", ""];
  const defaultFirstName = isEditing ? nameParts[0] : "";
  const defaultLastName = isEditing ? nameParts.slice(1).join(" ") : "";

  const form = useForm<FacultyFormInput>({
    resolver: zodResolver(facultyFormSchema),
    defaultValues: {
      first_name: defaultFirstName,
      last_name: defaultLastName,
      date_of_birth: faculty?.date_of_birth || "",
      gender: (faculty?.gender as "male" | "female" | "other") || "male",
      blood_group: faculty?.blood_group || "",
      phone: faculty?.phone || faculty?.user?.phone || "",
      email: faculty?.user?.email || "",
      address: faculty?.address || "",
      emergency_contact: faculty?.emergency_contact || "",
      pan_number: faculty?.pan_number || "",
      photo_url: faculty?.user?.avatar_url || "",
      department_id: faculty?.department_id || "",
      designation: faculty?.designation || "",
      qualification: faculty?.qualification || "",
      specialization: faculty?.specialization || "",
      date_of_joining: faculty?.date_of_joining || "",
      employment_type: (faculty?.employment_type as FacultyFormInput["employment_type"]) || "full_time",
      basic_salary: faculty?.basic_salary || 0,
      is_hod: faculty?.is_hod || false,
    },
  });

  React.useEffect(() => {
    if (open) {
      async function loadDeps() {
        const { data } = await supabase.from("departments").select("*").eq("is_active", true).order("name");
        if (data) setDepartments(data);
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
          phone: "",
          email: "",
          address: "",
          emergency_contact: "",
          pan_number: "",
          photo_url: "",
          department_id: "",
          designation: "",
          qualification: "",
          specialization: "",
          date_of_joining: "",
          employment_type: "full_time",
          basic_salary: 0,
          is_hod: false,
        });
      }
    }
  }, [open, faculty, isEditing, supabase, form]);

  const onSubmit = async (data: FacultyFormInput) => {
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        blood_group: data.blood_group || null,
        address: data.address || null,
        emergency_contact: data.emergency_contact || null,
        pan_number: data.pan_number || null,
        photo_url: data.photo_url || null,
        qualification: data.qualification || null,
        specialization: data.specialization || null,
      };

      const url = "/api/faculty";
      const method = isEditing ? "PUT" : "POST";

      const body = isEditing
        ? { ...payload, id: faculty.id, user_id: faculty.user_id }
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
        title: isEditing ? "Faculty Updated" : "Faculty Created",
        description: isEditing
          ? "Faculty record has been updated successfully."
          : `Faculty created successfully. Employee ID: ${result.data.employee_id}`,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Faculty" : "Add New Faculty"}</DialogTitle>
        </DialogHeader>

        <Tabs value={step} onValueChange={setStep}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="professional">Professional</TabsTrigger>
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
                  label="Phone *"
                  {...form.register("phone")}
                  error={form.formState.errors.phone?.message}
                />
                <Input
                  label="Email *"
                  type="email"
                  {...form.register("email")}
                  error={form.formState.errors.email?.message}
                />
                <Input
                  label="Emergency Contact"
                  {...form.register("emergency_contact")}
                />
                <Input
                  label="PAN Number"
                  {...form.register("pan_number")}
                />
                <div className="col-span-2">
                  <Textarea
                    label="Address"
                    {...form.register("address")}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="professional">
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Department *"
                  options={departmentOptions}
                  placeholder="Select department"
                  {...form.register("department_id")}
                  error={form.formState.errors.department_id?.message}
                />
                <Select
                  label="Designation *"
                  options={DESIGNATION_OPTIONS}
                  placeholder="Select designation"
                  {...form.register("designation")}
                  error={form.formState.errors.designation?.message}
                />
                <Input
                  label="Qualification"
                  placeholder="e.g. Ph.D., M.Tech, MCA"
                  {...form.register("qualification")}
                />
                <Input
                  label="Specialization"
                  placeholder="e.g. Computer Science"
                  {...form.register("specialization")}
                />
                <Input
                  label="Date of Joining *"
                  type="date"
                  {...form.register("date_of_joining")}
                  error={form.formState.errors.date_of_joining?.message}
                />
                <Select
                  label="Employment Type *"
                  options={EMPLOYMENT_TYPE_OPTIONS}
                  {...form.register("employment_type")}
                  error={form.formState.errors.employment_type?.message}
                />
                <Input
                  label="Basic Salary"
                  type="number"
                  min={0}
                  {...form.register("basic_salary", { valueAsNumber: true })}
                />
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      {...form.register("is_hod")}
                    />
                    Head of Department
                  </label>
                </div>
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
                {isEditing ? "Update Faculty" : "Add Faculty"}
              </Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
