// Server-side only vector store implementation
// File-based storage for persistence

import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const COLLECTION_NAME = "clonewriter";
const STORAGE_DIR = join(process.cwd(), 'vector_store');
const STORAGE_FILE = join(STORAGE_DIR, 'documents.json');

export interface Document {
  id: string;
  text: string;
  metadata?: Record<string, any>;
}

// Load documents from file
async function loadDocuments(): Promise<Document[]> {
  try {
    if (!existsSync(STORAGE_FILE)) {
      return [];
    }
    const data = await readFile(STORAGE_FILE, 'utf-8');
    const docs = JSON.parse(data);
    console.log(`Loaded ${docs.length} documents from storage`);
    return docs;
  } catch (error) {
    console.log('No existing documents found, starting fresh');
    return [];
  }
}

// Save documents to file
async function saveDocuments(docs: Document[]): Promise<void> {
  try {
    await mkdir(STORAGE_DIR, { recursive: true });
    await writeFile(STORAGE_FILE, JSON.stringify(docs, null, 2));
    console.log(`Saved ${docs.length} documents to storage`);
  } catch (error) {
    console.error('Error saving documents:', error);
  }
}

export async function initChromaClient() {
  try {
    const chromaUrl = process.env.CHROMA_URL || "http://localhost:8000";
    const response = await fetch(`${chromaUrl}/api/v2/heartbeat`);
    return response.ok;
  } catch (error) {
    throw new Error('ChromaDB server is not running');
  }
}

export async function getOrCreateCollection() {
  return { id: COLLECTION_NAME, name: COLLECTION_NAME };
}

export async function addDocuments(docs: Document[]): Promise<void> {
  const existing = await loadDocuments();
  const updated = [...existing, ...docs];
  await saveDocuments(updated);
  console.log(`Added ${docs.length} documents. Total: ${updated.length}`);
}

export async function queryDocuments(
  query: string,
  nResults: number = 4
): Promise<{ documents: string[]; metadatas: any[]; distances: number[] }> {
  const documents = await loadDocuments();

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
  const finalResults = results.length > 0 ? results : documents.slice(0, nResults).map(doc => ({ doc, score: 0.3 }));

  console.log(`Returning ${finalResults.length} documents`);

  return {
    documents: finalResults.map((r) => r.doc.text),
    metadatas: finalResults.map((r) => r.doc.metadata || {}),
    distances: finalResults.map((r) => 1 - r.score),
  };
}

export async function clearCollection(): Promise<void> {
  await saveDocuments([]);
  console.log("Collection cleared");
}
