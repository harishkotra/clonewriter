/**
 * Common types for vector store implementations
 */

export interface Document {
  id: string;
  text: string;
  metadata?: Record<string, any>;
}

export interface SearchResult {
  documents: string[];
  metadatas: any[];
  distances: number[];
}

export interface VectorStoreConfig {
  collectionName?: string;
  [key: string]: any;
}

/**
 * Interface that all vector store implementations must follow
 */
export interface IVectorStore {
  /**
   * Initialize the vector store (connect to DB, setup, etc.)
   */
  init(): Promise<void>;

  /**
   * Add documents to the collection
   */
  addDocuments(documents: Document[]): Promise<void>;

  /**
   * Query documents by text and return top matches
   */
  queryDocuments(query: string, nResults?: number): Promise<SearchResult>;

  /**
   * Clear all documents from the collection
   */
  clearCollection(): Promise<void>;

  /**
   * Get collection metadata
   */
  getOrCreateCollection(): Promise<{ name: string; count?: number }>;

  /**
   * Health check for the vector store
   */
  healthCheck(): Promise<boolean>;
}
