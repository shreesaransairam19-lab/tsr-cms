"use client";

import * as React from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const FIELD_MAPPINGS: Record<string, { label: string; sheetFields: string[]; dbFields: string[] }> = {
  students: {
    label: "Students",
    sheetFields: ["Full Name", "Roll Number", "Email", "Phone", "Department", "Program", "Semester", "Batch Year", "Gender"],
    dbFields: ["full_name", "roll_number", "email", "phone", "department", "program", "semester", "batch_year", "gender"],
  },
  faculty: {
    label: "Faculty",
    sheetFields: ["Full Name", "Employee ID", "Email", "Phone", "Department", "Designation"],
    dbFields: ["full_name", "employee_id", "email", "phone", "department", "designation"],
  },
};

export default function ImportGoogleSheetsPage() {
  const { toast } = useToast();
  const [sheetUrl, setSheetUrl] = React.useState("");
  const [dataType, setDataType] = React.useState("");
  const [importing, setImporting] = React.useState(false);
  const [result, setResult] = React.useState<{ imported: number; failed: number; total: number; errors: string[] } | null>(null);
  const [fieldMapping, setFieldMapping] = React.useState<Record<string, string>>({});

  const currentMapping = dataType ? FIELD_MAPPINGS[dataType] : null;

  React.useEffect(() => {
    if (currentMapping) {
      const initial: Record<string, string> = {};
      currentMapping.sheetFields.forEach((sf, idx) => {
        initial[sf] = currentMapping.dbFields[idx] || "";
      });
      setFieldMapping(initial);
    }
  }, [currentMapping]);

  const handleImport = async () => {
    if (!sheetUrl || !dataType) {
      toast({ title: "Error", description: "Please enter sheet URL and select data type", variant: "destructive" });
      return;
    }
    setImporting(true);
    setResult(null);
    try {
      const res = await fetch("/api/import/google-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheet_url: sheetUrl, data_type: dataType, field_mapping: fieldMapping }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setResult(data.data);
      toast({ title: "Import Complete", description: data.message, variant: "success" });
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Import failed", variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import from Google Sheets</h1>
        <p className="text-sm text-muted-foreground">Import student or faculty data from Google Sheets</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sheet Configuration</CardTitle>
          <CardDescription>Enter the Google Sheets URL and select the data type to import</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input label="Google Sheet URL" value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/SHEET_ID/edit" helperText="Make sure the sheet is publicly accessible or use a shared link" />
          <Select label="Data Type" value={dataType} onChange={(e) => setDataType(e.target.value)} options={[{ value: "students", label: "Students" }, { value: "faculty", label: "Faculty" }]} placeholder="Select data type" />

          {currentMapping && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Field Mapping</p>
              <p className="text-xs text-muted-foreground">Map Google Sheet columns to database fields</p>
              <div className="grid grid-cols-2 gap-2">
                {currentMapping.sheetFields.map((sf) => (
                  <div key={sf} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-[120px] truncate">{sf}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-xs font-medium">{fieldMapping[sf] || sf}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button onClick={handleImport} disabled={importing || !sheetUrl || !dataType}>
            <Upload className="mr-2 h-4 w-4" />
            {importing ? "Importing..." : "Import Data"}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader><CardTitle className="text-base">Import Results</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center"><p className="text-2xl font-bold">{result.total}</p><p className="text-sm text-muted-foreground">Total Rows</p></div>
              <div className="text-center"><p className="text-2xl font-bold text-emerald-600">{result.imported}</p><p className="text-sm text-muted-foreground">Imported</p></div>
              <div className="text-center"><p className="text-2xl font-bold text-red-600">{result.failed}</p><p className="text-sm text-muted-foreground">Failed</p></div>
            </div>
            {result.errors.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-medium text-red-800">Errors:</p>
                {result.errors.map((err, i) => (
                  <p key={i} className="text-xs text-red-600">{err}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Instructions</CardTitle></CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>Create a Google Sheet with your data</li>
            <li>First row must contain column headers (e.g., Full Name, Roll Number, Email)</li>
            <li>Make the sheet publicly accessible: Share → General Access → Anyone with the link</li>
            <li>Copy the sheet URL and paste it above</li>
            <li>Select the data type and click Import</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
