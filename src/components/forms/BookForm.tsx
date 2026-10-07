"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { LibraryBook, Department } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

const bookSchema = z.object({
  isbn: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  publisher: z.string().optional(),
  edition: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  department_id: z.string().optional(),
  total_copies: z.coerce.number().min(1, "At least 1 copy required"),
  rack_number: z.string().optional(),
  price: z.coerce.number().optional(),
});

type BookFormInput = z.infer<typeof bookSchema>;

interface BookFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  book?: LibraryBook | null;
  onSuccess?: () => void;
}

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
  "Fiction",
  "Non-Fiction",
  "Textbook",
  "Journal",
  "Magazine",
];

export function BookForm({ open, onOpenChange, book, onSuccess }: BookFormProps) {
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const isEditing = !!book;

  React.useEffect(() => {
    if (open) {
      supabase
        .from("departments")
        .select("id, name, code")
        .eq("is_active", true)
        .order("name")
        .then(({ data }) => {
          if (data) setDepartments(data as Department[]);
        });
    }
  }, [open, supabase]);

  const form = useForm<BookFormInput>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      isbn: book?.isbn || "",
      title: book?.title || "",
      author: book?.author || "",
      publisher: book?.publisher || "",
      edition: book?.edition || "",
      category: book?.category || "General",
      department_id: book?.department_id || "",
      total_copies: book?.total_copies || 1,
      rack_number: book?.rack_number || "",
      price: book?.price || undefined,
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        isbn: book?.isbn || "",
        title: book?.title || "",
        author: book?.author || "",
        publisher: book?.publisher || "",
        edition: book?.edition || "",
        category: book?.category || "General",
        department_id: book?.department_id || "",
        total_copies: book?.total_copies || 1,
        rack_number: book?.rack_number || "",
        price: book?.price || undefined,
      });
    }
  }, [open, book, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    setSubmitting(true);
    try {
      const payload = {
        ...(isEditing ? { id: book!.id } : {}),
        ...data,
        department_id: data.department_id || null,
        price: data.price || null,
      };

      const url = "/api/library/books";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: isEditing ? "Book Updated" : "Book Added",
        description: result.message,
        variant: "success",
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save book",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Book" : "Add New Book"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="ISBN"
              placeholder="978-0-000-00000-0"
              error={form.formState.errors.isbn?.message}
              {...form.register("isbn")}
            />
            <Input
              label="Title *"
              placeholder="Book title"
              error={form.formState.errors.title?.message}
              {...form.register("title")}
            />
            <Input
              label="Author *"
              placeholder="Author name"
              error={form.formState.errors.author?.message}
              {...form.register("author")}
            />
            <Input
              label="Publisher"
              placeholder="Publisher name"
              {...form.register("publisher")}
            />
            <Input
              label="Edition"
              placeholder="e.g., 3rd Edition"
              {...form.register("edition")}
            />
            <Select
              label="Category *"
              options={CATEGORIES.map((c) => ({ value: c, label: c }))}
              placeholder="Select category"
              error={form.formState.errors.category?.message}
              {...form.register("category")}
            />
            <Select
              label="Department"
              options={departments.map((d) => ({
                value: d.id,
                label: `${d.code} - ${d.name}`,
              }))}
              placeholder="Select department"
              {...form.register("department_id")}
            />
            <Input
              label="Total Copies *"
              type="number"
              min={1}
              error={form.formState.errors.total_copies?.message}
              {...form.register("total_copies")}
            />
            <Input
              label="Rack Number"
              placeholder="e.g., A-12"
              {...form.register("rack_number")}
            />
            <Input
              label="Price (₹)"
              type="number"
              min={0}
              placeholder="0"
              {...form.register("price")}
            />
          </div>

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
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update Book" : "Add Book"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
