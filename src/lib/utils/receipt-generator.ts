import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { FeePayment, FeeReceipt, Student, FeeStructure } from "@/types";

interface ReceiptData {
  receipt: FeeReceipt;
  payment: FeePayment & {
    student?: Student & { user?: { full_name: string } };
    fee_structure?: FeeStructure & { program?: { name: string } };
  };
  collegeName?: string;
  collegeAddress?: string;
}

export function generateReceiptPDF(data: ReceiptData): jsPDF {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = 20;

  const collegeName = data.collegeName || "TSR";
  const collegeAddress =
    data.collegeAddress || "";
  const studentName = data.payment.student?.user?.full_name || "N/A";
  const rollNumber = data.payment.student?.roll_number || "N/A";
  const programName = data.payment.fee_structure?.program?.name || "N/A";
  const semester = data.payment.fee_structure?.semester_number || 0;
  const feeType = data.payment.fee_structure?.fee_type || "N/A";

  // Header
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, pageWidth, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(collegeName, pageWidth / 2, 16, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(collegeAddress, pageWidth / 2, 24, { align: "center" });

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("FEE RECEIPT", pageWidth / 2, 34, { align: "center" });

  y = 50;

  // Receipt Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");

  doc.text("Receipt No:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.receipt.receipt_number, margin + 30, y);

  doc.setFont("helvetica", "bold");
  doc.text("Date:", pageWidth - 60, y);
  doc.setFont("helvetica", "normal");
  doc.text(
    new Date(data.receipt.issued_date).toLocaleDateString("en-IN"),
    pageWidth - 45,
    y
  );

  y += 8;

  doc.setFont("helvetica", "bold");
  doc.text("Payment ID:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.payment.id.slice(0, 12).toUpperCase(), margin + 30, y);

  doc.setFont("helvetica", "bold");
  doc.text("Payment Date:", pageWidth - 60, y);
  doc.setFont("helvetica", "normal");
  doc.text(
    new Date(data.payment.payment_date).toLocaleDateString("en-IN"),
    pageWidth - 45,
    y
  );

  y += 12;

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Student Details
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Student Details", margin, y);
  y += 8;

  doc.setFontSize(10);
  const studentDetails = [
    ["Name", studentName],
    ["Roll Number", rollNumber],
    ["Program", programName],
    ["Semester", semester > 0 ? `Semester ${semester}` : "N/A"],
  ];

  for (const [label, value] of studentDetails) {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, margin + 40, y);
    y += 6;
  }

  y += 4;

  // Divider
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Payment Details
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Payment Details", margin, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [["Description", "Amount (₹)"]],
    body: [
      [feeType, data.payment.amount_paid.toLocaleString("en-IN")],
    ],
    theme: "grid",
    headStyles: { fillColor: [30, 58, 138], fontSize: 10 },
    bodyStyles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: contentWidth * 0.6 },
      1: { cellWidth: contentWidth * 0.4, halign: "right" },
    },
  });

  const tableEndY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
  y = tableEndY + 4;

  // Total
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Total Paid:", margin, y);
  doc.text(
    `₹${data.payment.amount_paid.toLocaleString("en-IN")}`,
    pageWidth - margin,
    y,
    { align: "right" }
  );

  y += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Payment Method: ${data.payment.payment_method.toUpperCase()}`,
    margin,
    y
  );

  if (data.payment.transaction_id) {
    doc.text(`Transaction ID: ${data.payment.transaction_id}`, margin, y + 6);
  }

  y += 20;

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  // Status
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Status: ", margin, y);
  doc.setTextColor(0, 128, 0);
  doc.text(data.payment.status.toUpperCase(), margin + 20, y);

  // Footer
  doc.setTextColor(128, 128, 128);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(
    "This is a computer-generated receipt. No signature required.",
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 15,
    { align: "center" }
  );
  doc.text(
    `Generated on ${new Date().toLocaleString("en-IN")}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: "center" }
  );

  return doc;
}

export function downloadReceipt(data: ReceiptData): void {
  const doc = generateReceiptPDF(data);
  doc.save(`receipt_${data.receipt.receipt_number}.pdf`);
}

export function printReceipt(data: ReceiptData): void {
  const doc = generateReceiptPDF(data);
  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url);
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function generateReceiptNumber(paymentId: string, sequence?: number): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const seq = (sequence || Math.floor(Math.random() * 9999)).toString().padStart(4, "0");
  const suffix = paymentId.slice(-4).toUpperCase();
  return `TSR/${year}${month}/${seq}/${suffix}`;
}
