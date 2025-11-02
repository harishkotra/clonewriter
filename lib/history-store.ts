// Client-side history storage using localStorage

export interface GenerationEntry {
  id: string;
  timestamp: number;
  prompt: string;
  response: string;
  settings: {
    temperature: number;
    maxTokens: number;
    topP: number;
    mode: string;
  };
  context?: {
    chunks: string[];
    metadatas: any[];
    distances: number[];
  };
  generationTime?: number;
}

const STORAGE_KEY = 'clonewriter_history';
const MAX_HISTORY_ITEMS = 20;

export function saveToHistory(entry: Omit<GenerationEntry, 'id' | 'timestamp'>): GenerationEntry {
  const fullEntry: GenerationEntry = {
    ...entry,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    timestamp: Date.now(),
  };

  const history = getHistory();
  history.unshift(fullEntry); // Add to beginning

  // Keep only last MAX_HISTORY_ITEMS
  const trimmed = history.slice(0, MAX_HISTORY_ITEMS);

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  }

  return fullEntry;
}

export function getHistory(): GenerationEntry[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const history = JSON.parse(stored);
    return Array.isArray(history) ? history : [];
  } catch (error) {
    console.error('Error loading history:', error);
    return [];
  }
}

export function getHistoryEntry(id: string): GenerationEntry | null {
  const history = getHistory();
  return history.find(entry => entry.id === id) || null;
}

export function deleteHistoryEntry(id: string): void {
  const history = getHistory();
  const filtered = history.filter(entry => entry.id !== id);

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
}

export function clearHistory(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function exportHistory(): string {
  const history = getHistory();
  return JSON.stringify(history, null, 2);
}

export function importHistory(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (Array.isArray(data)) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error importing history:', error);
    return false;
  }
}
