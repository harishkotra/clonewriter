"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative w-14 h-7 rounded-full transition-colors duration-300",
        "bg-muted border border-border hover:bg-muted/80",
        "focus:outline-none focus:ring-2 focus:ring-ring"
      )}
      aria-label="Toggle theme"
    >
      <div
        className={cn(
          "absolute top-0.5 left-0.5 w-6 h-6 rounded-full",
          "bg-foreground transition-transform duration-300 flex items-center justify-center",
          theme === "dark" ? "translate-x-7" : "translate-x-0"
        )}
      >
        {theme === "light" ? (
          <Sun className="w-4 h-4 text-background" />
        ) : (
          <Moon className="w-4 h-4 text-background" />
        )}
      </div>
    </button>
  );
}
