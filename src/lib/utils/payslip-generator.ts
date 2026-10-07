import { jsPDF } from "jspdf";
import "jspdf-autotable";

interface PayslipData {
  employee_name: string;
  employee_id: string;
  designation: string;
  month: number;
  year: number;
  basic_salary: number;
  components: {
    component_name: string;
    component_code: string;
    type: "earning" | "deduction";
    amount: number;
  }[];
  gross_earnings: number;
  total_deductions: number;
  net_salary: number;
}

const MONTH_NAMES = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function generatePayslip(data: PayslipData): jsPDF {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, 210, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text("TSR", 105, 18, { align: "center" });
  doc.setFontSize(10);
  doc.text("Salary Payslip", 105, 26, { align: "center" });
  doc.text(`${MONTH_NAMES[data.month]} ${data.year}`, 105, 34, { align: "center" });

  // Employee Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  const startY = 52;
  doc.text("Employee Details", 14, startY);
  doc.setFontSize(9);

  const empInfo = [
    ["Name:", data.employee_name],
    ["Employee ID:", data.employee_id],
    ["Designation:", data.designation],
    ["Pay Period:", `${MONTH_NAMES[data.month]} ${data.year}`],
  ];

  let y = startY + 8;
  empInfo.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, 55, y);
    y += 6;
  });

  // Earnings and Deductions Table
  const earnings = data.components.filter((c) => c.type === "earning");
  const deductions = data.components.filter((c) => c.type === "deduction");

  const tableData: string[][] = [];
  const maxLen = Math.max(earnings.length, deductions.length);

  for (let i = 0; i < maxLen; i++) {
    tableData.push([
      earnings[i]?.component_name || "",
      earnings[i] ? `Rs. ${earnings[i].amount.toLocaleString("en-IN")}` : "",
      deductions[i]?.component_name || "",
      deductions[i] ? `Rs. ${deductions[i].amount.toLocaleString("en-IN")}` : "",
    ]);
  }

  tableData.push(["Basic Salary", `Rs. ${data.basic_salary.toLocaleString("en-IN")}`, "", ""]);
  tableData.push(["", "", "", ""]);
  tableData.push(["Total Earnings", `Rs. ${data.gross_earnings.toLocaleString("en-IN")}`, "Total Deductions", `Rs. ${data.total_deductions.toLocaleString("en-IN")}`]);

  (doc as any).autoTable({
    startY: y + 4,
    head: [["Earnings", "Amount", "Deductions", "Amount"]],
    body: tableData,
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [37, 99, 235] },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    columnStyles: {
      0: { fontStyle: "bold" },
      2: { fontStyle: "bold" },
    },
  });

  // Net Salary
  const docWithAuto = doc as jsPDF & { lastAutoTable?: { finalY: number } };
  const finalY = docWithAuto.lastAutoTable?.finalY || y + 80;
  doc.setFillColor(240, 253, 244);
  doc.rect(14, finalY + 5, 182, 14, "F");
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Net Salary", 18, finalY + 14);
  doc.text(`Rs. ${data.net_salary.toLocaleString("en-IN")}`, 196, finalY + 14, { align: "right" });

  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(128, 128, 128);
  doc.text("This is a computer-generated payslip. No signature required.", 105, 280, { align: "center" });
  doc.text(`Generated on: ${new Date().toLocaleDateString("en-IN")}`, 105, 285, { align: "center" });

  return doc;
}

export function downloadPayslip(data: PayslipData) {
  const doc = generatePayslip(data);
  const filename = `payslip-${data.employee_id}-${MONTH_NAMES[data.month]}-${data.year}.pdf`;
  doc.save(filename);
}


