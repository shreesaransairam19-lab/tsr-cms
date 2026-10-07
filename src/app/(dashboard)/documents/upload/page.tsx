"use client";

import * as React from "react";
import { Upload, FileText, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const DOC_TYPES = [
  { value: "marksheet", label: "Marksheet" },
  { value: "certificate", label: "Certificate" },
  { value: "id_card", label: "ID Card" },
  { value: "bonafide", label: "Bonafide" },
  { value: "transfer_certificate", label: "Transfer Certificate" },
  { value: "migration", label: "Migration" },
  { value: "other", label: "Other" },
];

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

interface UploadFile {
  file: File;
  title: string;
  type: string;
  description: string;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

export default function DocumentUploadPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [uploads, setUploads] = React.useState<UploadFile[]>([]);
  const [dragActive, setDragActive] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const addFiles = (files: FileList | File[]) => {
    const newUploads: UploadFile[] = [];
    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast({ title: "Invalid File", description: `${file.name} is not a supported file type`, variant: "destructive" });
        continue;
      }
      if (file.size > MAX_SIZE) {
        toast({ title: "File Too Large", description: `${file.name} exceeds 10MB limit`, variant: "destructive" });
        continue;
      }
      newUploads.push({
        file,
        title: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
        type: "other",
        description: "",
        progress: 0,
        status: "pending",
      });
    }
    setUploads((prev) => [...prev, ...newUploads]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  };

  const updateUpload = (index: number, updates: Partial<UploadFile>) => {
    setUploads((prev) => prev.map((u, i) => (i === index ? { ...u, ...updates } : u)));
  };

  const removeUpload = (index: number) => {
    setUploads((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (index: number) => {
    const upload = uploads[index];
    updateUpload(index, { status: "uploading", progress: 30 });

    try {
      const formData = new FormData();
      formData.append("file", upload.file);
      formData.append("title", upload.title);
      formData.append("type", upload.type);
      formData.append("description", upload.description);

      // Simulate progress
      updateUpload(index, { progress: 60 });

      const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
      const result = await res.json();

      if (!result.success) throw new Error(result.error);

      updateUpload(index, { status: "success", progress: 100 });
    } catch (err) {
      updateUpload(index, { status: "error", error: err instanceof Error ? err.message : "Upload failed" });
    }
  };

  const uploadAll = async () => {
    for (let i = 0; i < uploads.length; i++) {
      if (uploads[i].status === "pending") {
        await uploadFile(i);
      }
    }
    const successCount = uploads.filter((u) => u.status === "success").length;
    if (successCount > 0) {
      toast({ title: "Upload Complete", description: `${successCount} document(s) uploaded successfully`, variant: "success" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload Documents</h1>
        <p className="text-sm text-muted-foreground">Upload PDF, JPG, or PNG files (max 10MB)</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div
            className={cn(
              "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors",
              dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
              "hover:border-primary/50 hover:bg-accent/50 cursor-pointer"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium">Drag & drop files here, or click to browse</p>
            <p className="mt-1 text-xs text-muted-foreground">PDF, JPG, PNG - Max 10MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png"
            multiple
            onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
          />
        </CardContent>
      </Card>

      {uploads.length > 0 && (
        <>
          <div className="space-y-4">
            {uploads.map((upload, idx) => (
              <Card key={idx}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                      upload.status === "success" ? "bg-emerald-100" :
                      upload.status === "error" ? "bg-red-100" :
                      upload.file.type === "application/pdf" ? "bg-red-100" : "bg-blue-100"
                    )}>
                      {upload.status === "success" ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> :
                       upload.status === "error" ? <AlertCircle className="h-5 w-5 text-red-600" /> :
                       <FileText className="h-5 w-5 text-blue-600" />}
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <Input label="Title" value={upload.title} onChange={(e) => updateUpload(idx, { title: e.target.value })} disabled={upload.status !== "pending"} />
                        <Select label="Type" value={upload.type} onChange={(e) => updateUpload(idx, { type: e.target.value })} options={DOC_TYPES} disabled={upload.status !== "pending"} />
                        <Input label="Description" value={upload.description} onChange={(e) => updateUpload(idx, { description: e.target.value })} placeholder="Optional" disabled={upload.status !== "pending"} />
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">{upload.file.name} ({(upload.file.size / 1024).toFixed(1)} KB)</span>
                        {upload.status === "uploading" && (
                          <div className="flex-1">
                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${upload.progress}%` }} />
                            </div>
                          </div>
                        )}
                        {upload.status === "success" && <Badge variant="success">Uploaded</Badge>}
                        {upload.status === "error" && <Badge variant="destructive">{upload.error}</Badge>}
                      </div>
                    </div>

                    {upload.status === "pending" && (
                      <Button variant="ghost" size="icon" onClick={() => removeUpload(idx)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setUploads([])}>Clear All</Button>
            <Button onClick={uploadAll} disabled={uploads.every((u) => u.status !== "pending")}>
              <Upload className="mr-2 h-4 w-4" />
              Upload All ({uploads.filter((u) => u.status === "pending").length})
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
