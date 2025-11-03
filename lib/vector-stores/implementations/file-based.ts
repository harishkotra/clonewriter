/**
 * File-based vector store implementation
 * Uses simple JSON file storage with keyword matching
 */

import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { IVectorStore, Document, SearchResult, VectorStoreConfig } from '../types';

export class FileBasedVectorStore implements IVectorStore {
  private storageDir: string;
  private storageFile: string;
  private collectionName: string;

  constructor(config?: VectorStoreConfig) {
    this.collectionName = config?.collectionName || 'clonewriter';
    this.storageDir = join(process.cwd(), 'vector_store');
    this.storageFile = join(this.storageDir, 'documents.json');
  }

  async init(): Promise<void> {
    // Ensure storage directory exists
    await mkdir(this.storageDir, { recursive: true });
    console.log('File-based vector store initialized');
  }

  async healthCheck(): Promise<boolean> {
    try {
      await mkdir(this.storageDir, { recursive: true });
      return true;
    } catch {
      return false;
    }
  }

  async getOrCreateCollection(): Promise<{ name: string; count?: number }> {
    const docs = await this.loadDocuments();
    return {
      name: this.collectionName,
      count: docs.length
    };
  }

  async addDocuments(docs: Document[]): Promise<void> {
    const existing = await this.loadDocuments();
    const updated = [...existing, ...docs];
    await this.saveDocuments(updated);
    console.log(`Added ${docs.length} documents. Total: ${updated.length}`);
  }

  async queryDocuments(query: string, nResults: number = 4): Promise<SearchResult> {
    const documents = await this.loadDocuments();

    console.log(`Querying ${documents.length} documents for: "${query}"`);

    if (documents.length === 0) {
      console.log('No documents in storage!');
      return {
        documents: [],
        metadatas: [],
        distances: [],
      };
    }

    // Simple keyword matching
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);

    const results = documents
      .map((doc) => {
        const textLower = doc.text.toLowerCase();
        // Score based on how many query words appear in the document
        const score = queryWords.filter(word => textLower.includes(word)).length / queryWords.length;
        return { doc, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, nResults);

    // Always return at least some documents
    const finalResults = results.length > 0
      ? results
      : documents.slice(0, nResults).map(doc => ({ doc, score: 0.3 }));

    console.log(`Returning ${finalResults.length} documents`);

    return {
      documents: finalResults.map((r) => r.doc.text),
      metadatas: finalResults.map((r) => r.doc.metadata || {}),
      distances: finalResults.map((r) => 1 - r.score),
    };
  }

  async clearCollection(): Promise<void> {
    await this.saveDocuments([]);
    console.log('Collection cleared');
  }

  // Private helper methods
  private async loadDocuments(): Promise<Document[]> {
    try {
      if (!existsSync(this.storageFile)) {
        return [];
      }
      const data = await readFile(this.storageFile, 'utf-8');
      const docs = JSON.parse(data);
      console.log(`Loaded ${docs.length} documents from storage`);
      return docs;
    } catch (error) {
      console.log('No existing documents found, starting fresh');
      return [];
    }
  }

  private async saveDocuments(docs: Document[]): Promise<void> {
    try {
      await mkdir(this.storageDir, { recursive: true });
      await writeFile(this.storageFile, JSON.stringify(docs, null, 2));
      console.log(`Saved ${docs.length} documents to storage`);
    } catch (error) {
      console.error('Error saving documents:', error);
    }
  }
}
