import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { analyzeCorpus } from "@/lib/analysis/text-analyzer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STORAGE_FILE = join(process.cwd(), 'vector_store', 'documents.json');

export async function GET() {
  console.log("=== Corpus analysis request ===");

  try {
    // Load documents
    if (!existsSync(STORAGE_FILE)) {
      return NextResponse.json({
        error: "No corpus data found. Please upload your writing samples first.",
      }, { status: 404 });
    }

    const data = await readFile(STORAGE_FILE, 'utf-8');
    const documents = JSON.parse(data);

    console.log(`Analyzing ${documents.length} documents...`);

    if (documents.length === 0) {
      return NextResponse.json({
        error: "No documents in corpus. Please upload your writing samples first.",
      }, { status: 404 });
    }

    // Analyze the corpus
    const analysis = analyzeCorpus(documents);

    console.log("Analysis complete:", {
      documents: analysis.stats.totalDocuments,
      words: analysis.stats.totalWords,
      sentiment: analysis.sentiment.label,
    });

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze corpus",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
