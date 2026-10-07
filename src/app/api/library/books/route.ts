import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireAdmin } from "@/lib/auth-helpers";
import type { ApiListResponse, ApiSingleResponse, LibraryBook } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const per_page = parseInt(searchParams.get("per_page") || "10", 10);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const department_id = searchParams.get("department_id") || "";
    const status = searchParams.get("status") || "";
    const sort_by = searchParams.get("sort_by") || "created_at";
    const sort_order = (searchParams.get("sort_order") || "desc") as "asc" | "desc";

    let countQuery = supabase
      .from("library_books")
      .select("*", { count: "exact", head: true });

    let dataQuery = supabase
      .from("library_books")
      .select("*, department:departments(id, name, code)");

    if (search) {
      const searchFilter = `title.ilike.%${search}%,author.ilike.%${search}%,isbn.ilike.%${search}%`;
      countQuery = countQuery.or(searchFilter);
      dataQuery = dataQuery.or(searchFilter);
    }
    if (category) {
      countQuery = countQuery.eq("category", category);
      dataQuery = dataQuery.eq("category", category);
    }
    if (department_id) {
      countQuery = countQuery.eq("department_id", department_id);
      dataQuery = dataQuery.eq("department_id", department_id);
    }
    if (status === "available") {
      countQuery = countQuery.gt("available_copies", 0);
      dataQuery = dataQuery.gt("available_copies", 0);
    } else if (status === "unavailable") {
      countQuery = countQuery.eq("available_copies", 0);
      dataQuery = dataQuery.eq("available_copies", 0);
    }

    const { count, error: countError } = await countQuery;
    if (countError) {
      return NextResponse.json<ApiListResponse<LibraryBook>>(
        { success: false, data: null, error: countError.message },
        { status: 500 }
      );
    }

    const from = (page - 1) * per_page;
    const to = from + per_page - 1;

    const { data, error } = await dataQuery
      .order(sort_by, { ascending: sort_order === "asc" })
      .range(from, to);

    if (error) {
      return NextResponse.json<ApiListResponse<LibraryBook>>(
        { success: false, data: null, error: error.message },
        { status: 500 }
      );
    }

    const total = count || 0;
    const total_pages = Math.ceil(total / per_page);

    return NextResponse.json<ApiListResponse<LibraryBook>>({
      success: true,
      data: {
        items: (data || []) as LibraryBook[],
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
    return NextResponse.json<ApiListResponse<LibraryBook>>(
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

    const {
      isbn,
      title,
      author,
      publisher,
      edition,
      category,
      department_id,
      total_copies,
      rack_number,
      price,
    } = body;

    if (!title || !author) {
      return NextResponse.json<ApiSingleResponse<LibraryBook>>(
        { success: false, data: null, error: "Title and author are required" },
        { status: 400 }
      );
    }

    const { data: existing } = await supabase
      .from("library_books")
      .select("id")
      .eq("isbn", isbn)
      .single();

    if (existing) {
      const { data: updated, error } = await supabase
        .from("library_books")
        .update({
          total_copies: existing ? undefined : total_copies,
          available_copies: total_copies,
          updated_at: new Date().toISOString(),
        })
        .eq("isbn", isbn)
        .select()
        .single();

      if (error) {
        return NextResponse.json<ApiSingleResponse<LibraryBook>>(
          { success: false, data: null, error: error.message },
          { status: 400 }
        );
      }

      return NextResponse.json<ApiSingleResponse<LibraryBook>>({
        success: true,
        data: updated as LibraryBook,
        error: null,
        message: "Book copies updated",
      });
    }

    const { data: book, error } = await supabase
      .from("library_books")
      .insert({
        isbn: isbn || "",
        title,
        author,
        publisher: publisher || null,
        edition: edition || null,
        category: category || "General",
        department_id: department_id || null,
        total_copies: total_copies || 1,
        available_copies: total_copies || 1,
        rack_number: rack_number || null,
        price: price || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json<ApiSingleResponse<LibraryBook>>(
        { success: false, data: null, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiSingleResponse<LibraryBook>>({
      success: true,
      data: book as LibraryBook,
      error: null,
      message: "Book added successfully",
    });
  } catch (err) {
    return NextResponse.json<ApiSingleResponse<LibraryBook>>(
      {
        success: false,
        data: null,
        error: err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, data: null, error: "Book ID is required" },
        { status: 400 }
      );
    }

    const allowedFields = [
      "isbn", "title", "author", "publisher", "edition", "category",
      "department_id", "total_copies", "available_copies", "rack_number",
      "price", "is_active",
    ];

    const cleanUpdate: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in updateData) {
        cleanUpdate[field] = updateData[field];
      }
    }
    cleanUpdate.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("library_books")
      .update(cleanUpdate)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, data: null, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: data.id },
      error: null,
      message: "Book updated successfully",
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

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const { supabase } = auth;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, data: null, error: "Book ID is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("library_books")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, data: null, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id },
      error: null,
      message: "Book deactivated successfully",
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
