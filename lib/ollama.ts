import { Ollama } from "ollama";

const MODEL_NAME = process.env.OLLAMA_MODEL || "llama3.2:3b";

export interface GenerationOptions {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

export async function generateWithOllama(
  prompt: string,
  context: string,
  options: GenerationOptions = {}
): Promise<string> {
  console.log(`Initializing Ollama with model: ${MODEL_NAME}`);

  const ollama = new Ollama({
    host: process.env.OLLAMA_HOST || "http://localhost:11434",
  });

  const {
    temperature = 0.7,
    max_tokens = 512,
    top_p = 0.9,
  } = options;

  const systemPrompt = `You are an AI assistant that writes in the EXACT style and voice of your user.
Your task is to generate new content that sounds indistinguishable from how the user would write it.

STUDY THESE WRITING SAMPLES FROM THE USER:
---
${context}
---

CRITICAL INSTRUCTIONS:
- Match the writing style, tone, vocabulary, and sentence structure EXACTLY
- Use the same level of formality/informality as the user
- Adopt their typical sentence length and punctuation style
- Use their characteristic phrases and expressions
- Write as if the user themselves wrote this - no AI disclaimers or meta-commentary
- Be natural, authentic, and consistent with their voice`;

  const fullPrompt = `${systemPrompt}\n\nTASK TO WRITE IN USER'S VOICE:\n"${prompt}"\n\nNow write exactly as the user would:`;

  try {
    console.log("Sending request to Ollama...");
    console.log("Model:", MODEL_NAME);
    console.log("Temperature:", temperature);
    console.log("Max tokens:", max_tokens);

    const response = await ollama.generate({
      model: MODEL_NAME,
      prompt: fullPrompt,
      options: {
        temperature,
        num_predict: max_tokens,
        top_p,
      },
      stream: false,
    });

    console.log("Ollama response received");

    if (!response.response || response.response.trim().length === 0) {
      throw new Error("Ollama returned an empty response");
    }

    return response.response;
  } catch (error: any) {
    console.error("Ollama generation error:", error);

    if (error.message?.includes("connect")) {
      throw new Error(
        "Cannot connect to Ollama. Make sure it's running with: ollama serve"
      );
    }

    if (error.message?.includes("not found")) {
      throw new Error(
        `Model '${MODEL_NAME}' not found. Pull it with: ollama pull ${MODEL_NAME}`
      );
    }

    throw new Error(
      `Ollama error: ${error.message || "Unknown error occurred"}`
    );
  }
}

export async function checkOllamaStatus(): Promise<{
  running: boolean;
  models: string[];
}> {
  try {
    const ollama = new Ollama({
      host: process.env.OLLAMA_HOST || "http://localhost:11434",
    });
    const models = await ollama.list();
    return {
      running: true,
      models: models.models.map((m) => m.name),
    };
  } catch (error) {
    console.log("Ollama status check failed:", error);
    return {
      running: false,
      models: [],
    };
  }
}
