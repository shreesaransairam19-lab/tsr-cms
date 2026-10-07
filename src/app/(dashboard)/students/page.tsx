"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Student, Department, Program } from "@/types";
import { DataTable, type ColumnDef } from "@/components/tables/DataTable";
import { SearchInput } from "@/components/forms/SearchInput";
import { FilterSelect } from "@/components/forms/FilterSelect";
import { StudentForm } from "@/components/forms/StudentForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { Plus, Download, Users } from "lucide-react";
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

export default function StudentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();

  const [students, setStudents] = React.useState<Student[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [departmentFilter, setDepartmentFilter] = React.useState("");
  const [programFilter, setProgramFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [batchYearFilter, setBatchYearFilter] = React.useState("");
  const [semesterFilter, setSemesterFilter] = React.useState("");
  const [sortBy, setSortBy] = React.useState<string>("created_at");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingStudent, setEditingStudent] = React.useState<Student | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [programs, setPrograms] = React.useState<Program[]>([]);

  React.useEffect(() => {
    async function loadFilters() {
      const [depts, progs] = await Promise.all([
        supabase.from("departments").select("id, name, code").eq("is_active", true).order("name"),
        supabase.from("programs").select("id, name, code, department_id").eq("is_active", true).order("name"),
      ]);
      if (depts.data) setDepartments(depts.data);
      if (progs.data) setPrograms(progs.data);
    }
    loadFilters();
  }, [supabase]);

  const fetchStudents = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("per_page", "10");
      if (search) params.set("search", search);
      if (departmentFilter) params.set("department_id", departmentFilter);
      if (programFilter) params.set("program_id", programFilter);
      if (statusFilter) params.set("is_active", statusFilter);
      if (batchYearFilter) params.set("batch_year", batchYearFilter);
      if (semesterFilter) params.set("semester", semesterFilter);
      params.set("sort_by", sortBy);
      params.set("sort_order", sortOrder);

      const res = await fetch(`/api/students?${params.toString()}`);
      const data = await res.json();

      if (data.success && data.data) {
        setStudents(data.data.items);
        setTotalPages(data.data.total_pages);
        setTotalItems(data.data.total);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load students", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [page, search, departmentFilter, programFilter, statusFilter, batchYearFilter, semesterFilter, sortBy, sortOrder, toast]);

  React.useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/students?id=${deleteId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Success", description: "Student deactivated", variant: "success" });
        fetchStudents();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const exportCSV = () => {
    if (students.length === 0) {
      toast({ title: "No data", description: "No students to export", variant: "destructive" });
      return;
    }
    const headers = ["Roll No", "Name", "Department", "Program", "Semester", "Batch", "Status"];
    const rows = students.map((s) => [
      s.roll_number,
      s.user?.full_name || "",
      s.department?.name || "",
      s.program?.name || "",
      s.semester?.toString() || "",
      s.batch_year.toString(),
      s.is_active ? "Active" : "Inactive",
    ]);

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deptFilterOptions = departments.map((d) => ({ value: d.id, label: d.name }));
  const programFilterOptions = programs
    .filter((p) => !departmentFilter || p.department_id === departmentFilter)
    .map((p) => ({ value: p.id, label: p.name }));
  const statusFilterOptions = [
    { value: "true", label: "Active" },
    { value: "false", label: "Inactive" },
  ];
  const currentYear = new Date().getFullYear();
  const batchYearFilterOptions = Array.from({ length: 6 }, (_, i) => ({
    value: String(currentYear - 5 + i),
    label: String(currentYear - 5 + i),
  }));
  const semesterFilterOptions = Array.from({ length: 8 }, (_, i) => ({
    value: String(i + 1),
    label: `Semester ${i + 1}`,
  }));

  const columns: ColumnDef<Student>[] = [
    {
      id: "roll_number",
      header: "Roll No",
      accessorKey: "roll_number",
      sortable: true,
      cell: (row) => (
        <span className="font-medium text-primary">{row.roll_number}</span>
      ),
    },
    {
      id: "name",
      header: "Name",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Avatar
            src={row.user?.avatar_url}
            fallback={row.user?.full_name || ""}
            size="sm"
          />
          <span>{row.user?.full_name || "N/A"}</span>
        </div>
      ),
    },
    {
      id: "department",
      header: "Department",
      cell: (row) => row.department?.name || "N/A",
    },
    {
      id: "program",
      header: "Program",
      cell: (row) => row.program?.name || "N/A",
    },
    {
      id: "semester",
      header: "Semester",
      accessorKey: "semester",
      sortable: true,
      cell: (row) => <span>Sem {row.semester}</span>,
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <Badge variant={row.is_active ? "success" : "destructive"}>
          {row.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditingStudent(row);
              setFormOpen(true);
            }}
          >
            Edit
          </Button>
          {row.is_active && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteId(row.id)}
            >
              Deactivate
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Students</h1>
          <p className="text-sm text-muted-foreground">
            Manage student records and information
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button size="sm" onClick={() => { setEditingStudent(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={(val) => { setSearch(val); setPage(1); }}
          placeholder="Search by name or roll number..."
          className="w-full sm:w-72"
        />
        <FilterSelect
          value={departmentFilter}
          onChange={(val) => { setDepartmentFilter(val); setProgramFilter(""); setPage(1); }}
          options={deptFilterOptions}
          placeholder="All Departments"
        />
        <FilterSelect
          value={programFilter}
          onChange={(val) => { setProgramFilter(val); setPage(1); }}
          options={programFilterOptions}
          placeholder="All Programs"
        />
        <FilterSelect
          value={statusFilter}
          onChange={(val) => { setStatusFilter(val); setPage(1); }}
          options={statusFilterOptions}
          placeholder="All Status"
        />
        <FilterSelect
          value={batchYearFilter}
          onChange={(val) => { setBatchYearFilter(val); setPage(1); }}
          options={batchYearFilterOptions}
          placeholder="All Batches"
        />
        <FilterSelect
          value={semesterFilter}
          onChange={(val) => { setSemesterFilter(val); setPage(1); }}
          options={semesterFilterOptions}
          placeholder="All Semesters"
        />
      </div>

      <DataTable
        columns={columns}
        data={students}
        isLoading={loading}
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setPage}
        onRowClick={(row) => router.push(`/students/${row.id}`)}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        keyExtractor={(row) => row.id}
        emptyTitle="No students found"
        emptyDescription="Add your first student or adjust your filters."
      />

      <StudentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        student={editingStudent}
        onSuccess={() => { fetchStudents(); setEditingStudent(null); }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate this student? They will no longer be able to log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deactivating..." : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
