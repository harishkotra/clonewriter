# Vector Stores

This directory contains the vector store implementations for Clonewriter. The application supports multiple vector store backends that can be toggled via environment variables.

## Available Vector Stores

### 1. File-based (Default)
- **Type**: `file`
- **Description**: Simple JSON file storage with keyword matching
- **Requirements**: None (built-in)
- **Pros**:
  - No external dependencies
  - Works out of the box
  - Easy to debug
- **Cons**:
  - Not true vector search (keyword matching only)
  - Slower with large datasets
  - No semantic search

### 2. ChromaDB
- **Type**: `chroma`
- **Description**: ChromaDB with true vector embeddings and similarity search
- **Requirements**: ChromaDB server running
- **Pros**:
  - True semantic search
  - Fast vector similarity
  - Built-in embeddings
- **Cons**:
  - Requires external server
  - More complex setup
- **Setup**:
  ```bash
  # Using Docker
  docker run -p 8000:8000 chromadb/chroma

  # Or install locally
  pip install chromadb
  chroma run --host localhost --port 8000
  ```

### 3. Redis Stack
- **Type**: `redis`
- **Description**: Redis Stack with RediSearch for vector similarity search
- **Requirements**: Redis Stack (not standard Redis)
- **Pros**:
  - Fast in-memory search
  - Scalable
  - Rich query capabilities
- **Cons**:
  - Requires Redis Stack (not standard Redis)
  - More memory usage
- **Setup**:
  ```bash
  # Using Docker
  docker run -p 6379:6379 redis/redis-stack:latest
  ```

### 4. MariaDB
- **Type**: `mariadb`
- **Description**: MariaDB 11.6+ with vector support for similarity search
- **Requirements**: MariaDB 11.6 or higher
- **Pros**:
  - SQL-based queries
  - ACID compliance
  - Good for existing MariaDB setups
- **Cons**:
  - Requires MariaDB 11.6+
  - Slower than specialized vector DBs
- **Setup**:
  ```bash
  # Using Docker
  docker run -p 3306:3306 -e MYSQL_ROOT_PASSWORD=password mariadb:11.6
  ```

## Configuration

Set the `VECTOR_STORE_TYPE` environment variable in your `.env` file:

```env
# Choose one: file, chroma, redis, mariadb
VECTOR_STORE_TYPE=file
```

### File-based Configuration (Default)
```env
VECTOR_STORE_TYPE=file
# No additional configuration needed
```

### ChromaDB Configuration
```env
VECTOR_STORE_TYPE=chroma
CHROMA_URL=http://localhost:8000
```

### Redis Configuration
```env
VECTOR_STORE_TYPE=redis
REDIS_URL=redis://localhost:6379
```

### MariaDB Configuration
```env
VECTOR_STORE_TYPE=mariadb
MARIADB_HOST=localhost
MARIADB_PORT=3306
MARIADB_USER=root
MARIADB_PASSWORD=your_password
MARIADB_DATABASE=clonewriter
```

## Usage

The vector store is automatically used throughout the application. No code changes are needed to switch between stores - just update the environment variable.

```typescript
import { addDocuments, queryDocuments, clearCollection } from '@/lib/vector-store.server';

// Add documents
await addDocuments([
  { id: '1', text: 'Hello world', metadata: { source: 'test' } }
]);

// Query documents
const results = await queryDocuments('hello', 5);
console.log(results.documents); // ['Hello world']

// Clear collection
await clearCollection();
```

## Architecture

```
lib/vector-stores/
├── types.ts                    # Common interfaces and types
├── factory.ts                  # Factory for creating vector stores
├── implementations/
│   ├── file-based.ts          # File-based implementation
│   ├── chromadb.ts            # ChromaDB implementation
│   ├── redis.ts               # Redis Stack implementation
│   └── mariadb.ts             # MariaDB implementation
└── index.ts                   # Exports
```

All implementations follow the `IVectorStore` interface:

```typescript
interface IVectorStore {
  init(): Promise<void>;
  addDocuments(documents: Document[]): Promise<void>;
  queryDocuments(query: string, nResults?: number): Promise<SearchResult>;
  clearCollection(): Promise<void>;
  getOrCreateCollection(): Promise<{ name: string; count?: number }>;
  healthCheck(): Promise<boolean>;
}
```

## Switching Vector Stores

To switch from one vector store to another:

1. Stop the application
2. Update `VECTOR_STORE_TYPE` in `.env`
3. Configure the appropriate connection settings (URL, credentials, etc.)
4. Start the required vector store service (if external)
5. Restart the application

**Note**: Data is NOT automatically migrated between stores. You'll need to re-upload your documents when switching.

## Fallback Behavior

If a vector store fails to initialize or health check fails, the system automatically falls back to the file-based store to ensure the application continues to work.

## Performance Comparison

| Store | Speed | Semantic Search | Setup Complexity | Memory Usage |
|-------|-------|-----------------|------------------|--------------|
| File  | ⭐⭐   | ❌              | ⭐⭐⭐⭐⭐        | ⭐           |
| Chroma| ⭐⭐⭐⭐ | ✅              | ⭐⭐⭐           | ⭐⭐⭐        |
| Redis | ⭐⭐⭐⭐⭐ | ✅              | ⭐⭐⭐           | ⭐⭐⭐⭐       |
| MariaDB| ⭐⭐⭐ | ✅              | ⭐⭐             | ⭐⭐         |

## Troubleshooting

### ChromaDB connection issues
```bash
# Check if ChromaDB is running
curl http://localhost:8000/api/v1/heartbeat

# Check Docker container
docker ps | grep chroma
```

### Redis connection issues
```bash
# Check if Redis Stack is running
redis-cli ping

# Verify RediSearch module is loaded
redis-cli MODULE LIST
```

### MariaDB connection issues
```bash
# Check MariaDB version
mysql -u root -p -e "SELECT VERSION();"

# Verify vector support
mysql -u root -p -e "SHOW PLUGINS LIKE 'vector';"
```

## Development

To add a new vector store:

1. Create a new implementation in `implementations/`
2. Implement the `IVectorStore` interface
3. Add the type to `VectorStoreType` in `factory.ts`
4. Add a case in the factory's `create()` method
5. Update this README with configuration details
