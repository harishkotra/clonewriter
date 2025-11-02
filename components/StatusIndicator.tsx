"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface Status {
  ollama: {
    running: boolean;
    models: string[];
  };
  chroma: {
    running: boolean;
    collections: number;
  };
}

export default function StatusIndicator() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);

  const checkStatus = async () => {
    try {
      const response = await fetch("/api/status");
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error("Failed to check status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Checking services...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {status?.ollama.running ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : (
          <XCircle className="w-4 h-4 text-red-500" />
        )}
        <span className="text-sm">
          Ollama:{" "}
          <span
            className={
              status?.ollama.running ? "text-green-600" : "text-red-600"
            }
          >
            {status?.ollama.running ? "Running" : "Not running"}
          </span>
        </span>
      </div>
      {status?.ollama.running && status.ollama.models.length > 0 && (
        <div className="ml-6 text-xs text-muted-foreground">
          Models: {status.ollama.models.slice(0, 3).join(", ")}
          {status.ollama.models.length > 3 && (
            <span> +{status.ollama.models.length - 3} more</span>
          )}
        </div>
      )}
      <div className="flex items-center gap-2">
        {status?.chroma.running ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : (
          <XCircle className="w-4 h-4 text-red-500" />
        )}
        <span className="text-sm">
          ChromaDB:{" "}
          <span
            className={
              status?.chroma.running ? "text-green-600" : "text-red-600"
            }
          >
            {status?.chroma.running ? "Running" : "Not running"}
          </span>
        </span>
      </div>
    </div>
  );
}
