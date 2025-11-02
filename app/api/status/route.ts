import { NextResponse } from "next/server";
import { checkOllamaStatus } from "@/lib/ollama";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Check Ollama status
    const ollamaStatus = await checkOllamaStatus();

    // Check ChromaDB status
    let chromaStatus = { running: false, collections: 0 };
    try {
      const chromaUrl = process.env.CHROMA_URL || "http://localhost:8000";

      // Check v2 heartbeat endpoint
      const response = await fetch(`${chromaUrl}/api/v2/heartbeat`, {
        method: 'GET',
      }).catch(() => null);

      if (response && response.ok) {
        chromaStatus = {
          running: true,
          collections: 0,
        };
      } else {
        console.log("ChromaDB check failed:", response?.status);
      }
    } catch (error: any) {
      console.log("ChromaDB not accessible:", error.message);
    }

    return NextResponse.json({
      ollama: ollamaStatus,
      chroma: chromaStatus,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to check service status",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
