/**
 * ChromaDB vector store implementation
 * Uses ChromaDB for true vector embeddings and similarity search
 */

import { IVectorStore, Document, SearchResult, VectorStoreConfig } from '../types';

interface ChromaCollection {
  name: string;
  metadata?: any;
}

interface ChromaAddParams {
  ids: string[];
  documents: string[];
  metadatas?: any[];
}

interface ChromaQueryParams {
  queryTexts: string[];
  nResults?: number;
}

interface ChromaQueryResult {
  documents: string[][];
  metadatas: any[][];
  distances: number[][];
}

export class ChromaDBVectorStore implements IVectorStore {
  private chromaUrl: string;
  private collectionName: string;
  private collection: ChromaCollection | null = null;

  constructor(config?: VectorStoreConfig) {
    this.chromaUrl = process.env.CHROMA_URL || 'http://localhost:8000';
    this.collectionName = config?.collectionName || 'clonewriter';
  }

  async init(): Promise<void> {
    // Check if ChromaDB is available
    const isHealthy = await this.healthCheck();
    if (!isHealthy) {
      throw new Error('ChromaDB server is not running at ' + this.chromaUrl);
    }

    // Get or create collection
    await this.getOrCreateCollection();
    console.log('ChromaDB vector store initialized');
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.chromaUrl}/api/v1/heartbeat`, {
        method: 'GET',
      });
      return response.ok;
    } catch (error) {
      console.error('ChromaDB health check failed:', error);
      return false;
    }
  }

  async getOrCreateCollection(): Promise<{ name: string; count?: number }> {
    try {
      // Try to get existing collection
      const getResponse = await fetch(`${this.chromaUrl}/api/v1/collections/${this.collectionName}`, {
        method: 'GET',
      });

      if (getResponse.ok) {
        this.collection = await getResponse.json();

        // Get collection count
        const countResponse = await fetch(`${this.chromaUrl}/api/v1/collections/${this.collectionName}/count`, {
          method: 'GET',
        });

        const count = countResponse.ok ? await countResponse.json() : undefined;

        return {
          name: this.collectionName,
          count
        };
      }

      // Create new collection if it doesn't exist
      const createResponse = await fetch(`${this.chromaUrl}/api/v1/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: this.collectionName,
          metadata: { description: 'Clonewriter document collection' }
        }),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create collection');
      }

      this.collection = await createResponse.json();
      console.log(`Created new ChromaDB collection: ${this.collectionName}`);

      return {
        name: this.collectionName,
        count: 0
      };
    } catch (error) {
      console.error('Error getting/creating collection:', error);
      throw error;
    }
  }

  async addDocuments(docs: Document[]): Promise<void> {
    if (!this.collection) {
      await this.getOrCreateCollection();
    }

    try {
      const params: ChromaAddParams = {
        ids: docs.map(d => d.id),
        documents: docs.map(d => d.text),
        metadatas: docs.map(d => d.metadata || {})
      };

      const response = await fetch(
        `${this.chromaUrl}/api/v1/collections/${this.collectionName}/add`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to add documents: ${error}`);
      }

      console.log(`Added ${docs.length} documents to ChromaDB`);
    } catch (error) {
      console.error('Error adding documents to ChromaDB:', error);
      throw error;
    }
  }

  async queryDocuments(query: string, nResults: number = 4): Promise<SearchResult> {
    if (!this.collection) {
      await this.getOrCreateCollection();
    }

    try {
      const params: ChromaQueryParams = {
        queryTexts: [query],
        nResults
      };

      const response = await fetch(
        `${this.chromaUrl}/api/v1/collections/${this.collectionName}/query`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to query documents: ${error}`);
      }

      const result: ChromaQueryResult = await response.json();

      console.log(`ChromaDB returned ${result.documents[0]?.length || 0} documents`);

      // ChromaDB returns arrays of arrays, flatten to single arrays
      return {
        documents: result.documents[0] || [],
        metadatas: result.metadatas[0] || [],
        distances: result.distances[0] || [],
      };
    } catch (error) {
      console.error('Error querying ChromaDB:', error);
      throw error;
    }
  }

  async clearCollection(): Promise<void> {
    try {
      // Delete the collection
      const response = await fetch(
        `${this.chromaUrl}/api/v1/collections/${this.collectionName}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete collection');
      }

      this.collection = null;

      // Recreate empty collection
      await this.getOrCreateCollection();

      console.log('ChromaDB collection cleared');
    } catch (error) {
      console.error('Error clearing ChromaDB collection:', error);
      throw error;
    }
  }
}
