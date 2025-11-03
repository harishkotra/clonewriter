/**
 * Vector Store Server
 * Main entry point for vector store operations
 * Automatically uses the configured vector store type from environment
 */

import { VectorStoreFactory } from './vector-stores/factory';
import type { Document, SearchResult } from './vector-stores/types';

// Re-export types for backward compatibility
export type { Document };

/**
 * Get the vector store instance
 * This will use the VECTOR_STORE_TYPE environment variable to determine which store to use
 */
async function getVectorStore() {
  return await VectorStoreFactory.getInstance();
}

/**
 * Initialize the vector store (for backward compatibility)
 */
export async function initChromaClient() {
  try {
    const store = await getVectorStore();
    return await store.healthCheck();
  } catch (error) {
    console.error('Vector store initialization failed:', error);
    return false;
  }
}

/**
 * Get or create collection
 */
export async function getOrCreateCollection() {
  const store = await getVectorStore();
  return await store.getOrCreateCollection();
}

/**
 * Add documents to the vector store
 */
export async function addDocuments(docs: Document[]): Promise<void> {
  const store = await getVectorStore();
  await store.addDocuments(docs);
}

/**
 * Query documents from the vector store
 */
export async function queryDocuments(
  query: string,
  nResults: number = 4
): Promise<{ documents: string[]; metadatas: any[]; distances: number[] }> {
  const store = await getVectorStore();
  return await store.queryDocuments(query, nResults);
}

/**
 * Clear all documents from the collection
 */
export async function clearCollection(): Promise<void> {
  const store = await getVectorStore();
  await store.clearCollection();
}

/**
 * Get information about the current vector store
 */
export async function getVectorStoreInfo() {
  const type = VectorStoreFactory.getConfiguredType();
  const availableStores = VectorStoreFactory.getAvailableStores();
  const currentStore = availableStores.find(s => s.type === type);

  return {
    currentType: type,
    currentStore,
    availableStores
  };
}
