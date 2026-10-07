"use client";

import * as React from "react";
import { Plus, Edit, Trash2, Eye, BookOpen } from "lucide-react";
import type { LibraryBook, Department } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/forms/SearchInput";
import { FilterSelect } from "@/components/forms/FilterSelect";
import {
  DataTable,
  type ColumnDef,
} from "@/components/tables/DataTable";
import { BookForm } from "@/components/forms/BookForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/utils";

const CATEGORIES = [
  "General",
  "Computer Science",
  "Engineering",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Electronics",
  "Mechanical",
  "Civil",
  "Reference",
];

export default function LibraryBooksPage() {
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = React.useState(true);
  const [books, setBooks] = React.useState<LibraryBook[]>([]);
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [totalItems, setTotalItems] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [departmentId, setDepartmentId] = React.useState("");
  const [formOpen, setFormOpen] = React.useState(false);
  const [editingBook, setEditingBook] = React.useState<LibraryBook | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const loadBooks = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: "10",
      });
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      if (departmentId) params.set("department_id", departmentId);

      const res = await fetch(`/api/library/books?${params}`);
      const result = await res.json();

      if (result.success && result.data) {
        setBooks(result.data.items);
        setTotalItems(result.data.total);
        setTotalPages(result.data.total_pages);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load books", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [page, search, category, departmentId, toast]);

  React.useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  React.useEffect(() => {
    supabase
      .from("departments")
      .select("id, name, code")
      .eq("is_active", true)
      .order("name")
      .then(({ data }) => {
        if (data) setDepartments(data as Department[]);
      });
  }, [supabase]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/library/books?id=${deleteId}`, { method: "DELETE" });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      toast({ title: "Book Removed", description: result.message, variant: "success" });
      setDeleteId(null);
      loadBooks();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const columns: ColumnDef<LibraryBook>[] = [
    {
      id: "title",
      header: "Title",
      cell: (row) => (
        <div className="max-w-[200px]">
          <p className="font-medium truncate">{row.title}</p>
          <p className="text-xs text-muted-foreground truncate">{row.isbn}</p>
        </div>
      ),
      sortable: true,
    },
    {
      id: "author",
      header: "Author",
      accessorKey: "author",
      sortable: true,
    },
    {
      id: "category",
      header: "Category",
      accessorKey: "category",
      cell: (row) => <Badge variant="secondary">{row.category}</Badge>,
    },
    {
      id: "availability",
      header: "Available / Total",
      cell: (row) => (
        <span className={row.available_copies === 0 ? "text-red-600 font-medium" : ""}>
          {row.available_copies} / {row.total_copies}
        </span>
      ),
    },
    {
      id: "price",
      header: "Price",
      cell: (row) => (row.price ? formatCurrency(row.price) : "-"),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <Badge variant={row.available_copies > 0 ? "success" : "destructive"}>
          {row.available_copies > 0 ? "Available" : "Issued Out"}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setEditingBook(row);
              setFormOpen(true);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteId(row.id);
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Book Catalog</h1>
          <p className="text-sm text-muted-foreground">
            Manage library books and inventory
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingBook(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Book
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">All Books</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput
                value={search}
                onChange={(v) => {
                  setSearch(v);
                  setPage(1);
                }}
                placeholder="Search title, author, ISBN..."
                className="w-[250px]"
              />
              <FilterSelect
                value={category}
                onChange={(v) => {
                  setCategory(v);
                  setPage(1);
                }}
                options={CATEGORIES.map((c) => ({ value: c, label: c }))}
                placeholder="All Categories"
              />
              <FilterSelect
                value={departmentId}
                onChange={(v) => {
                  setDepartmentId(v);
                  setPage(1);
                }}
                options={departments.map((d) => ({
                  value: d.id,
                  label: d.name,
                }))}
                placeholder="All Departments"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={books}
            isLoading={loading}
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={setPage}
            keyExtractor={(row) => row.id}
            emptyTitle="No books found"
            emptyDescription="Add books to the catalog to get started."
          />
        </CardContent>
      </Card>

      <BookForm
        open={formOpen}
        onOpenChange={setFormOpen}
        book={editingBook}
        onSuccess={() => {
          loadBooks();
          setEditingBook(null);
        }}
      />

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove this book? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
