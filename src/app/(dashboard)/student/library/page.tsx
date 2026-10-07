"use client";

import * as React from "react";
import {
  BookOpen,
  Clock,
  AlertCircle,
  CheckCircle2,
  Search,
  IndianRupee,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDate, formatCurrency, cn } from "@/lib/utils";

interface IssuedBook {
  id: string;
  book_title: string;
  book_author: string;
  isbn: string;
  issue_date: string;
  due_date: string;
  return_date: string | null;
  fine: number;
  fine_paid: boolean;
  status: string;
  is_overdue: boolean;
  days_overdue: number;
}

export default function StudentLibraryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [issuedBooks, setIssuedBooks] = React.useState<IssuedBook[]>([]);
  const [totalFine, setTotalFine] = React.useState(0);
  const [unpaidFine, setUnpaidFine] = React.useState(0);

  React.useEffect(() => {
    async function loadData() {
      if (!user) return;
      setLoading(true);
      try {
        const { data: student } = await supabase
          .from("students")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!student) return;

        const { data: issues } = await supabase
          .from("library_issues")
          .select(`
            id,
            issue_date,
            due_date,
            return_date,
            fine,
            fine_paid,
            status,
            book:library_books(title, author, isbn)
          `)
          .eq("student_id", student.id)
          .order("created_at", { ascending: false });

        const today = new Date();
        let total = 0;
        let unpaid = 0;

        const books: IssuedBook[] = (issues || []).map((i: Record<string, unknown>) => {
          const book = i.book as { title: string; author: string; isbn: string } | null;
          const dueDate = new Date(i.due_date as string);
          const isOverdue = !i.return_date && today > dueDate;
          const daysOverdue = isOverdue
            ? Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
            : 0;
          const fine = i.fine as number;
          total += fine;
          if (fine > 0 && !(i.fine_paid as boolean)) unpaid += fine;

          return {
            id: i.id as string,
            book_title: book?.title || "Unknown",
            book_author: book?.author || "",
            isbn: book?.isbn || "",
            issue_date: i.issue_date as string,
            due_date: i.due_date as string,
            return_date: i.return_date as string | null,
            fine,
            fine_paid: i.fine_paid as boolean,
            status: i.status as string,
            is_overdue: isOverdue,
            days_overdue: daysOverdue,
          };
        });

        setIssuedBooks(books);
        setTotalFine(total);
        setUnpaidFine(unpaid);
      } catch {
        toast({ title: "Error", description: "Failed to load library data", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, supabase, toast]);

  const filteredBooks = issuedBooks.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.book_title.toLowerCase().includes(q) ||
      b.book_author.toLowerCase().includes(q) ||
      b.isbn.toLowerCase().includes(q)
    );
  });

  const activeIssues = filteredBooks.filter((b) => b.status === "issued" || b.status === "overdue");
  const returnedBooks = filteredBooks.filter((b) => b.status === "returned");

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading library data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Library</h1>
        <p className="text-sm text-muted-foreground">View your issued books and fines</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Issues</p>
                <p className="text-2xl font-bold">{activeIssues.length}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">
                  {activeIssues.filter((b) => b.is_overdue).length}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Fine</p>
                <p className={cn("text-2xl font-bold", unpaidFine > 0 ? "text-red-600" : "text-emerald-600")}>
                  {formatCurrency(totalFine)}
                </p>
                {unpaidFine > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Unpaid: {formatCurrency(unpaidFine)}
                  </p>
                )}
              </div>
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", unpaidFine > 0 ? "bg-red-500" : "bg-emerald-500")}>
                <IndianRupee className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Currently Issued Books</CardTitle>
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search books..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeIssues.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No books currently issued
            </p>
          ) : (
            <div className="space-y-3">
              {activeIssues.map((book) => (
                <div
                  key={book.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-4",
                    book.is_overdue && "border-red-200 bg-red-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-lg",
                        book.is_overdue ? "bg-red-100" : "bg-blue-100"
                      )}
                    >
                      {book.is_overdue ? (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{book.book_title}</p>
                      <p className="text-xs text-muted-foreground">{book.book_author}</p>
                      <p className="text-xs text-muted-foreground">
                        Issued: {formatDate(book.issue_date)} · Due: {formatDate(book.due_date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={book.is_overdue ? "destructive" : "warning"}>
                      {book.is_overdue ? `${book.days_overdue} days overdue` : "Issued"}
                    </Badge>
                    {book.fine > 0 && !book.fine_paid && (
                      <p className="mt-1 text-sm font-medium text-red-600">
                        Fine: {formatCurrency(book.fine)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {returnedBooks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Returned Books</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {returnedBooks.map((book) => (
                <div
                  key={book.id}
                  className="flex items-center justify-between rounded-lg border p-3 bg-emerald-50/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{book.book_title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(book.issue_date)} → {formatDate(book.return_date!)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="success">Returned</Badge>
                    {book.fine > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Fine paid: {formatCurrency(book.fine)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
