import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth-helpers";
import type { ApiResponse, LibraryIssue } from "@/types";

const FINE_PER_DAY = 5;

function calculateFine(dueDate: string, returnDate: string): number {
  const due = new Date(dueDate);
  const returned = new Date(returnDate);
  if (returned <= due) return 0;
  const diffMs = returned.getTime() - due.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays * FINE_PER_DAY;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const per_page = parseInt(searchParams.get("per_page") || "10", 10);
    const status = searchParams.get("status") || "";
    const student_id = searchParams.get("student_id") || "";
    const book_id = searchParams.get("book_id") || "";

    let countQuery = supabase
      .from("library_issues")
      .select("*", { count: "exact", head: true });

    let dataQuery = supabase.from("library_issues").select(`
      *,
      book:library_books(id, title, author, isbn),
      student:students(id, roll_number, first_name, last_name, user:users(id, email)),
      faculty:faculty(id, employee_id, first_name, last_name, user:users(id, email))
    `);

    if (status) {
      countQuery = countQuery.eq("status", status);
      dataQuery = dataQuery.eq("status", status);
    }
    if (student_id) {
      countQuery = countQuery.eq("student_id", student_id);
      dataQuery = dataQuery.eq("student_id", student_id);
    }
    if (book_id) {
      countQuery = countQuery.eq("book_id", book_id);
      dataQuery = dataQuery.eq("book_id", book_id);
    }

    const { count, error: countError } = await countQuery;
    if (countError) {
      return NextResponse.json(
        { success: false, data: null, error: countError.message },
        { status: 500 }
      );
    }

    const from = (page - 1) * per_page;
    const to = from + per_page - 1;

    const { data, error } = await dataQuery
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      return NextResponse.json(
        { success: false, data: null, error: error.message },
        { status: 500 }
      );
    }

    (data || []).forEach((item: Record<string, unknown>) => {
      const student = item.student as Record<string, unknown> | null;
      if (student) {
        const su = student.user as Record<string, unknown> | null;
        if (su) su.full_name = `${student.first_name || ""} ${student.last_name || ""}`.trim() || (su.email as string)?.split("@")[0] || "";
      }
      const fac = item.faculty as Record<string, unknown> | null;
      if (fac) {
        const fu = fac.user as Record<string, unknown> | null;
        if (fu) fu.full_name = `${fac.first_name || ""} ${fac.last_name || ""}`.trim() || (fu.email as string)?.split("@")[0] || "";
      }
    });

    const total = count || 0;
    const total_pages = Math.ceil(total / per_page);

    return NextResponse.json({
      success: true,
      data: {
        items: data || [],
        total,
        page,
        per_page,
        total_pages,
        has_next: page < total_pages,
        has_previous: page > 1,
      },
      error: null,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const body = await request.json();
    const { action, book_id, student_id, faculty_id, issued_by } = body;

    if (action === "issue") {
      if (!book_id || (!student_id && !faculty_id)) {
        return NextResponse.json(
          {
            success: false,
            data: null,
            error: "Book ID and either student or faculty ID are required",
          },
          { status: 400 }
        );
      }

      const { data: book, error: bookError } = await supabase
        .from("library_books")
        .select("id, available_copies, title")
        .eq("id", book_id)
        .single();

      if (bookError || !book) {
        return NextResponse.json(
          { success: false, data: null, error: "Book not found" },
          { status: 404 }
        );
      }

      if (book.available_copies <= 0) {
        return NextResponse.json(
          { success: false, data: null, error: "No copies available for issue" },
          { status: 400 }
        );
      }

      const issueDate = new Date().toISOString().split("T")[0];
      const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const { data: issue, error: issueError } = await supabase
        .from("library_issues")
        .insert({
          book_id,
          student_id: student_id || null,
          faculty_id: faculty_id || null,
          issue_date: issueDate,
          due_date: dueDate,
          fine: 0,
          fine_paid: false,
          status: "issued",
          issued_by: issued_by || "",
        })
        .select()
        .single();

      if (issueError) {
        return NextResponse.json(
          { success: false, data: null, error: issueError.message },
          { status: 400 }
        );
      }

      await supabase
        .from("library_books")
        .update({
          available_copies: book.available_copies - 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", book_id);

      return NextResponse.json({
        success: true,
        data: issue as LibraryIssue,
        error: null,
        message: `Book "${book.title}" issued successfully. Due date: ${dueDate}`,
      });
    }

    if (action === "return") {
      const { issue_id } = body;

      if (!issue_id) {
        return NextResponse.json(
          { success: false, data: null, error: "Issue ID is required" },
          { status: 400 }
        );
      }

      const { data: issueRecord, error: fetchError } = await supabase
        .from("library_issues")
        .select("*, book:library_books(id, available_copies)")
        .eq("id", issue_id)
        .single();

      if (fetchError || !issueRecord) {
        return NextResponse.json(
          { success: false, data: null, error: "Issue record not found" },
          { status: 404 }
        );
      }

      if (issueRecord.status === "returned") {
        return NextResponse.json(
          { success: false, data: null, error: "Book already returned" },
          { status: 400 }
        );
      }

      const returnDate = new Date().toISOString().split("T")[0];
      const fine = calculateFine(issueRecord.due_date, returnDate);

      const { data: updated, error: updateError } = await supabase
        .from("library_issues")
        .update({
          return_date: returnDate,
          fine,
          status: "returned",
          updated_at: new Date().toISOString(),
        })
        .eq("id", issue_id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { success: false, data: null, error: updateError.message },
          { status: 400 }
        );
      }

      const bookInfo = issueRecord.book as { id: string; available_copies: number } | null;
      if (bookInfo) {
        await supabase
          .from("library_books")
          .update({
            available_copies: bookInfo.available_copies + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", bookInfo.id);
      }

      return NextResponse.json({
        success: true,
        data: updated as LibraryIssue,
        error: null,
        message: fine > 0
          ? `Book returned. Fine: ₹${fine}`
          : "Book returned successfully",
      });
    }

    return NextResponse.json(
      { success: false, data: null, error: "Invalid action. Use 'issue' or 'return'" },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
