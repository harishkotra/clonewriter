import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import Papa from "papaparse";
import { addDocuments, clearCollection, type Document } from "@/lib/vector-store.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function parseCSV(content: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(content, {
      header: true,
      complete: (results) => {
        const texts: string[] = [];
        results.data.forEach((row: any) => {
          // Priority order for text fields (case-insensitive)
          const text =
            row.Text ||
            row.text ||
            row.Content ||
            row.content ||
            row.Message ||
            row.message ||
            row.Tweet ||
            row.tweet ||
            row.Post ||
            row.post ||
            row.full_text ||
            row.Summary ||
            row.summary ||
            row.Description ||
            row.description;

          // Only include text that's substantial (> 50 characters to avoid job titles, names, etc.)
          if (text && typeof text === "string" && text.length > 50) {
            texts.push(text.trim());
          }
        });
        resolve(texts);
      },
      error: (error: any) => reject(error),
    });
  });
}

async function parseJSON(content: string): Promise<string[]> {
  const data = JSON.parse(content);
  const texts: string[] = [];

  if (Array.isArray(data)) {
    data.forEach((item) => {
      if (typeof item === "string") {
        texts.push(item);
      } else if (typeof item === "object") {
        // Try common text fields
        const text =
          item.text ||
          item.content ||
          item.message ||
          item.tweet?.full_text ||
          item.tweet?.text ||
          item.post ||
          item.body;
        if (text && typeof text === "string") {
          texts.push(text);
        }
      }
    });
  } else if (typeof data === "object") {
    // Single object
    const text =
      data.text ||
      data.content ||
      data.message ||
      data.tweet?.full_text ||
      data.post;
    if (text && typeof text === "string") {
      texts.push(text);
    }
  }

  return texts;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const rebuild = formData.get("rebuild") === "true";

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files uploaded" },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "data", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    // If rebuild, clear existing collection
    if (rebuild) {
      await clearCollection();
    }

    const allDocuments: Document[] = [];
    let totalTexts = 0;

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const content = buffer.toString("utf-8");

      // Save file to uploads directory
      const filePath = join(uploadsDir, file.name);
      await writeFile(filePath, buffer);

      let texts: string[] = [];

      // Parse based on file type
      if (file.name.endsWith(".csv")) {
        texts = await parseCSV(content);
      } else if (file.name.endsWith(".json")) {
        texts = await parseJSON(content);
      } else {
        // Plain text
        texts = content.split("\n").filter((line) => line.trim().length > 10);
      }

      // Create documents with unique IDs
      texts.forEach((text, index) => {
        allDocuments.push({
          id: `${file.name}-${totalTexts + index}`,
          text: text.trim(),
          metadata: {
            source: file.name,
            index,
          },
        });
      });

      totalTexts += texts.length;
    }

    // Add documents to vector store in batches
    const batchSize = 100;
    for (let i = 0; i < allDocuments.length; i += batchSize) {
      const batch = allDocuments.slice(i, i + batchSize);
      await addDocuments(batch);
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${files.length} file(s) and added ${totalTexts} documents to vector store`,
      documentCount: totalTexts,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process files" },
      { status: 500 }
    );
  }
}
