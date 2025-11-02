// This file contains server-side only vector store utilities
// Import this ONLY in API routes (server-side code)

export interface Document {
  id: string;
  text: string;
  metadata?: Record<string, any>;
}

// These functions are implemented in the API routes
// This is just a type-safe interface for the client
export type VectorStoreClient = {
  addDocuments: (documents: Document[]) => Promise<void>;
  queryDocuments: (query: string, nResults?: number) => Promise<{
    documents: string[];
    metadatas: any[];
    distances: number[];
  }>;
  clearCollection: () => Promise<void>;
};
