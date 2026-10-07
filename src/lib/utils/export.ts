import { jsPDF } from "jspdf";
import "jspdf-autotable";

export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          const escaped = String(val ?? "").replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    ),
  ];

  const csvContent = csvRows.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}-${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToPDF(
  title: string,
  headers: string[],
  data: string[][],
  filename: string
) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text(title, 14, 22);

  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString("en-IN")}`, 14, 30);

  (doc as any).autoTable({
    head: [headers],
    body: data,
    startY: 35,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235] },
    alternateRowStyles: { fillColor: [249, 250, 251] },
  });

  doc.save(`${filename}-${new Date().toISOString().split("T")[0]}.pdf`);
}

export function exportStudentReport(
  students: {
    name: string;
    roll_number: string;
    department: string;
    semester: number;
    attendance?: number;
    sgpa?: number;
  }[],
  filename: string
) {
  const headers = ["Name", "Roll No", "Department", "Semester", "Attendance %", "SGPA"];
  const data = students.map((s) => [
    s.name,
    s.roll_number,
    s.department,
    String(s.semester),
    s.attendance !== undefined ? `${s.attendance}%` : "N/A",
    s.sgpa !== undefined ? String(s.sgpa) : "N/A",
  ]);
  exportToPDF("Student Report", headers, data, filename);
}

export function exportFeeReport(
  fees: {
    student_name: string;
    roll_number: string;
    fee_type: string;
    amount: number;
    paid: number;
    balance: number;
    status: string;
  }[],
  filename: string
) {
  const headers = ["Student", "Roll No", "Fee Type", "Amount", "Paid", "Balance", "Status"];
  const data = fees.map((f) => [
    f.student_name,
    f.roll_number,
    f.fee_type,
    `₹${f.amount.toLocaleString("en-IN")}`,
    `₹${f.paid.toLocaleString("en-IN")}`,
    `₹${f.balance.toLocaleString("en-IN")}`,
    f.status,
  ]);
  exportToPDF("Fee Report", headers, data, filename);
}

export function exportAttendanceReport(
  records: {
    student_name: string;
    roll_number: string;
    subject: string;
    present: number;
    total: number;
    percentage: number;
  }[],
  filename: string
) {
  const headers = ["Student", "Roll No", "Subject", "Present", "Total", "Percentage"];
  const data = records.map((r) => [
    r.student_name,
    r.roll_number,
    r.subject,
    String(r.present),
    String(r.total),
    `${r.percentage}%`,
  ]);
  exportToPDF("Attendance Report", headers, data, filename);
}
