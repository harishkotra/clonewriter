"use client";

import { useState } from "react";
import { DEFAULT_PROMPTS } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromptLibraryProps {
  onSelectPrompt: (prompt: string) => void;
}

export default function PromptLibrary({ onSelectPrompt }: PromptLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = Object.keys(DEFAULT_PROMPTS);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Prompt Library</h3>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() =>
              setSelectedCategory(
                selectedCategory === category ? null : category
              )
            }
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
              selectedCategory === category
                ? "bg-primary text-primary-foreground shadow-lg scale-105"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:scale-105"
            )}
          >
            {category === "Social Media" && "📱"}
            {category === "Professional" && "💼"}
            {category === "Creative" && "🎨"}
            {category === "Personal" && "👤"}{" "}
            {category}
          </button>
        ))}
      </div>

      {/* Prompts */}
      {selectedCategory && (
        <div className="space-y-2 animate-fade-in">
          <p className="text-sm text-muted-foreground font-medium">
            Click a prompt to use it:
          </p>
          <div className="grid grid-cols-1 gap-2">
            {DEFAULT_PROMPTS[
              selectedCategory as keyof typeof DEFAULT_PROMPTS
            ].map((prompt, index) => (
              <button
                key={index}
                onClick={() => onSelectPrompt(prompt)}
                className="text-left px-4 py-3 rounded-lg bg-card border border-border hover:border-primary hover:bg-card/80 transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
              >
                <p className="text-sm">{prompt}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {!selectedCategory && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">Select a category to see prompts</p>
        </div>
      )}
    </div>
  );
}
