"use client";

import { GENERATION_MODES } from "@/lib/utils";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface GenerationSettingsProps {
  temperature: number;
  maxTokens: number;
  topP: number;
  onTemperatureChange: (value: number) => void;
  onMaxTokensChange: (value: number) => void;
  onTopPChange: (value: number) => void;
}

export default function GenerationSettings({
  temperature,
  maxTokens,
  topP,
  onTemperatureChange,
  onMaxTokensChange,
  onTopPChange,
}: GenerationSettingsProps) {
  const modes = Object.entries(GENERATION_MODES);

  const handleModeSelect = (mode: keyof typeof GENERATION_MODES) => {
    const settings = GENERATION_MODES[mode];
    onTemperatureChange(settings.temperature);
    onTopPChange(settings.top_p);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Generation Settings</h3>
      </div>

      {/* Quick Mode Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Quick Modes</label>
        <div className="grid grid-cols-1 gap-2">
          {modes.map(([key, mode]) => (
            <button
              key={key}
              onClick={() =>
                handleModeSelect(key as keyof typeof GENERATION_MODES)
              }
              className={cn(
                "p-3 rounded-lg border text-left transition-all duration-200 hover:scale-[1.02]",
                temperature === mode.temperature && topP === mode.top_p
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/50"
              )}
            >
              <div className="font-medium text-sm">{mode.label}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {mode.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Temperature */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Temperature</label>
          <span className="text-sm text-muted-foreground font-mono">
            {temperature.toFixed(2)}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={temperature}
          onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <p className="text-xs text-muted-foreground">
          Higher values = more creative, lower values = more focused
        </p>
      </div>

      {/* Max Tokens */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Max Length</label>
          <span className="text-sm text-muted-foreground font-mono">
            {maxTokens}
          </span>
        </div>
        <input
          type="range"
          min="100"
          max="2000"
          step="100"
          value={maxTokens}
          onChange={(e) => onMaxTokensChange(parseInt(e.target.value))}
          className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <p className="text-xs text-muted-foreground">
          Maximum number of tokens to generate
        </p>
      </div>

      {/* Top P */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Top P</label>
          <span className="text-sm text-muted-foreground font-mono">
            {topP.toFixed(2)}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={topP}
          onChange={(e) => onTopPChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <p className="text-xs text-muted-foreground">
          Controls diversity of word choices
        </p>
      </div>
    </div>
  );
}
