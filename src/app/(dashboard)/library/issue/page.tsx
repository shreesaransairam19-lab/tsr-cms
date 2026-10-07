"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  BookMarked,
  ArrowRightLeft,
  Search,
  User,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDate, formatCurrency } from "@/lib/utils";

interface StudentResult {
  id: string;
  user: { full_name: string } | null;
  roll_number: string;
}

interface BookResult {
  id: string;
  title: string;
  author: string;
  isbn: string;
  available_copies: number;
  total_copies: number;
}

interface IssueRecord {
  id: string;
  book: { title: string; author: string; isbn: string } | null;
  student: { roll_number: string; user: { full_name: string } | null } | null;
  issue_date: string;
  due_date: string;
  return_date: string | null;
  fine: number;
  fine_paid: boolean;
  status: string;
}

export default function LibraryIssuePage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "return" ? "return" : "issue";
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();

  const [tab, setTab] = React.useState(initialTab);

  const [studentQuery, setStudentQuery] = React.useState("");
  const [studentResults, setStudentResults] = React.useState<StudentResult[]>([]);
  const [selectedStudent, setSelectedStudent] = React.useState<StudentResult | null>(null);
  const [searchingStudent, setSearchingStudent] = React.useState(false);

  const [bookQuery, setBookQuery] = React.useState("");
  const [bookResults, setBookResults] = React.useState<BookResult[]>([]);
  const [selectedBook, setSelectedBook] = React.useState<BookResult | null>(null);
  const [searchingBook, setSearchingBook] = React.useState(false);

  const [returnQuery, setReturnQuery] = React.useState("");
  const [returnResults, setReturnResults] = React.useState<IssueRecord[]>([]);
  const [searchingReturn, setSearchingReturn] = React.useState(false);

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);

  React.useEffect(() => {
    if (searchParams.get("tab") === "return") {
      setTab("return");
    }
  }, [searchParams]);

  const searchStudents = async (query: string) => {
    if (query.length < 2) {
      setStudentResults([]);
      return;
    }
    setSearchingStudent(true);
    try {
      const { data } = await supabase
        .from("students")
        .select("id, roll_number, user:users(full_name)")
        .eq("is_active", true)
        .or(`roll_number.ilike.%${query}%`)
        .limit(5);
      setStudentResults((data || []) as StudentResult[]);
    } finally {
      setSearchingStudent(false);
    }
  };

  const searchBooks = async (query: string) => {
    if (query.length < 2) {
      setBookResults([]);
      return;
    }
    setSearchingBook(true);
    try {
      const { data } = await supabase
        .from("library_books")
        .select("id, title, author, isbn, available_copies, total_copies")
        .eq("is_active", true)
        .gt("available_copies", 0)
        .or(`title.ilike.%${query}%,author.ilike.%${query}%,isbn.ilike.%${query}%`)
        .limit(5);
      setBookResults((data || []) as BookResult[]);
    } finally {
      setSearchingBook(false);
    }
  };

  const searchReturnBooks = async (query: string) => {
    if (query.length < 2) {
      setReturnResults([]);
      return;
    }
    setSearchingReturn(true);
    try {
      const { data } = await supabase
        .from("library_issues")
        .select(`
          id,
          issue_date,
          due_date,
          return_date,
          fine,
          fine_paid,
          status,
          book:library_books(title, author, isbn),
          student:students(roll_number, user:users(full_name))
        `)
        .eq("status", "issued")
        .order("created_at", { ascending: false })
        .limit(10);

      const filtered = (data || []).filter((item: Record<string, unknown>) => {
        const book = item.book as { title: string; author: string; isbn: string } | null;
        const student = item.student as { roll_number: string; user: { full_name: string } | null } | null;
        const q = query.toLowerCase();
        return (
          book?.title?.toLowerCase().includes(q) ||
          book?.author?.toLowerCase().includes(q) ||
          book?.isbn?.toLowerCase().includes(q) ||
          student?.roll_number?.toLowerCase().includes(q) ||
          student?.user?.full_name?.toLowerCase().includes(q)
        );
      });

      setReturnResults(filtered as IssueRecord[]);
    } finally {
      setSearchingReturn(false);
    }
  };

  const handleIssue = async () => {
    if (!selectedBook) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/library/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "issue",
          book_id: selectedBook.id,
          student_id: selectedStudent?.id || null,
        }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      toast({ title: "Book Issued", description: result.message, variant: "success" });
      setSelectedBook(null);
      setSelectedStudent(null);
      setBookQuery("");
      setStudentQuery("");
      setBookResults([]);
      setStudentResults([]);
      setConfirmOpen(false);
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleReturn = async (issueId: string) => {
    setProcessing(true);
    try {
      const res = await fetch("/api/library/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "return", issue_id: issueId }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      toast({ title: "Book Returned", description: result.message, variant: "success" });
      setReturnResults((prev) => prev.filter((r) => r.id !== issueId));
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Issue / Return Books</h1>
        <p className="text-sm text-muted-foreground">
          Issue books to students or process book returns
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="issue">
            <BookOpen className="mr-2 h-4 w-4" />
            Issue Book
          </TabsTrigger>
          <TabsTrigger value="return">
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Return Book
          </TabsTrigger>
        </TabsList>

        <TabsContent value="issue">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Select Student
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by roll number..."
                    className="pl-9"
                    value={studentQuery}
                    onChange={(e) => {
                      setStudentQuery(e.target.value);
                      searchStudents(e.target.value);
                    }}
                  />
                </div>
                {selectedStudent && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {selectedStudent.user?.full_name || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedStudent.roll_number}
                        </p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                  </div>
                )}
                {studentResults.length > 0 && !selectedStudent && (
                  <div className="rounded-md border">
                    {studentResults.map((s) => (
                      <button
                        key={s.id}
                        className="flex w-full items-center justify-between border-b px-3 py-2 text-left last:border-0 hover:bg-accent"
                        onClick={() => {
                          setSelectedStudent(s);
                          setStudentResults([]);
                          setStudentQuery(s.user?.full_name || s.roll_number);
                        }}
                      >
                        <div>
                          <p className="text-sm font-medium">{s.user?.full_name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{s.roll_number}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {searchingStudent && (
                  <p className="text-xs text-muted-foreground">Searching...</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Select Book
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by title, author, ISBN..."
                    className="pl-9"
                    value={bookQuery}
                    onChange={(e) => {
                      setBookQuery(e.target.value);
                      searchBooks(e.target.value);
                    }}
                  />
                </div>
                {selectedBook && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{selectedBook.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedBook.author} · ISBN: {selectedBook.isbn}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Available: {selectedBook.available_copies}/{selectedBook.total_copies}
                        </p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                  </div>
                )}
                {bookResults.length > 0 && !selectedBook && (
                  <div className="rounded-md border">
                    {bookResults.map((b) => (
                      <button
                        key={b.id}
                        className="flex w-full items-center justify-between border-b px-3 py-2 text-left last:border-0 hover:bg-accent"
                        onClick={() => {
                          setSelectedBook(b);
                          setBookResults([]);
                          setBookQuery(b.title);
                        }}
                      >
                        <div>
                          <p className="text-sm font-medium">{b.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {b.author} · Avail: {b.available_copies}/{b.total_copies}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {searchingBook && (
                  <p className="text-xs text-muted-foreground">Searching...</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              disabled={!selectedBook}
              onClick={() => setConfirmOpen(true)}
            >
              <BookMarked className="mr-2 h-4 w-4" />
              Issue Book
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="return">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Search Issued Books</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by book title, student name, or roll number..."
                  className="pl-9"
                  value={returnQuery}
                  onChange={(e) => {
                    setReturnQuery(e.target.value);
                    searchReturnBooks(e.target.value);
                  }}
                />
              </div>

              {returnResults.length > 0 && (
                <div className="space-y-3">
                  {returnResults.map((issue) => {
                    const today = new Date();
                    const due = new Date(issue.due_date);
                    const isOverdue = today > due;

                    return (
                      <div
                        key={issue.id}
                        className={`flex items-center justify-between rounded-lg border p-4 ${
                          isOverdue ? "border-red-200 bg-red-50" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                              isOverdue ? "bg-red-100" : "bg-blue-100"
                            }`}
                          >
                            {isOverdue ? (
                              <AlertCircle className="h-5 w-5 text-red-600" />
                            ) : (
                              <Clock className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{issue.book?.title || "Unknown Book"}</p>
                            <p className="text-xs text-muted-foreground">
                              {issue.student?.user?.full_name || "Unknown"} ({issue.student?.roll_number})
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Issued: {formatDate(issue.issue_date)} · Due: {formatDate(issue.due_date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant={isOverdue ? "destructive" : "warning"}>
                            {isOverdue ? "Overdue" : "Issued"}
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => handleReturn(issue.id)}
                            disabled={processing}
                          >
                            <ArrowRightLeft className="mr-1 h-3 w-3" />
                            Return
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {returnQuery.length >= 2 && returnResults.length === 0 && !searchingReturn && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No issued books found matching your search
                </p>
              )}

              {returnQuery.length < 2 && (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Type at least 2 characters to search for issued books
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Book Issue</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border p-3">
              <p className="text-sm font-medium">{selectedBook?.title}</p>
              <p className="text-xs text-muted-foreground">{selectedBook?.author}</p>
            </div>
            {selectedStudent && (
              <div className="rounded-lg border p-3">
                <p className="text-sm font-medium">{selectedStudent.user?.full_name}</p>
                <p className="text-xs text-muted-foreground">{selectedStudent.roll_number}</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Due date: 14 days from today · Fine: ₹5/day for overdue
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleIssue} disabled={processing}>
              {processing ? "Processing..." : "Confirm Issue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
