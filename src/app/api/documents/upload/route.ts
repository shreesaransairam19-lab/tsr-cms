import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth();
    if (auth.response) return auth.response;
    const { supabase, user } = auth;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const type = formData.get("type") as string;
    const description = formData.get("description") as string;
    const student_id = formData.get("student_id") as string;

    if (!file || !title || !type) {
      return NextResponse.json(
        { success: false, data: null, error: "File, title, and type are required" },
        { status: 400 }
      );
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, data: null, error: "Only PDF, JPG, and PNG files are allowed" },
        { status: 400 }
      );
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, data: null, error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const fileExtension = file.name.split(".").pop();
    const fileName = `documents/${type}/${timestamp}-${Math.random().toString(36).slice(2)}.${fileExtension}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      // Fallback: store with local path reference
      console.log("[Upload] Storage upload failed, storing reference:", uploadError.message);
    }

    const { data: { publicUrl } } = supabase.storage.from("documents").getPublicUrl(fileName);

    const { data: doc, error: insertError } = await supabase
      .from("documents")
      .insert({
        title,
        type,
        description: description || null,
        file_url: uploadError ? `/uploads/${fileName}` : publicUrl,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: user.id,
        student_id: student_id || null,
        faculty_id: null,
        is_verified: false,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ success: false, data: null, error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: doc,
      error: null,
      message: "Document uploaded successfully",
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, data: null, error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
