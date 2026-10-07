"use client";

import * as React from "react";
import { Plus, Edit, Calendar, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import type { AcademicYear } from "@/types";

export default function AcademicYearsPage() {
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = React.useState(true);
  const [years, setYears] = React.useState<AcademicYear[]>([]);
  const [formOpen, setFormOpen] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", start_date: "", end_date: "" });

  const loadData = React.useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("academic_years").select("*").order("start_date", { ascending: false });
    if (data) setYears(data as AcademicYear[]);
    setLoading(false);
  }, [supabase]);

  React.useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async () => {
    try {
      const { data, error } = await supabase.from("academic_years").insert({
        name: form.name, start_date: form.start_date, end_date: form.end_date, is_current: false,
      }).select().single();
      if (error) throw error;
      toast({ title: "Created", description: "Academic year created", variant: "success" });
      setFormOpen(false);
      setForm({ name: "", start_date: "", end_date: "" });
      loadData();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    }
  };

  const setCurrent = async (id: string) => {
    await supabase.from("academic_years").update({ is_current: false }).neq("id", id);
    await supabase.from("academic_years").update({ is_current: true }).eq("id", id);
    toast({ title: "Updated", description: "Current academic year updated", variant: "success" });
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold tracking-tight">Academic Years</h1><p className="text-sm text-muted-foreground">Manage academic year configurations</p></div>
        <Button onClick={() => setFormOpen(true)}><Plus className="mr-2 h-4 w-4" /> Add Year</Button>
      </div>

      <Card><CardContent className="p-6">
        {loading ? (
          <div className="flex h-32 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : years.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No academic years configured</p>
        ) : (
          <div className="space-y-2">
            {years.map((year) => (
              <div key={year.id} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${year.is_current ? "bg-emerald-100" : "bg-gray-100"}`}>
                    <Calendar className={`h-5 w-5 ${year.is_current ? "text-emerald-600" : "text-gray-600"}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{year.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(year.start_date)} → {formatDate(year.end_date)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {year.is_current && <Badge variant="success"><CheckCircle2 className="mr-1 h-3 w-3" /> Current</Badge>}
                  {!year.is_current && <Button variant="outline" size="sm" onClick={() => setCurrent(year.id)}>Set Current</Button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent></Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Academic Year</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., 2025-2026" />
            <Input label="Start Date *" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            <Input label="End Date *" type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
