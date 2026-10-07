"use client";

import * as React from "react";
import {
  BookOpen,
  BookMarked,
  AlertCircle,
  Clock,
  Plus,
  ArrowRightLeft,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatDate, formatCurrency } from "@/lib/utils";

interface LibraryStats {
  totalBooks: number;
  issuedBooks: number;
  overdueBooks: number;
  totalStudents: number;
}

interface RecentIssue {
  id: string;
  book_title: string;
  student_name: string;
  student_roll: string;
  issue_date: string;
  due_date: string;
  return_date: string | null;
  status: string;
  fine: number;
}

export default function LibraryDashboardPage() {
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState<LibraryStats>({
    totalBooks: 0,
    issuedBooks: 0,
    overdueBooks: 0,
    totalStudents: 0,
  });
  const [recentIssues, setRecentIssues] = React.useState<RecentIssue[]>([]);

  React.useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [
          { count: totalBooks },
          { data: issuedData },
          { data: overdueData },
          { count: totalStudents },
          { data: recentData },
        ] = await Promise.all([
          supabase
            .from("library_books")
            .select("id", { count: "exact", head: true })
            .eq("is_active", true),
          supabase
            .from("library_issues")
            .select("id", { count: "exact", head: true })
            .eq("status", "issued"),
          supabase
            .from("library_issues")
            .select("id", { count: "exact", head: true })
            .eq("status", "overdue"),
          supabase
            .from("students")
            .select("id", { count: "exact", head: true })
            .eq("is_active", true),
          supabase
            .from("library_issues")
            .select(`
              id,
              issue_date,
              due_date,
              return_date,
              status,
              fine,
              book:library_books(title),
              student:students(roll_number, user:users(full_name))
            `)
            .order("created_at", { ascending: false })
            .limit(8),
        ]);

        setStats({
          totalBooks: totalBooks || 0,
          issuedBooks: issuedData?.length || 0,
          overdueBooks: overdueData?.length || 0,
          totalStudents: totalStudents || 0,
        });

        const issues: RecentIssue[] = (recentData || []).map((i: Record<string, unknown>) => {
          const book = i.book as { title: string } | null;
          const student = i.student as { roll_number: string; user: { full_name: string } | null } | null;
          return {
            id: i.id as string,
            book_title: book?.title || "Unknown",
            student_name: student?.user?.full_name || "Unknown",
            student_roll: student?.roll_number || "",
            issue_date: i.issue_date as string,
            due_date: i.due_date as string,
            return_date: i.return_date as string | null,
            status: i.status as string,
            fine: i.fine as number,
          };
        });
        setRecentIssues(issues);
      } catch {
        toast({
          title: "Error",
          description: "Failed to load library data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [supabase, toast]);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Library Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage books, issues, and returns
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/library/issue">
            <Button variant="outline">
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Issue / Return
            </Button>
          </Link>
          <Link href="/library/books">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Book
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Books</p>
                <p className="text-2xl font-bold">{stats.totalBooks}</p>
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
                <p className="text-sm text-muted-foreground">Currently Issued</p>
                <p className="text-2xl font-bold">{stats.issuedBooks}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500">
                <BookMarked className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue Books</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdueBooks}</p>
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
                <p className="text-sm text-muted-foreground">Registered Students</p>
                <p className="text-2xl font-bold">{stats.totalStudents}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Issues / Returns</CardTitle>
          </CardHeader>
          <CardContent>
            {recentIssues.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No recent activity
              </p>
            ) : (
              <div className="space-y-3">
                {recentIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{issue.book_title}</p>
                      <p className="text-xs text-muted-foreground">
                        {issue.student_name} ({issue.student_roll})
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatDate(issue.issue_date)} → {issue.return_date ? formatDate(issue.return_date) : `Due: ${formatDate(issue.due_date)}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant={
                          issue.status === "returned"
                            ? "success"
                            : issue.status === "overdue"
                              ? "destructive"
                              : "warning"
                        }
                      >
                        {issue.status}
                      </Badge>
                      {issue.fine > 0 && (
                        <span className="text-xs font-medium text-red-600">
                          Fine: {formatCurrency(issue.fine)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/library/books">
                <button className="flex w-full flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-accent">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">Book Catalog</span>
                </button>
              </Link>
              <Link href="/library/issue">
                <button className="flex w-full flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-accent">
                  <BookMarked className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">Issue Book</span>
                </button>
              </Link>
              <Link href="/library/issue?tab=return">
                <button className="flex w-full flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-accent">
                  <ArrowRightLeft className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">Return Book</span>
                </button>
              </Link>
              <Link href="/reports">
                <button className="flex w-full flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-accent">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">Reports</span>
                </button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
