import { NextResponse } from "next/server";
import { checkOllamaStatus } from "@/lib/ollama";
import { getVectorStoreInfo } from "@/lib/vector-store.server";
import { VectorStoreFactory } from "@/lib/vector-stores/factory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Check Ollama status
    const ollamaStatus = await checkOllamaStatus();

    // Check vector store status (supports ChromaDB, Redis, MariaDB, or file-based)
    let vectorStoreStatus = { 
      running: false, 
      type: 'unknown',
      collections: 0 
    };
    
    try {
      const storeInfo = await getVectorStoreInfo();
      const storeType = VectorStoreFactory.getConfiguredType();
      
      // Use getInstance() which properly initializes the store
      const store = await VectorStoreFactory.getInstance(storeType);
      const isHealthy = await store.healthCheck();
      
      if (isHealthy) {
        const collection = await store.getOrCreateCollection();
        vectorStoreStatus = {
          running: true,
          type: storeType,
          collections: collection.count || 0,
        };
      }
    } catch (error: any) {
      console.log("Vector store not accessible:", error.message);
      vectorStoreStatus.type = VectorStoreFactory.getConfiguredType();
    }

    return NextResponse.json({
      ollama: ollamaStatus,
      vectorStore: vectorStoreStatus,
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
