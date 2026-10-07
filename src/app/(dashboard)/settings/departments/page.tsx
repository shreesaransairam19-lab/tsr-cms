"use client";

import * as React from "react";
import { Plus, Edit, Trash2, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Department } from "@/types";

export default function DepartmentsPage() {
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = React.useState(true);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Department | null>(null);
  const [form, setForm] = React.useState({ code: "", name: "", description: "" });
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("departments").select("*").order("name");
    if (data) setDepartments(data as Department[]);
    setLoading(false);
  }, [supabase]);

  React.useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async () => {
    const action = editing ? "update" : "create";
    const body = { action, ...(editing ? { id: editing.id } : {}), ...form };
    try {
      const res = await fetch("/api/settings/departments", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      toast({ title: "Success", description: result.message, variant: "success" });
      setFormOpen(false);
      setEditing(null);
      setForm({ code: "", name: "", description: "" });
      loadData();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await fetch("/api/settings/departments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", id: deleteId }),
    });
    const result = await res.json();
    if (!result.success) { toast({ title: "Error", description: result.error, variant: "destructive" }); return; }
    toast({ title: "Deleted", description: result.message, variant: "success" });
    setDeleteId(null);
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Departments</h1><p className="text-sm text-muted-foreground">Manage college departments</p></div>
        <Button onClick={() => { setEditing(null); setForm({ code: "", name: "", description: "" }); setFormOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Add Department</Button>
      </div>

      <Card>
        <CardContent className="p-6">
          {loading ? (
            <div className="flex h-32 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
          ) : departments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No departments found</p>
          ) : (
            <div className="space-y-2">
              {departments.map((dept) => (
                <div key={dept.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100"><Building2 className="h-5 w-5 text-blue-600" /></div>
                    <div>
                      <p className="text-sm font-medium">{dept.name} ({dept.code})</p>
                      {dept.description && <p className="text-xs text-muted-foreground">{dept.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={dept.is_active ? "success" : "secondary"}>{dept.is_active ? "Active" : "Inactive"}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => { setEditing(dept); setForm({ code: dept.code, name: dept.name, description: dept.description || "" }); setFormOpen(true); }}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(dept.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Department" : "Add Department"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input label="Code *" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g., CSE" />
            <Input label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Computer Science" />
            <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Department</DialogTitle></DialogHeader>
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
