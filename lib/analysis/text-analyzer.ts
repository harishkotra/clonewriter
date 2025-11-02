// Text analysis utilities for corpus insights

export interface CorpusAnalysis {
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
    score: number; // -1 to 1
    label: string; // Positive, Neutral, Negative
    distribution: {
      positive: number;
      neutral: number;
      negative: number;
    };
  };
  readability: {
    score: number; // 0-100
    level: string; // e.g., "College Level"
    complexity: string; // Simple, Moderate, Complex
  };
  topPhrases: string[];
  writingStyle: {
    avgWordLength: number;
    longWords: number; // words > 6 chars
    sentenceVariety: string; // Low, Medium, High
  };
}

// Common stop words to exclude
const STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
  'is', 'are', 'was', 'were', 'been', 'has', 'had', 'can', 'could',
  'should', 'would', 'may', 'might', 'must', 'shall', 'will', 'am',
]);

// Positive and negative sentiment words (simplified)
const POSITIVE_WORDS = new Set([
  'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love',
  'best', 'perfect', 'outstanding', 'brilliant', 'impressive', 'incredible',
  'awesome', 'exceptional', 'superb', 'delighted', 'pleased', 'happy',
  'passionate', 'dedicated', 'committed', 'skilled', 'talented', 'expert',
]);

const NEGATIVE_WORDS = new Set([
  'bad', 'poor', 'terrible', 'awful', 'horrible', 'worst', 'hate',
  'difficult', 'problem', 'issue', 'challenge', 'struggle', 'fail',
  'failed', 'failure', 'weak', 'lacking', 'unfortunate', 'disappointing',
]);

export function analyzeCorpus(documents: { text: string }[]): CorpusAnalysis {
  if (documents.length === 0) {
    return getEmptyAnalysis();
  }

  const allText = documents.map(d => d.text).join(' ');
  const words = extractWords(allText);
  const sentences = extractSentences(allText);

  // Calculate stats
  const stats = calculateStats(documents, words, sentences);

  // Extract keywords
  const keywords = extractKeywords(words, 20);

  // Analyze sentiment
  const sentiment = analyzeSentiment(words);

  // Calculate readability
  const readability = calculateReadability(words, sentences);

  // Find top phrases
  const topPhrases = extractPhrases(allText, 10);

  // Analyze writing style
  const writingStyle = analyzeWritingStyle(words, sentences);

  return {
    stats,
    keywords,
    sentiment,
    readability,
    topPhrases,
    writingStyle,
  };
}

function getEmptyAnalysis(): CorpusAnalysis {
  return {
    stats: {
      totalDocuments: 0,
      totalWords: 0,
      totalSentences: 0,
      avgWordsPerDocument: 0,
      avgSentenceLength: 0,
    },
    keywords: [],
    sentiment: {
      score: 0,
      label: 'Neutral',
      distribution: { positive: 0, neutral: 0, negative: 0 },
    },
    readability: {
      score: 50,
      level: 'Unknown',
      complexity: 'Unknown',
    },
    topPhrases: [],
    writingStyle: {
      avgWordLength: 0,
      longWords: 0,
      sentenceVariety: 'Unknown',
    },
  };
}

function extractWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
}

function extractSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function calculateStats(
  documents: { text: string }[],
  words: string[],
  sentences: string[]
) {
  const totalWords = words.length;
  const totalSentences = sentences.length;
  const avgWordsPerDocument = totalWords / documents.length;
  const avgSentenceLength = totalSentences > 0 ? totalWords / totalSentences : 0;

  return {
    totalDocuments: documents.length,
    totalWords,
    totalSentences,
    avgWordsPerDocument: Math.round(avgWordsPerDocument),
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
  };
}

function extractKeywords(words: string[], topN: number) {
  const frequency: Record<string, number> = {};

  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  const totalWords = words.length;
  const sortedWords = Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word, count]) => ({
      word,
      count,
      percentage: Math.round((count / totalWords) * 1000) / 10,
    }));

  return sortedWords;
}

function analyzeSentiment(words: string[]) {
  let positiveCount = 0;
  let negativeCount = 0;

  words.forEach(word => {
    if (POSITIVE_WORDS.has(word)) positiveCount++;
    if (NEGATIVE_WORDS.has(word)) negativeCount++;
  });

  const total = positiveCount + negativeCount;
  const score = total > 0 ? (positiveCount - negativeCount) / total : 0;

  let label = 'Neutral';
  if (score > 0.2) label = 'Positive';
  else if (score > 0.05) label = 'Slightly Positive';
  else if (score < -0.2) label = 'Negative';
  else if (score < -0.05) label = 'Slightly Negative';

  const positive = Math.round((positiveCount / words.length) * 1000) / 10;
  const negative = Math.round((negativeCount / words.length) * 1000) / 10;
  const neutral = Math.round((100 - positive - negative) * 10) / 10;

  return {
    score: Math.round(score * 100) / 100,
    label,
    distribution: { positive, neutral, negative },
  };
}

function calculateReadability(words: string[], sentences: string[]) {
  // Simple readability based on word and sentence length
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
  const avgSentenceLength = words.length / sentences.length;

  // Flesch Reading Ease approximation
  const score = Math.max(0, Math.min(100,
    206.835 - 1.015 * avgSentenceLength - 84.6 * (avgWordLength / 5)
  ));

  let level = '';
  let complexity = '';

  if (score >= 90) {
    level = 'Elementary School';
    complexity = 'Very Easy';
  } else if (score >= 80) {
    level = 'Middle School';
    complexity = 'Easy';
  } else if (score >= 70) {
    level = 'High School';
    complexity = 'Fairly Easy';
  } else if (score >= 60) {
    level = 'College Level';
    complexity = 'Standard';
  } else if (score >= 50) {
    level = 'College Graduate';
    complexity = 'Fairly Difficult';
  } else if (score >= 30) {
    level = 'Graduate School';
    complexity = 'Difficult';
  } else {
    level = 'Professional';
    complexity = 'Very Difficult';
  }

  return {
    score: Math.round(score),
    level,
    complexity,
  };
}

function extractPhrases(text: string, topN: number): string[] {
  // Simple bigram extraction
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);

  const phrases: Record<string, number> = {};

  for (let i = 0; i < words.length - 1; i++) {
    const phrase = `${words[i]} ${words[i + 1]}`;
    if (!STOP_WORDS.has(words[i]) || !STOP_WORDS.has(words[i + 1])) {
      phrases[phrase] = (phrases[phrase] || 0) + 1;
    }
  }

  return Object.entries(phrases)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([phrase]) => phrase);
}

function analyzeWritingStyle(words: string[], sentences: string[]) {
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
  const longWords = words.filter(w => w.length > 6).length;
  const longWordPercentage = (longWords / words.length) * 100;

  const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
  const variance = calculateVariance(sentenceLengths);

  let sentenceVariety = 'Low';
  if (variance > 50) sentenceVariety = 'High';
  else if (variance > 20) sentenceVariety = 'Medium';

  return {
    avgWordLength: Math.round(avgWordLength * 10) / 10,
    longWords: Math.round(longWordPercentage * 10) / 10,
    sentenceVariety,
  };
}

function calculateVariance(numbers: number[]): number {
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  const squareDiffs = numbers.map(n => Math.pow(n - mean, 2));
  return squareDiffs.reduce((a, b) => a + b, 0) / numbers.length;
}
