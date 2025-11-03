/**
 * Test script for vector stores
 * Run with: npx tsx scripts/test-vector-stores.ts
 */

import { VectorStoreFactory } from '../lib/vector-stores/factory';
import type { Document } from '../lib/vector-stores/types';

async function testVectorStore(type: 'file' | 'chroma' | 'redis' | 'mariadb') {
  console.log(`\n=== Testing ${type.toUpperCase()} Vector Store ===\n`);

  try {
    // Create store
    const store = VectorStoreFactory.create(type);

    // Health check
    console.log('1. Health check...');
    const isHealthy = await store.healthCheck();
    console.log(`   ✓ Health check: ${isHealthy ? 'PASSED' : 'FAILED'}`);

    if (!isHealthy && type !== 'file') {
      console.log(`   ⚠ ${type} is not running. Skipping further tests.\n`);
      return;
    }

    // Initialize
    console.log('2. Initializing...');
    await store.init();
    console.log('   ✓ Initialized successfully');

    // Get or create collection
    console.log('3. Getting collection info...');
    const collectionInfo = await store.getOrCreateCollection();
    console.log(`   ✓ Collection: ${collectionInfo.name} (${collectionInfo.count || 0} documents)`);

    // Add documents
    console.log('4. Adding test documents...');
    const testDocs: Document[] = [
      { id: 'test-1', text: 'The quick brown fox jumps over the lazy dog', metadata: { source: 'test' } },
      { id: 'test-2', text: 'Machine learning is a subset of artificial intelligence', metadata: { source: 'test' } },
      { id: 'test-3', text: 'Vector databases are used for similarity search', metadata: { source: 'test' } }
    ];
    await store.addDocuments(testDocs);
    console.log(`   ✓ Added ${testDocs.length} documents`);

    // Query documents
    console.log('5. Querying documents...');
    const results = await store.queryDocuments('machine learning', 2);
    console.log(`   ✓ Found ${results.documents.length} documents`);
    console.log(`   - Top result: "${results.documents[0]?.substring(0, 50)}..."`);

    // Clear collection
    console.log('6. Clearing collection...');
    await store.clearCollection();
    console.log('   ✓ Collection cleared');

    console.log(`\n✅ ${type.toUpperCase()} tests completed successfully!\n`);
  } catch (error) {
    console.error(`\n❌ ${type.toUpperCase()} test failed:`, error);
    console.log();
  }
}

async function main() {
  console.log('🧪 Vector Store Testing Suite\n');
  console.log('This script tests all vector store implementations.');
  console.log('Note: External stores (ChromaDB, Redis, MariaDB) must be running.\n');

  // Test file-based store (always available)
  await testVectorStore('file');

  // Test other stores (will skip if not available)
  await testVectorStore('chroma');
  await testVectorStore('redis');
  await testVectorStore('mariadb');

  console.log('🎉 All tests completed!\n');
}

// Run tests
main().catch(console.error);
