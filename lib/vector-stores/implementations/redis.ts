/**
 * Redis vector store implementation
 * Uses Redis Stack with RediSearch for vector similarity search
 * Note: Requires Redis Stack (not standard Redis)
 */

import { IVectorStore, Document, SearchResult, VectorStoreConfig } from '../types';

// Simple embedding function (converts text to a simple vector)
// In production, you'd use a proper embedding model
function simpleTextEmbedding(text: string, dimensions: number = 384): number[] {
  const words = text.toLowerCase().split(/\s+/);
  const vector = new Array(dimensions).fill(0);

  // Simple hash-based embedding
  words.forEach((word, idx) => {
    for (let i = 0; i < word.length; i++) {
      const charCode = word.charCodeAt(i);
      const position = (charCode + idx) % dimensions;
      vector[position] += charCode / 1000;
    }
  });

  // Normalize
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return magnitude > 0 ? vector.map(v => v / magnitude) : vector;
}

export class RedisVectorStore implements IVectorStore {
  private redisUrl: string;
  private collectionName: string;
  private indexName: string;
  private dimensions: number;
  private client: any = null;

  constructor(config?: VectorStoreConfig) {
    this.redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    this.collectionName = config?.collectionName || 'clonewriter';
    this.indexName = `${this.collectionName}_idx`;
    this.dimensions = 384; // Default embedding dimension
  }

  async init(): Promise<void> {
    try {
      // Dynamic import of redis
      let redis;
      try {
        redis = await import('redis');
      } catch (importError) {
        throw new Error(
          'Redis module not installed. Run: npm install redis\n' +
          'Note: This is an optional dependency for Redis vector store support.'
        );
      }

      this.client = redis.createClient({
        url: this.redisUrl
      });

      this.client.on('error', (err: Error) => {
        console.error('Redis Client Error:', err);
      });

      await this.client.connect();

      // Create index if it doesn't exist
      await this.createIndexIfNotExists();

      console.log('Redis vector store initialized');
    } catch (error) {
      console.error('Failed to initialize Redis:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.client) {
        let redis;
        try {
          redis = await import('redis');
        } catch (importError) {
          console.warn('Redis module not installed');
          return false;
        }
        const testClient = redis.createClient({ url: this.redisUrl });
        await testClient.connect();
        const pong = await testClient.ping();
        await testClient.quit();
        return pong === 'PONG';
      }
      const pong = await this.client.ping();
      return pong === 'PONG';
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }

  async getOrCreateCollection(): Promise<{ name: string; count?: number }> {
    try {
      // Count documents with the collection prefix
      const keys = await this.client.keys(`${this.collectionName}:*`);
      return {
        name: this.collectionName,
        count: keys.length
      };
    } catch (error) {
      console.error('Error getting collection info:', error);
      return { name: this.collectionName, count: 0 };
    }
  }

  async addDocuments(docs: Document[]): Promise<void> {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    try {
      for (const doc of docs) {
        const embedding = simpleTextEmbedding(doc.text, this.dimensions);
        const key = `${this.collectionName}:${doc.id}`;

        // Convert embedding to buffer for Redis
        const embeddingBuffer = Buffer.from(new Float32Array(embedding).buffer);

        await this.client.hSet(key, {
          id: doc.id,
          text: doc.text,
          metadata: JSON.stringify(doc.metadata || {}),
          vector: embeddingBuffer
        });
      }

      console.log(`Added ${docs.length} documents to Redis`);
    } catch (error) {
      console.error('Error adding documents to Redis:', error);
      throw error;
    }
  }

  async queryDocuments(query: string, nResults: number = 4): Promise<SearchResult> {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    try {
      const queryEmbedding = simpleTextEmbedding(query, this.dimensions);
      const queryBuffer = Buffer.from(new Float32Array(queryEmbedding).buffer);

      // Use FT.SEARCH with vector similarity
      const results = await this.client.ft.search(
        this.indexName,
        `*=>[KNN ${nResults} @vector $query_vec AS distance]`,
        {
          PARAMS: {
            query_vec: queryBuffer
          },
          RETURN: ['id', 'text', 'metadata', 'distance'],
          SORTBY: 'distance',
          DIALECT: 2
        }
      );

      const documents: string[] = [];
      const metadatas: any[] = [];
      const distances: number[] = [];

      if (results.documents && results.documents.length > 0) {
        for (const doc of results.documents) {
          documents.push(doc.value.text as string);
          metadatas.push(JSON.parse(doc.value.metadata as string || '{}'));
          distances.push(parseFloat(doc.value.distance as string || '1.0'));
        }
      }

      console.log(`Redis returned ${documents.length} documents`);

      return { documents, metadatas, distances };
    } catch (error) {
      console.error('Error querying Redis:', error);

      // Fallback to keyword search if vector search fails
      return await this.keywordSearch(query, nResults);
    }
  }

  async clearCollection(): Promise<void> {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }

    try {
      const keys = await this.client.keys(`${this.collectionName}:*`);

      if (keys.length > 0) {
        await this.client.del(keys);
      }

      console.log(`Cleared ${keys.length} documents from Redis`);
    } catch (error) {
      console.error('Error clearing Redis collection:', error);
      throw error;
    }
  }

  // Private helper methods
  private async createIndexIfNotExists(): Promise<void> {
    try {
      // Check if index exists
      await this.client.ft.info(this.indexName);
      console.log(`Redis index ${this.indexName} already exists`);
    } catch (error) {
      // Index doesn't exist, create it
      try {
        await this.client.ft.create(
          this.indexName,
          {
            '$.id': {
              type: 'TEXT',
              SORTABLE: true,
              AS: 'id'
            },
            '$.text': {
              type: 'TEXT',
              AS: 'text'
            },
            '$.vector': {
              type: 'VECTOR',
              ALGORITHM: 'FLAT',
              TYPE: 'FLOAT32',
              DIM: this.dimensions,
              DISTANCE_METRIC: 'COSINE',
              AS: 'vector'
            }
          },
          {
            ON: 'HASH',
            PREFIX: `${this.collectionName}:`
          }
        );
        console.log(`Created Redis index: ${this.indexName}`);
      } catch (createError) {
        console.error('Error creating Redis index:', createError);
      }
    }
  }

  private async keywordSearch(query: string, nResults: number): Promise<SearchResult> {
    const keys = await this.client.keys(`${this.collectionName}:*`);
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);

    const results: Array<{ text: string; metadata: any; score: number }> = [];

    for (const key of keys) {
      const doc = await this.client.hGetAll(key);
      const textLower = doc.text.toLowerCase();
      const score = queryWords.filter(word => textLower.includes(word)).length / queryWords.length;

      results.push({
        text: doc.text,
        metadata: JSON.parse(doc.metadata || '{}'),
        score
      });
    }

    results.sort((a, b) => b.score - a.score);
    const topResults = results.slice(0, nResults);

    return {
      documents: topResults.map(r => r.text),
      metadatas: topResults.map(r => r.metadata),
      distances: topResults.map(r => 1 - r.score)
    };
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }
}
