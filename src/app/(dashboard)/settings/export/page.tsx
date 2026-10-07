"use client";

import * as React from "react";
import { Download, FileSpreadsheet, Users, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { exportToCSV } from "@/lib/utils/export";

export default function ExportGoogleSheetsPage() {
  const { toast } = useToast();
  const [exporting, setExporting] = React.useState<string | null>(null);

  const handleExport = async (dataType: string) => {
    setExporting(dataType);
    try {
      const res = await fetch("/api/export/google-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data_type: dataType }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);

      // Download as CSV
      const blob = new Blob([result.data.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${dataType}-export-${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: "Export Complete", description: result.message, variant: "success" });
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Export failed", variant: "destructive" });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Export to Google Sheets</h1>
        <p className="text-sm text-muted-foreground">Export college data as CSV files for Google Sheets</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => handleExport("students")}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Students</h3>
                <p className="text-sm text-muted-foreground">Export all active student records</p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" disabled={exporting === "students"}>
                <Download className="mr-2 h-4 w-4" />
                {exporting === "students" ? "Exporting..." : "Export CSV"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => handleExport("faculty")}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-violet-500">
                <Users className="h-7 w-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Faculty</h3>
                <p className="text-sm text-muted-foreground">Export all active faculty records</p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" disabled={exporting === "faculty"}>
                <Download className="mr-2 h-4 w-4" />
                {exporting === "faculty" ? "Exporting..." : "Export CSV"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">How to Import into Google Sheets</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
            <li>Click the export button above to download the CSV file</li>
            <li>Open Google Sheets</li>
            <li>Go to File → Import → Upload</li>
            <li>Select the downloaded CSV file</li>
            <li>Choose "Replace spreadsheet" or "Insert new sheet(s)"</li>
            <li>Click "Import data"</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
