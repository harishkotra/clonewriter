import { NextRequest, NextResponse } from "next/server";
import { queryDocuments } from "@/lib/vector-store.server";
import { generateWithOllama } from "@/lib/ollama";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120; // 120 seconds timeout for larger models

export async function POST(request: NextRequest) {
  console.log("=== Generation request received ===");

  try {
    const { prompt, temperature, max_tokens, top_p } = await request.json();
    console.log("Prompt:", prompt);
    console.log("Settings:", { temperature, max_tokens, top_p });

    if (!prompt || typeof prompt !== "string") {
      console.log("Error: No prompt provided");
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Query vector store for relevant context
    console.log("Querying vector store...");
    const { documents, metadatas, distances } = await queryDocuments(prompt, 4);
    console.log(`Found ${documents.length} context documents`);

    if (documents.length === 0) {
      console.log("Error: No documents in vector store");
      return NextResponse.json(
        {
          error:
            "No documents found in vector store. Please upload your writing samples first.",
        },
        { status: 400 }
      );
    }

    // Combine context
    const context = documents.join("\n\n---\n\n");
    console.log("Context length:", context.length, "characters");

    // Generate response using Ollama
    console.log("Calling Ollama for generation...");
    const startTime = Date.now();

    const response = await generateWithOllama(prompt, context, {
      temperature: temperature || 0.7,
      max_tokens: max_tokens || 512,
      top_p: top_p || 0.9,
    });

    const generationTime = Date.now() - startTime;
    console.log(`Generation completed in ${generationTime}ms`);
    console.log("Response length:", response.length, "characters");

    return NextResponse.json({
      success: true,
      response,
      context: {
        chunks: documents,
        metadatas,
        distances,
      },
      debug: {
        generationTime,
        contextLength: context.length,
        responseLength: response.length,
      },
    });
  } catch (error: any) {
    console.error("=== Generation error ===");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);

    return NextResponse.json(
      {
        error: error.message || "Failed to generate response",
        details: `Error: ${error.message}. Make sure Ollama is running (ollama serve) and the model is available.`,
        errorType: error.constructor.name,
      },
      { status: 500 }
    );
  }
}
