"use client";

import { useState } from "react";
import FileUpload from "@/components/FileUpload";
import PromptLibrary from "@/components/PromptLibrary";
import GenerationSettings from "@/components/GenerationSettings";
import StatusIndicator from "@/components/StatusIndicator";
import VoiceAnalysis from "@/components/VoiceAnalysis";
import SessionHistory from "@/components/SessionHistory";
import { saveToHistory, type GenerationEntry } from "@/lib/history-store";
import { GENERATION_MODES } from "@/lib/utils";
import {
  Sparkles,
  Copy,
  Loader2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(512);
  const [topP, setTopP] = useState(0.9);
  const [generating, setGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState("");
  const [context, setContext] = useState<any>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [showSetup, setShowSetup] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisKey, setAnalysisKey] = useState(0);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | undefined>();
  const [historyKey, setHistoryKey] = useState(0);
  const [currentMode, setCurrentMode] = useState("Balanced");

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setGenerating(true);
    setError("");
    setGeneratedText("");
    setContext(null);

    console.log("Starting generation...");

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          temperature,
          max_tokens: maxTokens,
          top_p: topP,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      console.log("API Response:", data);

      if (response.ok) {
        if (data.response && data.response.trim()) {
          setGeneratedText(data.response);
          setContext(data.context);
          console.log("Generation successful!");

          // Save to history
          const historyEntry = saveToHistory({
            prompt,
            response: data.response,
            settings: {
              temperature,
              maxTokens,
              topP,
              mode: currentMode,
            },
            context: data.context,
            generationTime: data.debug?.generationTime,
          });
          setCurrentHistoryId(historyEntry.id);
          setHistoryKey(prev => prev + 1); // Refresh history component
        } else {
          setError("Generated response was empty. Try a different prompt or increase max length.");
        }
      } else {
        const errorMsg = data.error || data.details || "Generation failed";
        console.error("Generation error:", errorMsg);
        setError(errorMsg);
      }
    } catch (err: any) {
      console.error("Generation exception:", err);

      if (err.name === 'AbortError') {
        setError("Generation timed out. Try using a smaller max length or a faster model.");
      } else {
        setError(err.message || "Failed to generate. Check if Ollama is running.");
      }
    } finally {
      setGenerating(false);
      console.log("Generation complete");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRestoreFromHistory = (entry: GenerationEntry) => {
    setPrompt(entry.prompt);
    setGeneratedText(entry.response);
    setContext(entry.context);
    setTemperature(entry.settings.temperature);
    setMaxTokens(entry.settings.maxTokens);
    setTopP(entry.settings.topP);
    setCurrentMode(entry.settings.mode);
    setCurrentHistoryId(entry.id);
    setError("");

    // Scroll to generated content
    setTimeout(() => {
      const element = document.getElementById('generated-content');
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleRegenerateFromHistory = async (entry: GenerationEntry) => {
    // Restore settings
    setPrompt(entry.prompt);
    setTemperature(entry.settings.temperature);
    setMaxTokens(entry.settings.maxTokens);
    setTopP(entry.settings.topP);
    setCurrentMode(entry.settings.mode);

    // Trigger new generation
    await handleGenerate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-foreground to-muted-foreground flex items-center justify-center">
                <Brain className="w-6 h-6 text-background" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  CloneWriter
                </h1>
                <p className="text-xs text-muted-foreground">
                  AI Voice Cloning with Local LLMs
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <StatusIndicator />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold text-balance">
              Clone Your Writing Voice with{" "}
              <span className="relative inline-block">
                <span className="relative z-10">100% Privacy</span>
                <span className="absolute bottom-1 left-0 w-full h-3 bg-foreground/10 -z-0"></span>
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
              Build a private AI agent that generates content in your personal
              writing style using local LLMs powered by Ollama
            </p>
          </div>

          {/* Setup Section */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg animate-slide-up">
            <button
              onClick={() => setShowSetup(!showSetup)}
              className="w-full px-6 py-4 flex items-center justify-between bg-muted/50 hover:bg-muted transition-colors"
            >
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Setup & Upload Your Voice Data
              </h3>
              {showSetup ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>
            {showSetup && (
              <div className="p-6 animate-fade-in">
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                      <h4 className="font-semibold text-sm">📋 Prerequisites</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Install and run Ollama: <code className="bg-background px-1 rounded">ollama serve</code></li>
                        <li>• Pull a model: <code className="bg-background px-1 rounded">ollama pull llama3.2:3b</code></li>
                        <li>• Install ChromaDB: <code className="bg-background px-1 rounded">pip install chromadb</code></li>
                        <li>• Run ChromaDB: <code className="bg-background px-1 rounded">chroma run --path ./vector_store</code></li>
                      </ul>
                    </div>
                  </div>
                  <FileUpload
                    onUploadComplete={() => {
                      console.log("Upload complete");
                      setShowAnalysis(true);
                      setAnalysisKey(prev => prev + 1); // Force re-render of analysis
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Voice Analysis Dashboard */}
          {showAnalysis && (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
              <VoiceAnalysis key={analysisKey} />
            </div>
          )}

          {/* Main Generation Area */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_380px_280px] gap-6">
            {/* Left Column - Prompt & Generation */}
            <div className="space-y-6 min-w-0">
              {/* Prompt Library */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
                <PromptLibrary onSelectPrompt={setPrompt} />
              </div>

              {/* Prompt Input */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
                <label className="block text-sm font-medium mb-3">
                  ✏️ Your Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., 'Write a tweet about AI privacy' or 'Draft a professional email to my team'"
                  className="w-full h-32 px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
                <button
                  onClick={handleGenerate}
                  disabled={generating || !prompt.trim()}
                  className={cn(
                    "mt-4 w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2",
                    generating || !prompt.trim()
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : "bg-foreground text-background hover:opacity-90 hover:scale-[1.02] shadow-lg"
                  )}
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating in your voice...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Content
                    </>
                  )}
                </button>
              </div>

              {/* Generated Output */}
              {(generatedText || error) && (
                <div id="generated-content" className="bg-card border border-border rounded-2xl p-6 shadow-lg animate-fade-in">
                  {error ? (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-600">
                      <p className="font-medium">❌ Error</p>
                      <p className="text-sm mt-1">{error}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          Generated Content
                        </h3>
                        <button
                          onClick={handleCopy}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                        >
                          {copied ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                      <div className="prose prose-sm max-w-none">
                        <div className="bg-background rounded-lg p-4 border border-border">
                          <p className="whitespace-pre-wrap">{generatedText}</p>
                        </div>
                      </div>

                      {/* Context */}
                      {context && (
                        <div>
                          <button
                            onClick={() => setShowContext(!showContext)}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showContext ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                            Show Retrieved Context ({context.chunks.length} chunks)
                          </button>
                          {showContext && (
                            <div className="mt-4 space-y-3 animate-fade-in">
                              {context.chunks.map((chunk: string, i: number) => (
                                <div
                                  key={i}
                                  className="bg-muted/50 rounded-lg p-3 text-sm"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-medium text-xs">
                                      Context {i + 1}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      Similarity:{" "}
                                      {(
                                        (1 - (context.distances?.[i] || 0)) *
                                        100
                                      ).toFixed(1)}
                                      %
                                    </span>
                                  </div>
                                  <p className="text-muted-foreground">
                                    {chunk}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Middle Column - Settings */}
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6 shadow-lg sticky top-24">
                <GenerationSettings
                  temperature={temperature}
                  maxTokens={maxTokens}
                  topP={topP}
                  onTemperatureChange={(val) => {
                    setTemperature(val);
                    // Update current mode based on settings
                    const modes = Object.entries(GENERATION_MODES);
                    const matchingMode = modes.find(([_, m]) =>
                      m.temperature === val && m.top_p === topP
                    );
                    if (matchingMode) setCurrentMode(matchingMode[1].label);
                  }}
                  onMaxTokensChange={setMaxTokens}
                  onTopPChange={(val) => {
                    setTopP(val);
                    const modes = Object.entries(GENERATION_MODES);
                    const matchingMode = modes.find(([_, m]) =>
                      m.temperature === temperature && m.top_p === val
                    );
                    if (matchingMode) setCurrentMode(matchingMode[1].label);
                  }}
                />
              </div>
            </div>

            {/* Right Column - History (only on xl screens) */}
            <div className="space-y-6 hidden xl:block">
              <div className="sticky top-24">
                <SessionHistory
                  key={historyKey}
                  onRestore={handleRestoreFromHistory}
                  onRegenerate={handleRegenerateFromHistory}
                  currentId={currentHistoryId}
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground space-y-2">
          <p>
            Built with Next.js, Ollama | 100% Private & Local AI | By  <a
              href="https://github.com/harishkotra"
              target="_blank">Harish Kotra</a>
          </p>
          <p>
            <a
              href="https://github.com/harishkotra/clonewriter"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-foreground hover:underline font-medium"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              Deploy Your Own
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
