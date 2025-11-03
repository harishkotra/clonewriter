/**
 * MariaDB vector store implementation
 * Uses MariaDB 11.6+ with vector support for similarity search
 */

import { IVectorStore, Document, SearchResult, VectorStoreConfig } from '../types';

// Simple embedding function (same as Redis implementation for consistency)
function simpleTextEmbedding(text: string, dimensions: number = 384): number[] {
  const words = text.toLowerCase().split(/\s+/);
  const vector = new Array(dimensions).fill(0);

  words.forEach((word, idx) => {
    for (let i = 0; i < word.length; i++) {
      const charCode = word.charCodeAt(i);
      const position = (charCode + idx) % dimensions;
      vector[position] += charCode / 1000;
    }
  });

  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return magnitude > 0 ? vector.map(v => v / magnitude) : vector;
}

export class MariaDBVectorStore implements IVectorStore {
  private connection: any = null;
  private collectionName: string;
  private tableName: string;
  private dimensions: number;
  private config: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };

  constructor(config?: VectorStoreConfig) {
    this.collectionName = config?.collectionName || 'clonewriter';
    this.tableName = `${this.collectionName}_documents`;
    this.dimensions = 384;

    this.config = {
      host: process.env.MARIADB_HOST || 'localhost',
      port: parseInt(process.env.MARIADB_PORT || '3306'),
      user: process.env.MARIADB_USER || 'root',
      password: process.env.MARIADB_PASSWORD || '',
      database: process.env.MARIADB_DATABASE || 'clonewriter'
    };
  }

  async init(): Promise<void> {
    try {
      // Dynamic import of mariadb
      let mariadb;
      try {
        mariadb = await import('mariadb');
      } catch (importError) {
        throw new Error(
          'MariaDB module not installed. Run: npm install mariadb\n' +
          'Note: This is an optional dependency for MariaDB vector store support.'
        );
      }

      this.connection = await mariadb.createConnection(this.config);

      // Create database if not exists
      await this.connection.query(`CREATE DATABASE IF NOT EXISTS ${this.config.database}`);
      await this.connection.query(`USE ${this.config.database}`);

      // Create table for documents
      await this.createTableIfNotExists();

      console.log('MariaDB vector store initialized');
    } catch (error) {
      console.error('Failed to initialize MariaDB:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.connection) {
        let mariadb;
        try {
          mariadb = await import('mariadb');
        } catch (importError) {
          console.warn('MariaDB module not installed');
          return false;
        }
        const testConn = await mariadb.createConnection(this.config);
        await testConn.query('SELECT 1');
        await testConn.end();
        return true;
      }
      await this.connection.query('SELECT 1');
      return true;
    } catch (error) {
      console.error('MariaDB health check failed:', error);
      return false;
    }
  }

  async getOrCreateCollection(): Promise<{ name: string; count?: number }> {
    try {
      const result = await this.connection.query(
        `SELECT COUNT(*) as count FROM ${this.tableName}`
      );

      return {
        name: this.collectionName,
        count: result[0]?.count || 0
      };
    } catch (error) {
      // Table doesn't exist yet
      await this.createTableIfNotExists();
      return { name: this.collectionName, count: 0 };
    }
  }

  async addDocuments(docs: Document[]): Promise<void> {
    if (!this.connection) {
      throw new Error('MariaDB connection not initialized');
    }

    try {
      for (const doc of docs) {
        const embedding = simpleTextEmbedding(doc.text, this.dimensions);
        const vectorString = `[${embedding.join(',')}]`;

        await this.connection.query(
          `INSERT INTO ${this.tableName} (id, text, metadata, vector) VALUES (?, ?, ?, ?)`,
          [
            doc.id,
            doc.text,
            JSON.stringify(doc.metadata || {}),
            vectorString
          ]
        );
      }

      console.log(`Added ${docs.length} documents to MariaDB`);
    } catch (error) {
      console.error('Error adding documents to MariaDB:', error);
      throw error;
    }
  }

  async queryDocuments(query: string, nResults: number = 4): Promise<SearchResult> {
    if (!this.connection) {
      throw new Error('MariaDB connection not initialized');
    }

    try {
      const queryEmbedding = simpleTextEmbedding(query, this.dimensions);
      const vectorString = `[${queryEmbedding.join(',')}]`;

      // Use cosine similarity for vector search
      // Note: MariaDB 11.6+ supports VEC_DISTANCE_COSINE
      const results = await this.connection.query(
        `SELECT
          id,
          text,
          metadata,
          VEC_DISTANCE_COSINE(vector, ?) as distance
        FROM ${this.tableName}
        ORDER BY distance ASC
        LIMIT ?`,
        [vectorString, nResults]
      );

      const documents: string[] = [];
      const metadatas: any[] = [];
      const distances: number[] = [];

      for (const row of results) {
        documents.push(row.text);
        metadatas.push(JSON.parse(row.metadata || '{}'));
        distances.push(parseFloat(row.distance || '1.0'));
      }

      console.log(`MariaDB returned ${documents.length} documents`);

      return { documents, metadatas, distances };
    } catch (error) {
      console.error('Error querying MariaDB:', error);

      // Fallback to keyword search if vector search fails
      return await this.keywordSearch(query, nResults);
    }
  }

  async clearCollection(): Promise<void> {
    if (!this.connection) {
      throw new Error('MariaDB connection not initialized');
    }

    try {
      await this.connection.query(`DELETE FROM ${this.tableName}`);
      console.log('MariaDB collection cleared');
    } catch (error) {
      console.error('Error clearing MariaDB collection:', error);
      throw error;
    }
  }

  // Private helper methods
  private async createTableIfNotExists(): Promise<void> {
    try {
      // Check MariaDB version for vector support
      const versionResult = await this.connection.query('SELECT VERSION() as version');
      const version = versionResult[0]?.version || '';
      console.log(`MariaDB version: ${version}`);

      // Create table with vector column if supported
      // For older versions, we'll use JSON to store vectors
      const hasVectorSupport = this.checkVectorSupport(version);

      if (hasVectorSupport) {
        await this.connection.query(`
          CREATE TABLE IF NOT EXISTS ${this.tableName} (
            id VARCHAR(255) PRIMARY KEY,
            text TEXT NOT NULL,
            metadata JSON,
            vector VECTOR(${this.dimensions}) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_vector USING HNSW (vector)
          ) ENGINE=InnoDB
        `);
      } else {
        // Fallback for older MariaDB versions
        await this.connection.query(`
          CREATE TABLE IF NOT EXISTS ${this.tableName} (
            id VARCHAR(255) PRIMARY KEY,
            text TEXT NOT NULL,
            metadata JSON,
            vector JSON NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ) ENGINE=InnoDB
        `);
      }

      console.log(`MariaDB table ${this.tableName} ready`);
    } catch (error) {
      console.error('Error creating MariaDB table:', error);
      throw error;
    }
  }

  private checkVectorSupport(version: string): boolean {
    // MariaDB 11.6+ has vector support
    const match = version.match(/^(\d+)\.(\d+)/);
    if (!match) return false;

    const major = parseInt(match[1]);
    const minor = parseInt(match[2]);

    return major > 11 || (major === 11 && minor >= 6);
  }

  private async keywordSearch(query: string, nResults: number): Promise<SearchResult> {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);

    // Build LIKE conditions for keyword matching
    const likeConditions = queryWords.map(() => 'LOWER(text) LIKE ?').join(' OR ');
    const params = queryWords.map(word => `%${word}%`);

    const results = await this.connection.query(
      `SELECT id, text, metadata FROM ${this.tableName} WHERE ${likeConditions} LIMIT ?`,
      [...params, nResults]
    );

    const documents: string[] = [];
    const metadatas: any[] = [];
    const distances: number[] = [];

    for (const row of results) {
      documents.push(row.text);
      metadatas.push(JSON.parse(row.metadata || '{}'));
      distances.push(0.5); // Default distance for keyword matches
    }

    return { documents, metadatas, distances };
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
  }
}
