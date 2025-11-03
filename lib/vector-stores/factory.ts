/**
 * Vector Store Factory
 * Creates and manages vector store instances based on configuration
 */

import { IVectorStore, VectorStoreConfig } from './types';
import { FileBasedVectorStore } from './implementations/file-based';
import { ChromaDBVectorStore } from './implementations/chromadb';
import { RedisVectorStore } from './implementations/redis';
import { MariaDBVectorStore } from './implementations/mariadb';

export type VectorStoreType = 'file' | 'chroma' | 'redis' | 'mariadb';

export class VectorStoreFactory {
  private static instance: IVectorStore | null = null;
  private static currentType: VectorStoreType | null = null;

  /**
   * Get the configured vector store type from environment
   */
  static getConfiguredType(): VectorStoreType {
    const type = (process.env.VECTOR_STORE_TYPE || 'file').toLowerCase();

    if (!['file', 'chroma', 'redis', 'mariadb'].includes(type)) {
      console.warn(`Invalid VECTOR_STORE_TYPE: ${type}. Falling back to 'file'`);
      return 'file';
    }

    return type as VectorStoreType;
  }

  /**
   * Create a vector store instance of the specified type
   */
  static create(type?: VectorStoreType, config?: VectorStoreConfig): IVectorStore {
    const storeType = type || this.getConfiguredType();

    console.log(`Creating vector store of type: ${storeType}`);

    switch (storeType) {
      case 'chroma':
        return new ChromaDBVectorStore(config);

      case 'redis':
        return new RedisVectorStore(config);

      case 'mariadb':
        return new MariaDBVectorStore(config);

      case 'file':
      default:
        return new FileBasedVectorStore(config);
    }
  }

  /**
   * Get or create a singleton instance of the vector store
   * This ensures we reuse the same connection throughout the application
   */
  static async getInstance(type?: VectorStoreType, config?: VectorStoreConfig): Promise<IVectorStore> {
    const requestedType = type || this.getConfiguredType();

    // If type changed or no instance exists, create new one
    if (!this.instance || this.currentType !== requestedType) {
      console.log(`Initializing new vector store instance: ${requestedType}`);

      this.instance = this.create(requestedType, config);
      this.currentType = requestedType;

      // Initialize the store
      await this.instance.init();

      // Verify health
      const isHealthy = await this.instance.healthCheck();
      if (!isHealthy) {
        console.warn(`Vector store ${requestedType} health check failed, falling back to file-based store`);

        // Fallback to file-based store
        this.instance = new FileBasedVectorStore(config);
        this.currentType = 'file';
        await this.instance.init();
      }
    }

    return this.instance;
  }

  /**
   * Reset the singleton instance (useful for testing or switching stores)
   */
  static reset(): void {
    this.instance = null;
    this.currentType = null;
  }

  /**
   * Get information about available vector stores
   */
  static getAvailableStores(): Array<{
    type: VectorStoreType;
    name: string;
    description: string;
    requiresExternal: boolean;
  }> {
    return [
      {
        type: 'file',
        name: 'File-based',
        description: 'Simple JSON file storage with keyword matching',
        requiresExternal: false
      },
      {
        type: 'chroma',
        name: 'ChromaDB',
        description: 'ChromaDB with true vector embeddings and similarity search',
        requiresExternal: true
      },
      {
        type: 'redis',
        name: 'Redis Stack',
        description: 'Redis Stack with RediSearch for vector similarity search',
        requiresExternal: true
      },
      {
        type: 'mariadb',
        name: 'MariaDB',
        description: 'MariaDB 11.6+ with vector support for similarity search',
        requiresExternal: true
      }
    ];
  }
}
