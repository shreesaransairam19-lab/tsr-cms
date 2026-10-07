"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  CreditCard,
  CheckCircle2,
  Download,
  Printer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { PaymentMethod } from "@/types";

interface StudentSearchResult {
  id: string;
  roll_number: string;
  user?: { full_name: string; email: string };
  program?: { name: string };
  department?: { name: string };
  semester: number;
  total_fee: number;
  total_paid: number;
  outstanding_fees: {
    fee_structure_id: string;
    fee_type: string;
    amount: number;
    due_date: string;
    paid: number;
    balance: number;
    status: string;
  }[];
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "online", label: "Online" },
  { value: "upi", label: "UPI" },
  { value: "cheque", label: "Cheque" },
  { value: "dd", label: "Demand Draft" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

export default function FeeCollectPage() {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<StudentSearchResult[]>([]);
  const [searching, setSearching] = React.useState(false);

  const [selectedStudent, setSelectedStudent] = React.useState<StudentSearchResult | null>(null);
  const [selectedFees, setSelectedFees] = React.useState<Set<string>>(new Set());
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("cash");
  const [transactionId, setTransactionId] = React.useState("");
  const [remarks, setRemarks] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [paymentSuccess, setPaymentSuccess] = React.useState(false);
  const [receiptData, setReceiptData] = React.useState<{
    receipt_number: string;
    payment_id: string;
  } | null>(null);

  const searchStudents = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/fees/collect?search=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.data || []);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Search failed",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const selectStudent = (student: StudentSearchResult) => {
    setSelectedStudent(student);
    setSelectedFees(new Set());
    setSearchResults([]);
    setSearchQuery(student.roll_number);
  };

  const toggleFee = (feeId: string) => {
    setSelectedFees((prev) => {
      const next = new Set(prev);
      if (next.has(feeId)) {
        next.delete(feeId);
      } else {
        next.add(feeId);
      }
      return next;
    });
  };

  const totalSelected = selectedStudent?.outstanding_fees
    .filter((f) => selectedFees.has(f.fee_structure_id))
    .reduce((sum, f) => sum + f.balance, 0) || 0;

  const handlePayment = async () => {
    if (!selectedStudent || selectedFees.size === 0) {
      toast({ title: "Error", description: "Please select fees to pay", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const outstandingFees = selectedStudent.outstanding_fees.filter((f) => selectedFees.has(f.fee_structure_id));

      let lastReceipt = "";
      for (const fee of outstandingFees) {
        const res = await fetch("/api/fees", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            student_id: selectedStudent.id,
            fee_structure_id: fee.fee_structure_id,
            amount_paid: fee.balance,
            payment_method: paymentMethod,
            transaction_id: transactionId || null,
            remarks: remarks || null,
          }),
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        lastReceipt = data.data.receipt_number;
      }

      setReceiptData({
        receipt_number: lastReceipt,
        payment_id: `payment_${Date.now()}`,
      });
      setPaymentSuccess(true);
      toast({ title: "Payment Recorded", description: "Payment processed successfully", variant: "success" });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Payment failed",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedStudent(null);
    setSelectedFees(new Set());
    setPaymentMethod("cash");
    setTransactionId("");
    setRemarks("");
    setSearchQuery("");
    setPaymentSuccess(false);
    setReceiptData(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/fees")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fee Collection</h1>
          <p className="text-sm text-muted-foreground">Search student and collect fees</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by roll number or name..."
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && searchStudents()}
            />
            <Button onClick={searchStudents} disabled={searching}>
              <Search className="mr-2 h-4 w-4" />
              {searching ? "Searching..." : "Search"}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-3 space-y-2">
              {searchResults.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 cursor-pointer"
                  onClick={() => selectStudent(student)}
                >
                  <div>
                    <p className="text-sm font-medium">{student.user?.full_name || "N/A"}</p>
                    <p className="text-xs text-muted-foreground">
                      {student.roll_number} · {student.program?.name || ""} · Sem {student.semester}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-600">
                      {formatCurrency(student.outstanding_fees.reduce((sum, f) => sum + f.balance, 0))} due
                    </p>
                    <p className="text-xs text-muted-foreground">{student.outstanding_fees.length} pending fees</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedStudent && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Student Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Name</p>
                    <p className="text-sm font-medium">{selectedStudent.user?.full_name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Roll Number</p>
                    <p className="text-sm font-medium text-primary">{selectedStudent.roll_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Program</p>
                    <p className="text-sm font-medium">{selectedStudent.program?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Semester</p>
                    <p className="text-sm font-medium">{selectedStudent.semester}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Outstanding Fees</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allIds = new Set(selectedStudent.outstanding_fees.map((f) => f.fee_structure_id));
                    setSelectedFees(allIds);
                  }}
                >
                  Select All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedStudent.outstanding_fees.map((fee) => (
                    <div
                      key={fee.fee_structure_id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                        selectedFees.has(fee.fee_structure_id)
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => toggleFee(fee.fee_structure_id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFees.has(fee.fee_structure_id)}
                        onChange={() => toggleFee(fee.fee_structure_id)}
                        className="h-4 w-4"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium capitalize">{fee.fee_type}</p>
                        <p className="text-xs text-muted-foreground">
                          Total: {formatCurrency(fee.amount)} · Paid: {formatCurrency(fee.paid)} · Due: {formatDate(fee.due_date)}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-red-600">{formatCurrency(fee.balance)}</p>
                    </div>
                  ))}
                  {selectedStudent.outstanding_fees.length === 0 && (
                    <p className="py-4 text-center text-sm text-emerald-600 font-medium">
                      All fees are paid!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted p-4 text-center">
                  <p className="text-sm text-muted-foreground">Total Selected</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalSelected)}</p>
                </div>

                <Select
                  label="Payment Method"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  options={PAYMENT_METHODS}
                />

                {(paymentMethod === "online" || paymentMethod === "upi" || paymentMethod === "bank_transfer") && (
                  <Input
                    label="Transaction ID"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter transaction reference"
                  />
                )}

                <Input
                  label="Remarks"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Optional remarks"
                />

                <Button
                  className="w-full"
                  onClick={handlePayment}
                  disabled={saving || selectedFees.size === 0 || totalSelected === 0}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {saving ? "Processing..." : `Pay ${formatCurrency(totalSelected)}`}
                </Button>
              </CardContent>
            </Card>

            {paymentSuccess && receiptData && (
              <Card className="border-emerald-200 bg-emerald-50">
                <CardContent className="p-4 text-center space-y-3">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500" />
                  <p className="font-medium text-emerald-700">Payment Successful!</p>
                  <p className="text-sm text-muted-foreground">
                    Receipt: {receiptData.receipt_number}
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button variant="outline" size="sm" onClick={() => toast({ title: "Coming soon", description: "PDF download will be available shortly", variant: "default" })}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toast({ title: "Coming soon", description: "Print will be available shortly", variant: "default" })}>
                      <Printer className="mr-2 h-4 w-4" />
                      Print
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" onClick={resetForm}>
                    Collect Another Payment
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
