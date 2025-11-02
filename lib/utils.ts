import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const DEFAULT_PROMPTS = {
  "Social Media": [
    "Write a tweet about the future of AI",
    "Draft a LinkedIn post about work-life balance",
    "Create an Instagram caption about learning new skills",
    "Write a Twitter thread about productivity tips",
    "Draft a Facebook post about technology trends",
  ],
  Professional: [
    "Write a professional email to schedule a meeting",
    "Draft a project status update",
    "Create a brief bio for a conference",
    "Write a response to a client inquiry",
    "Draft a team announcement",
  ],
  Creative: [
    "Write a short poem about technology",
    "Create a motivational quote",
    "Draft a short story opening",
    "Write a product description for a new app",
    "Create a vision statement for a startup",
  ],
  Personal: [
    "Write a journal entry about today",
    "Draft a thank you note",
    "Create a personal goal statement",
    "Write a reflection on learning",
    "Draft a birthday message for a friend",
  ],
};

export const GENERATION_MODES = {
  creative: {
    label: "Creative",
    temperature: 0.9,
    top_p: 0.95,
    description: "More diverse and creative outputs",
  },
  balanced: {
    label: "Balanced",
    temperature: 0.7,
    top_p: 0.9,
    description: "Balance between creativity and consistency",
  },
  precise: {
    label: "Precise",
    temperature: 0.3,
    top_p: 0.7,
    description: "More focused and consistent outputs",
  },
};
