"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Faculty, Department } from "@/types";
import { DataTable, type ColumnDef } from "@/components/tables/DataTable";
import { SearchInput } from "@/components/forms/SearchInput";
import { FilterSelect } from "@/components/forms/FilterSelect";
import { FacultyForm } from "@/components/forms/FacultyForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Plus, Download } from "lucide-react";
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

export default function FacultyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();

  const [faculty, setFaculty] = React.useState<Faculty[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalItems, setTotalItems] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [departmentFilter, setDepartmentFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [sortBy, setSortBy] = React.useState<string>("created_at");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingFaculty, setEditingFaculty] = React.useState<Faculty | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const [departments, setDepartments] = React.useState<Department[]>([]);

  React.useEffect(() => {
    async function loadDepts() {
      const { data } = await supabase.from("departments").select("id, name, code").eq("is_active", true).order("name");
      if (data) setDepartments(data);
    }
    loadDepts();
  }, [supabase]);

  const fetchFaculty = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("per_page", "10");
      if (search) params.set("search", search);
      if (departmentFilter) params.set("department_id", departmentFilter);
      if (statusFilter) params.set("is_active", statusFilter);
      params.set("sort_by", sortBy);
      params.set("sort_order", sortOrder);

      const res = await fetch(`/api/faculty?${params.toString()}`);
      const data = await res.json();

      if (data.success && data.data) {
        setFaculty(data.data.items);
        setTotalPages(data.data.total_pages);
        setTotalItems(data.data.total);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load faculty", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [page, search, departmentFilter, statusFilter, sortBy, sortOrder, toast]);

  React.useEffect(() => {
    fetchFaculty();
  }, [fetchFaculty]);

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
      const res = await fetch(`/api/faculty?id=${deleteId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Success", description: "Faculty deactivated", variant: "success" });
        fetchFaculty();
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
    if (faculty.length === 0) {
      toast({ title: "No data", description: "No faculty to export", variant: "destructive" });
      return;
    }
    const headers = ["Emp ID", "Name", "Department", "Designation", "Qualification", "Status"];
    const rows = faculty.map((f) => [
      f.employee_id,
      f.user?.full_name || "",
      f.department?.name || "",
      f.designation,
      f.qualification || "",
      f.is_active ? "Active" : "Inactive",
    ]);

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `faculty_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deptFilterOptions = departments.map((d) => ({ value: d.id, label: d.name }));
  const statusFilterOptions = [
    { value: "true", label: "Active" },
    { value: "false", label: "Inactive" },
  ];

  const columns: ColumnDef<Faculty>[] = [
    {
      id: "employee_id",
      header: "Emp ID",
      accessorKey: "employee_id",
      sortable: true,
      cell: (row) => (
        <span className="font-medium text-primary">{row.employee_id}</span>
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
      id: "designation",
      header: "Designation",
      accessorKey: "designation",
      sortable: true,
    },
    {
      id: "qualification",
      header: "Qualification",
      cell: (row) => row.qualification || "N/A",
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
              setEditingFaculty(row);
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
          <h1 className="text-2xl font-bold tracking-tight">Faculty</h1>
          <p className="text-sm text-muted-foreground">
            Manage faculty members and their profiles
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button size="sm" onClick={() => { setEditingFaculty(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4" />
            Add Faculty
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={(val) => { setSearch(val); setPage(1); }}
          placeholder="Search by name or employee ID..."
          className="w-full sm:w-72"
        />
        <FilterSelect
          value={departmentFilter}
          onChange={(val) => { setDepartmentFilter(val); setPage(1); }}
          options={deptFilterOptions}
          placeholder="All Departments"
        />
        <FilterSelect
          value={statusFilter}
          onChange={(val) => { setStatusFilter(val); setPage(1); }}
          options={statusFilterOptions}
          placeholder="All Status"
        />
      </div>

      <DataTable
        columns={columns}
        data={faculty}
        isLoading={loading}
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setPage}
        onRowClick={(row) => router.push(`/faculty/${row.id}`)}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        keyExtractor={(row) => row.id}
        emptyTitle="No faculty found"
        emptyDescription="Add your first faculty member or adjust your filters."
      />

      <FacultyForm
        open={formOpen}
        onOpenChange={setFormOpen}
        faculty={editingFaculty}
        onSuccess={() => { fetchFaculty(); setEditingFaculty(null); }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Faculty</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate this faculty member? They will no longer be able to log in.
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
