"use client";

import { useState, useEffect } from "react";
import { BarChart3, Brain, TrendingUp, FileText, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CorpusAnalysis {
  stats: {
    totalDocuments: number;
    totalWords: number;
    totalSentences: number;
    avgWordsPerDocument: number;
    avgSentenceLength: number;
  };
  keywords: {
    word: string;
    count: number;
    percentage: number;
  }[];
  sentiment: {
    score: number;
    label: string;
    distribution: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
  readability: {
    score: number;
    level: string;
    complexity: string;
  };
  topPhrases: string[];
  writingStyle: {
    avgWordLength: number;
    longWords: number;
    sentenceVariety: string;
  };
}

export default function VoiceAnalysis() {
  const [analysis, setAnalysis] = useState<CorpusAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAnalysis();
  }, []);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/analyze");
      const data = await response.json();

      if (response.ok) {
        setAnalysis(data.analysis);
      } else {
        setError(data.error || "Failed to load analysis");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load analysis");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-3 text-muted-foreground">Analyzing your voice...</span>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
        <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>{error || "No analysis available"}</p>
        <p className="text-sm mt-2">Upload your writing samples to see insights</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
          <Brain className="w-6 h-6 text-background" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Voice Analysis</h2>
          <p className="text-sm text-muted-foreground">
            Insights from your writing corpus
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<FileText className="w-5 h-5" />}
          label="Documents"
          value={analysis.stats.totalDocuments.toLocaleString()}
          color="blue"
        />
        <StatCard
          icon={<BarChart3 className="w-5 h-5" />}
          label="Total Words"
          value={analysis.stats.totalWords.toLocaleString()}
          color="green"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Avg Words/Doc"
          value={analysis.stats.avgWordsPerDocument.toLocaleString()}
          color="purple"
        />
        <StatCard
          icon={<Sparkles className="w-5 h-5" />}
          label="Sentences"
          value={analysis.stats.totalSentences.toLocaleString()}
          color="orange"
        />
      </div>

      {/* Main Analysis Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Sentiment Analysis */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Sentiment Analysis
          </h3>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">{analysis.sentiment.label}</div>
              <div className="text-sm text-muted-foreground">
                Overall Tone
              </div>
            </div>
            <div className="space-y-2">
              <SentimentBar
                label="Positive"
                value={analysis.sentiment.distribution.positive}
                color="bg-foreground"
              />
              <SentimentBar
                label="Neutral"
                value={analysis.sentiment.distribution.neutral}
                color="bg-muted-foreground"
              />
              <SentimentBar
                label="Negative"
                value={analysis.sentiment.distribution.negative}
                color="bg-muted"
              />
            </div>
          </div>
        </div>

        {/* Readability */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Readability
          </h3>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">{analysis.readability.level}</div>
              <div className="text-sm text-muted-foreground">
                Reading Level
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Complexity:</span>
                <span className="font-medium">{analysis.readability.complexity}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Score:</span>
                <span className="font-medium">{analysis.readability.score}/100</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-3">
                <div
                  className="bg-foreground h-3 rounded-full transition-all duration-500"
                  style={{ width: `${analysis.readability.score}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Top Keywords */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Top Keywords
          </h3>
          <div className="space-y-2">
            {analysis.keywords.slice(0, 10).map((kw, index) => (
              <div
                key={index}
                className="flex items-center gap-3"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{kw.word}</span>
                    <span className="text-xs text-muted-foreground">
                      {kw.count}x
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-1.5">
                    <div
                      className="bg-foreground h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, kw.percentage * 10)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Writing Style */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Writing Style
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Word Length</span>
              <span className="text-lg font-semibold">
                {analysis.writingStyle.avgWordLength} chars
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Complex Words</span>
              <span className="text-lg font-semibold">
                {analysis.writingStyle.longWords}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Sentence Variety</span>
              <span className="text-lg font-semibold">
                {analysis.writingStyle.sentenceVariety}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Avg Sentence Length</span>
              <span className="text-lg font-semibold">
                {analysis.stats.avgSentenceLength} words
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Phrases */}
      {analysis.topPhrases.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Common Phrases</h3>
          <div className="flex flex-wrap gap-2">
            {analysis.topPhrases.map((phrase, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-muted text-foreground rounded-full text-sm font-medium"
              >
                {phrase}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="w-10 h-10 rounded-lg mb-3 flex items-center justify-center text-background bg-foreground">
        {icon}
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function SentimentBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-secondary rounded-full h-2">
        <div
          className={cn("h-2 rounded-full transition-all duration-500", color)}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
