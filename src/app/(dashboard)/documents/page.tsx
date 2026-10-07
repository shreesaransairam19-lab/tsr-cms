"use client";

import * as React from "react";
import { FileText, Download, Trash2, CheckCircle2, Eye, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/forms/SearchInput";
import { FilterSelect } from "@/components/forms/FilterSelect";
import { Pagination } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { Document, DocumentType } from "@/types";

const DOC_TYPES: { value: string; label: string }[] = [
  { value: "marksheet", label: "Marksheet" },
  { value: "certificate", label: "Certificate" },
  { value: "id_card", label: "ID Card" },
  { value: "bonafide", label: "Bonafide" },
  { value: "transfer_certificate", label: "Transfer Certificate" },
  { value: "migration", label: "Migration" },
  { value: "other", label: "Other" },
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = React.useState(true);
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("");
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const loadDocuments = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), per_page: "10" });
      if (search) params.set("search", search);
      if (typeFilter) params.set("type", typeFilter);

      const res = await fetch(`/api/documents?${params}`);
      const result = await res.json();
      if (result.success && result.data) {
        setDocuments(result.data.items);
        setTotal(result.data.total);
        setTotalPages(result.data.total_pages);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load documents", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [page, search, typeFilter, toast]);

  React.useEffect(() => { loadDocuments(); }, [loadDocuments]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id: deleteId }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      toast({ title: "Deleted", description: result.message, variant: "success" });
      setDeleteId(null);
      loadDocuments();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-sm text-muted-foreground">Manage and view uploaded documents</p>
        </div>
        <a href="/documents/upload">
          <Button><FileText className="mr-2 h-4 w-4" /> Upload Document</Button>
        </a>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">All Documents ({total})</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search documents..." className="w-[220px]" />
              <FilterSelect value={typeFilter} onChange={(v) => { setTypeFilter(v); setPage(1); }} options={DOC_TYPES} placeholder="All Types" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : documents.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No documents found</p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${doc.mime_type === "application/pdf" ? "bg-red-100" : "bg-blue-100"}`}>
                      <FileText className={`h-5 w-5 ${doc.mime_type === "application/pdf" ? "text-red-600" : "text-blue-600"}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(doc.created_at)} · {formatFileSize(doc.file_size)}
                      </p>
                      {doc.student && (
                        <p className="text-xs text-muted-foreground">
                          {doc.student.user?.full_name} ({doc.student.roll_number})
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={doc.is_verified ? "success" : "secondary"}>
                      {doc.is_verified ? "Verified" : doc.type.replace("_", " ")}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => window.open(doc.file_url, "_blank")}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => {
                      const a = document.createElement("a");
                      a.href = doc.file_url;
                      a.download = doc.title;
                      a.click();
                    }}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(doc.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Document</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to delete this document?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
