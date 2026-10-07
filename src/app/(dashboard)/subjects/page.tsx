"use client";

import * as React from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface Subject {
  id: string;
  program_id: string;
  semester: number;
  code: string;
  name: string;
  type: string;
  credits: number;
  lecture_hours: number;
  tutorial_hours: number;
  practical_hours: number;
  is_elective: boolean;
  is_active: boolean;
  programs?: { name: string; code: string } | null;
}

interface Program {
  id: string;
  name: string;
  code: string;
}

export default function SubjectsPage() {
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = React.useState(true);
  const [subjects, setSubjects] = React.useState<Subject[]>([]);
  const [programs, setPrograms] = React.useState<Program[]>([]);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Subject | null>(null);
  const [search, setSearch] = React.useState("");
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const emptyForm = {
    code: "", name: "", program_id: "", semester: "1", type: "theory",
    credits: "4", lecture_hours: "3", tutorial_hours: "1", practical_hours: "0",
    is_elective: false, is_active: true,
  };
  const [form, setForm] = React.useState(emptyForm);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    const [subRes, progRes] = await Promise.all([
      supabase.from("subjects").select("*, programs(name, code)").order("code"),
      supabase.from("programs").select("id, name, code").order("name"),
    ]);
    if (subRes.data) setSubjects(subRes.data as Subject[]);
    if (progRes.data) setPrograms(progRes.data as Program[]);
    setLoading(false);
  }, [supabase]);

  React.useEffect(() => { loadData(); }, [loadData]);

  const filtered = subjects.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    const body = {
      ...(editing ? { id: editing.id } : {}),
      code: form.code, name: form.name, program_id: form.program_id,
      semester: parseInt(form.semester), type: form.type,
      credits: parseInt(form.credits), lecture_hours: parseInt(form.lecture_hours),
      tutorial_hours: parseInt(form.tutorial_hours), practical_hours: parseInt(form.practical_hours),
      is_elective: form.is_elective, is_active: form.is_active,
    };
    try {
      const res = await fetch("/api/subjects", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      toast({ title: "Success", description: editing ? "Subject updated" : "Subject created", variant: "success" });
      setFormOpen(false); setEditing(null); setForm(emptyForm); loadData();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await fetch(`/api/subjects?id=${deleteId}`, { method: "DELETE" });
    const result = await res.json();
    if (!result.success) { toast({ title: "Error", description: result.error, variant: "destructive" }); return; }
    toast({ title: "Deleted", description: "Subject deleted", variant: "success" });
    setDeleteId(null); loadData();
  };

  const openEdit = (s: Subject) => {
    setEditing(s);
    setForm({
      code: s.code, name: s.name, program_id: s.program_id, semester: String(s.semester),
      type: s.type, credits: String(s.credits), lecture_hours: String(s.lecture_hours),
      tutorial_hours: String(s.tutorial_hours), practical_hours: String(s.practical_hours),
      is_elective: s.is_elective, is_active: s.is_active,
    });
    setFormOpen(true);
  };

  const typeColor = (type: string) => {
    if (type === "theory") return "bg-blue-100 text-blue-700";
    if (type === "practical") return "bg-green-100 text-green-700";
    return "bg-purple-100 text-purple-700";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subjects</h1>
          <p className="text-sm text-muted-foreground">Manage course subjects and curriculum</p>
        </div>
        <Button onClick={() => { setEditing(null); setForm(emptyForm); setFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Subject
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Input placeholder="Search by name or code..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <Badge variant="outline">{filtered.length} subjects</Badge>
      </div>

      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No subjects found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 font-medium">Code</th>
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Program</th>
                    <th className="pb-3 font-medium">Sem</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Credits</th>
                    <th className="pb-3 font-medium">L/T/P</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{s.code}</td>
                      <td className="py-3">
                        <div>{s.name}</div>
                        {s.is_elective && <span className="text-xs text-amber-600">Elective</span>}
                      </td>
                      <td className="py-3">{s.programs?.name || "\u2014"}</td>
                      <td className="py-3">{s.semester}</td>
                      <td className="py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${typeColor(s.type)}`}>
                          {s.type}
                        </span>
                      </td>
                      <td className="py-3">{s.credits}</td>
                      <td className="py-3 text-muted-foreground">{s.lecture_hours}/{s.tutorial_hours}/{s.practical_hours}</td>
                      <td className="py-3">
                        <Badge variant={s.is_active ? "success" : "secondary"}>{s.is_active ? "Active" : "Inactive"}</Badge>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeleteId(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Subject" : "Add Subject"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Code *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. CS401" />
            <Input label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Data Structures" />
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Program *</label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.program_id} onChange={(e) => setForm({ ...form, program_id: e.target.value })}>
                <option value="">Select Program</option>
                {programs.map((p) => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Semester *</label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}>
                {[1,2,3,4,5,6,7,8].map((n) => <option key={n} value={n}>Semester {n}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Type *</label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="theory">Theory</option>
                <option value="practical">Practical</option>
                <option value="lab">Lab</option>
              </select>
            </div>
            <Input label="Credits" type="number" value={form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })} />
            <Input label="Lecture Hours" type="number" value={form.lecture_hours} onChange={(e) => setForm({ ...form, lecture_hours: e.target.value })} />
            <Input label="Tutorial Hours" type="number" value={form.tutorial_hours} onChange={(e) => setForm({ ...form, tutorial_hours: e.target.value })} />
            <Input label="Practical Hours" type="number" value={form.practical_hours} onChange={(e) => setForm({ ...form, practical_hours: e.target.value })} />
            <div className="flex items-center gap-4 col-span-2 pt-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_elective} onChange={(e) => setForm({ ...form, is_elective: e.target.checked })} className="rounded" />
                Elective
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded" />
                Active
              </label>
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
          <DialogHeader><DialogTitle>Delete Subject</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to delete this subject? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
