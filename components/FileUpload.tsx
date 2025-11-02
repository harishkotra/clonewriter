"use client";

import { useState, useRef } from "react";
import { Upload, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onUploadComplete?: () => void;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (file) =>
        file.name.endsWith(".csv") ||
        file.name.endsWith(".json") ||
        file.name.endsWith(".txt")
    );
    setFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setStatus({ type: null, message: "" });

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("rebuild", "true"); // Rebuild vector store

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          type: "success",
          message: data.message || "Files uploaded successfully!",
        });
        setFiles([]);
        onUploadComplete?.();
      } else {
        setStatus({
          type: "error",
          message: data.error || "Upload failed",
        });
      }
    } catch (error) {
      setStatus({
        type: "error",
        message: "Failed to upload files. Is ChromaDB running?",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border hover:border-primary/50 hover:bg-muted/50"
        )}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-medium mb-2">
          {files.length > 0
            ? `${files.length} file(s) selected`
            : "Drop your writing samples here"}
        </p>
        <p className="text-sm text-muted-foreground">
          Supports CSV, JSON, and TXT files
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".csv,.json,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Selected files:</p>
          <div className="space-y-1">
            {files.map((file, index) => (
              <div
                key={index}
                className="text-sm text-muted-foreground bg-muted/50 rounded px-3 py-2 flex items-center justify-between"
              >
                <span>{file.name}</span>
                <span className="text-xs">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={cn(
              "w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2",
              uploading
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:opacity-90 hover:scale-[1.02]"
            )}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Build Vector Store
              </>
            )}
          </button>
        </div>
      )}

      {status.type && (
        <div
          className={cn(
            "p-4 rounded-lg flex items-start gap-3 animate-fade-in",
            status.type === "success"
              ? "bg-green-500/10 text-green-700 dark:text-green-400"
              : "bg-red-500/10 text-red-700 dark:text-red-400"
          )}
        >
          {status.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <p className="text-sm">{status.message}</p>
        </div>
      )}
    </div>
  );
}
