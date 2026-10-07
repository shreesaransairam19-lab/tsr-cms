"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Edit, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import type { Department, Program, FeeStructure } from "@/types";

const FEE_TYPES = [
  { value: "tuition", label: "Tuition Fee" },
  { value: "lab", label: "Lab Fee" },
  { value: "library", label: "Library Fee" },
  { value: "exam", label: "Exam Fee" },
  { value: "hostel", label: "Hostel Fee" },
  { value: "transport", label: "Transport Fee" },
  { value: "other", label: "Other" },
];

interface FeeStructureItem {
  id: string;
  program_id: string;
  academic_year_id: string;
  semester_number: number;
  fee_type: string;
  amount: number;
  due_date: string;
  late_fee_per_day: number;
  is_mandatory: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
  program?: { name: string; code: string; department?: { name: string } };
  academic_year?: { name: string };
}

export default function FeeStructurePage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();

  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [programs, setPrograms] = React.useState<Program[]>([]);
  const [academicYears, setAcademicYears] = React.useState<{ id: string; name: string; is_current: boolean }[]>([]);
  const [structures, setStructures] = React.useState<FeeStructureItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState({
    program_id: "",
    academic_year_id: "",
    semester_number: "",
    fee_type: "tuition",
    amount: "",
    due_date: "",
    late_fee_per_day: "0",
    is_mandatory: "true",
    description: "",
  });

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [depts, progs, years, structs] = await Promise.all([
        supabase.from("departments").select("id, name, code").eq("is_active", true).order("name"),
        supabase.from("programs").select("id, name, code, department_id").eq("is_active", true).order("name"),
        supabase.from("academic_years").select("id, name, is_current").order("start_date", { ascending: false }),
        supabase
          .from("fee_structures")
          .select(`
            *,
            program:programs(name, code, department:departments(name)),
            academic_year:academic_years(name)
          `)
          .order("created_at", { ascending: false }),
      ]);

      if (depts.data) setDepartments(depts.data);
      if (progs.data) setPrograms(progs.data);
      if (years.data) setAcademicYears(years.data);
      if (structs.data) setStructures(structs.data as unknown as FeeStructureItem[]);
    } catch {
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const openCreateForm = () => {
    setEditingId(null);
    setFormData({
      program_id: "",
      academic_year_id: academicYears.find((y) => y.is_current)?.id || "",
      semester_number: "",
      fee_type: "tuition",
      amount: "",
      due_date: "",
      late_fee_per_day: "0",
      is_mandatory: "true",
      description: "",
    });
    setFormOpen(true);
  };

  const openEditForm = (structure: FeeStructureItem) => {
    setEditingId(structure.id);
    setFormData({
      program_id: structure.program_id,
      academic_year_id: structure.academic_year_id,
      semester_number: structure.semester_number.toString(),
      fee_type: structure.fee_type,
      amount: structure.amount.toString(),
      due_date: structure.due_date,
      late_fee_per_day: structure.late_fee_per_day.toString(),
      is_mandatory: structure.is_mandatory.toString(),
      description: structure.description || "",
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formData.program_id || !formData.academic_year_id || !formData.semester_number || !formData.amount || !formData.due_date) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const body = {
        program_id: formData.program_id,
        academic_year_id: formData.academic_year_id,
        semester_number: parseInt(formData.semester_number, 10),
        fee_type: formData.fee_type,
        amount: parseFloat(formData.amount),
        due_date: formData.due_date,
        late_fee_per_day: parseFloat(formData.late_fee_per_day) || 0,
        is_mandatory: formData.is_mandatory === "true",
        description: formData.description || null,
      };

      const url = "/api/fees/structure";
      const method = editingId ? "PUT" : "POST";
      const bodyToSend = editingId ? { id: editingId, ...body } : body;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyToSend),
      });

      const data = await res.json();

      if (data.success) {
        toast({ title: "Success", description: data.message, variant: "success" });
        setFormOpen(false);
        loadData();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/fees/structure?id=${deleteId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Deleted", description: "Fee structure deleted", variant: "success" });
        loadData();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setDeleteId(null);
    }
  };

  const semesterOptions = Array.from({ length: 8 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `Semester ${i + 1}`,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/fees")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Fee Structure</h1>
          <p className="text-sm text-muted-foreground">Create and manage fee structures per program</p>
        </div>
        <Button onClick={openCreateForm}>
          <Plus className="mr-2 h-4 w-4" />
          Add Fee Structure
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Program</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Year</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">Sem</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Fee Type</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Amount</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Due Date</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Late Fee/Day</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">Mandatory</th>
                  <th className="px-3 py-2 text-center font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {structures.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="px-3 py-2">
                      <p className="font-medium">{(s.program as unknown as { name: string })?.name || "N/A"}</p>
                      <p className="text-xs text-muted-foreground">
                        {(s.program as unknown as { department?: { name: string } })?.department?.name || ""}
                      </p>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {(s.academic_year as unknown as { name: string })?.name || "N/A"}
                    </td>
                    <td className="px-3 py-2 text-center">{s.semester_number}</td>
                    <td className="px-3 py-2">
                      <Badge variant="secondary" className="capitalize">{s.fee_type}</Badge>
                    </td>
                    <td className="px-3 py-2 text-right font-medium">{formatCurrency(s.amount)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{formatDate(s.due_date)}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      {s.late_fee_per_day > 0 ? formatCurrency(s.late_fee_per_day) : "-"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Badge variant={s.is_mandatory ? "destructive" : "outline"}>
                        {s.is_mandatory ? "Yes" : "No"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditForm(s)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setDeleteId(s.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {structures.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                      {loading ? "Loading..." : "No fee structures found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg" onOpenChange={setFormOpen}>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Create"} Fee Structure</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select
              label="Program *"
              value={formData.program_id}
              onChange={(e) => setFormData({ ...formData, program_id: e.target.value })}
              options={programs.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` }))}
              placeholder="Select Program"
            />
            <Select
              label="Academic Year *"
              value={formData.academic_year_id}
              onChange={(e) => setFormData({ ...formData, academic_year_id: e.target.value })}
              options={academicYears.map((y) => ({ value: y.id, label: y.name + (y.is_current ? " (Current)" : "") }))}
              placeholder="Select Year"
            />
            <Select
              label="Semester *"
              value={formData.semester_number}
              onChange={(e) => setFormData({ ...formData, semester_number: e.target.value })}
              options={semesterOptions}
              placeholder="Select Semester"
            />
            <Select
              label="Fee Type *"
              value={formData.fee_type}
              onChange={(e) => setFormData({ ...formData, fee_type: e.target.value })}
              options={FEE_TYPES}
            />
            <Input
              label="Amount (₹) *"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
            <Input
              label="Due Date *"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
            <Input
              label="Late Fee Per Day (₹)"
              type="number"
              value={formData.late_fee_per_day}
              onChange={(e) => setFormData({ ...formData, late_fee_per_day: e.target.value })}
            />
            <Select
              label="Mandatory"
              value={formData.is_mandatory}
              onChange={(e) => setFormData({ ...formData, is_mandatory: e.target.value })}
              options={[
                { value: "true", label: "Yes" },
                { value: "false", label: "No" },
              ]}
            />
            <Textarea
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Fee Structure</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this fee structure? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
