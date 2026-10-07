"use client";

import * as React from "react";
import { Plus, Edit, Trash2, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Program, Department } from "@/types";

export default function ProgramsPage() {
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = React.useState(true);
  const [programs, setPrograms] = React.useState<(Program & { department?: Department })[]>([]);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Program | null>(null);
  const [form, setForm] = React.useState({ department_id: "", name: "", code: "", type: "undergraduate", duration_years: 4, total_semesters: 8, total_credits: 160 });
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    const [programsRes, deptsRes] = await Promise.all([
      supabase.from("programs").select("*, department:departments(id, name, code)").order("name"),
      supabase.from("departments").select("id, name, code").eq("is_active", true).order("name"),
    ]);
    if (programsRes.data) setPrograms(programsRes.data as (Program & { department?: Department })[]);
    if (deptsRes.data) setDepartments(deptsRes.data as Department[]);
    setLoading(false);
  }, [supabase]);

  React.useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async () => {
    const action = editing ? "update" : "create";
    const body = { action, ...(editing ? { id: editing.id } : {}), ...form };
    try {
      const res = await fetch("/api/settings/programs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      toast({ title: "Success", description: result.message, variant: "success" });
      setFormOpen(false); setEditing(null);
      setForm({ department_id: "", name: "", code: "", type: "undergraduate", duration_years: 4, total_semesters: 8, total_credits: 160 });
      loadData();
    } catch (err) { toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" }); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await fetch("/api/settings/programs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "delete", id: deleteId }) });
    const result = await res.json();
    if (!result.success) { toast({ title: "Error", description: result.error, variant: "destructive" }); return; }
    toast({ title: "Deleted", variant: "success" }); setDeleteId(null); loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Programs</h1><p className="text-sm text-muted-foreground">Manage academic programs</p></div>
        <Button onClick={() => { setEditing(null); setForm({ department_id: "", name: "", code: "", type: "undergraduate", duration_years: 4, total_semesters: 8, total_credits: 160 }); setFormOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Add Program</Button>
      </div>

      <Card><CardContent className="p-6">
        {loading ? (
          <div className="flex h-32 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : programs.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No programs found</p>
        ) : (
          <div className="space-y-2">
            {programs.map((prog) => (
              <div key={prog.id} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100"><BookOpen className="h-5 w-5 text-violet-600" /></div>
                  <div>
                    <p className="text-sm font-medium">{prog.name} ({prog.code})</p>
                    <p className="text-xs text-muted-foreground">{prog.department?.name} · {prog.type} · {prog.duration_years} years · {prog.total_semesters} semesters</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={prog.is_active ? "success" : "secondary"}>{prog.is_active ? "Active" : "Inactive"}</Badge>
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(prog); setForm({ department_id: prog.department_id, name: prog.name, code: prog.code, type: prog.type, duration_years: prog.duration_years, total_semesters: prog.total_semesters, total_credits: prog.total_credits }); setFormOpen(true); }}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteId(prog.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent></Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Program" : "Add Program"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select label="Department *" value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} options={departments.map((d) => ({ value: d.id, label: d.name }))} placeholder="Select department" />
            <Input label="Program Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., B.Tech Computer Science" />
            <Input label="Code *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g., BTech-CSE" />
            <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} options={[{ value: "undergraduate", label: "Undergraduate" }, { value: "postgraduate", label: "Postgraduate" }, { value: "diploma", label: "Diploma" }, { value: "phd", label: "PhD" }]} />
            <div className="grid grid-cols-3 gap-3">
              <Input label="Duration (years)" type="number" value={form.duration_years} onChange={(e) => setForm({ ...form, duration_years: parseInt(e.target.value) || 4 })} />
              <Input label="Semesters" type="number" value={form.total_semesters} onChange={(e) => setForm({ ...form, total_semesters: parseInt(e.target.value) || 8 })} />
              <Input label="Credits" type="number" value={form.total_credits} onChange={(e) => setForm({ ...form, total_credits: parseInt(e.target.value) || 160 })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Program</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
