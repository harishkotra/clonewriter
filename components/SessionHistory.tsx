"use client";

import { useState, useEffect } from "react";
import { History, Clock, Thermometer, Trash2, RotateCcw, ChevronRight, X } from "lucide-react";
import { getHistory, deleteHistoryEntry, clearHistory, type GenerationEntry } from "@/lib/history-store";
import { cn } from "@/lib/utils";

interface SessionHistoryProps {
  onRestore: (entry: GenerationEntry) => void;
  onRegenerate: (entry: GenerationEntry) => void;
  currentId?: string;
}

export default function SessionHistory({ onRestore, onRegenerate, currentId }: SessionHistoryProps) {
  const [history, setHistory] = useState<GenerationEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const entries = getHistory();
    setHistory(entries);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteHistoryEntry(id);
    loadHistory();
    if (selectedId === id) {
      setSelectedId(null);
    }
  };

  const handleClearAll = () => {
    if (confirm('Clear all history? This cannot be undone.')) {
      clearHistory();
      loadHistory();
      setSelectedId(null);
    }
  };

  const handleRestore = (entry: GenerationEntry) => {
    setSelectedId(entry.id);
    onRestore(entry);
    setExpanded(false);
  };

  const handleRegenerate = (entry: GenerationEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    onRegenerate(entry);
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getSettingsLabel = (settings: GenerationEntry['settings']) => {
    return `T:${settings.temperature} / L:${settings.maxTokens}`;
  };

  if (history.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center">
        <History className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground">No generation history yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Start generating to see your history
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Session History</h3>
          <span className="text-xs text-muted-foreground">({history.length})</span>
        </div>
        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs text-muted-foreground hover:text-red-500 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* History List */}
      <div className="max-h-[600px] overflow-y-auto">
        {history.map((entry, index) => (
          <div
            key={entry.id}
            onClick={() => handleRestore(entry)}
            className={cn(
              "p-4 border-b border-border last:border-b-0 cursor-pointer transition-all duration-200",
              selectedId === entry.id || currentId === entry.id
                ? "bg-primary/10 border-l-4 border-l-primary"
                : "hover:bg-muted/50"
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {formatTime(entry.timestamp)}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => handleRegenerate(entry, e)}
                  className="p-1 rounded hover:bg-primary/20 text-primary transition-colors"
                  title="Regenerate with same settings"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => handleDelete(entry.id, e)}
                  className="p-1 rounded hover:bg-red-500/20 text-red-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Prompt */}
            <div className="mb-2">
              <p className="text-sm font-medium line-clamp-2">{entry.prompt}</p>
            </div>

            {/* Response Preview */}
            <div className="mb-2">
              <p className="text-xs text-muted-foreground line-clamp-2">
                {entry.response}
              </p>
            </div>

            {/* Settings */}
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Thermometer className="w-3 h-3" />
                {getSettingsLabel(entry.settings)}
              </div>
              {entry.generationTime && (
                <div className="text-muted-foreground">
                  {(entry.generationTime / 1000).toFixed(1)}s
                </div>
              )}
              <div className="flex-1" />
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Compact version for mobile/sidebar
export function SessionHistoryCompact({ onRestore, onRegenerate, currentId }: SessionHistoryProps) {
  const [history, setHistory] = useState<GenerationEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleRestore = (entry: GenerationEntry) => {
    onRestore(entry);
    setIsOpen(false);
  };

  if (history.length === 0) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-50"
      >
        <History className="w-6 h-6" />
        {history.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground rounded-full text-xs flex items-center justify-center font-bold">
            {history.length}
          </span>
        )}
      </button>

      {/* Slide-over Panel */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background z-50 shadow-2xl overflow-hidden animate-slide-in-right">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-lg">Session History</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto h-[calc(100vh-73px)]">
              <SessionHistory
                onRestore={handleRestore}
                onRegenerate={onRegenerate}
                currentId={currentId}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
