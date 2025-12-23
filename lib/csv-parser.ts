/**
 * CSV Parsing Utilities
 * Provides both standard and flexible CSV parsing functions
 */

import Papa from "papaparse";

/**
 * Standard CSV parser with predefined column names
 * Maintains backward compatibility with existing CSV formats
 */
export async function parseCSVStandard(content: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(content, {
      header: true,
      complete: (results) => {
        const texts: string[] = [];
        results.data.forEach((row: any) => {
          // Priority order for text fields (case-insensitive)
          const text =
            row.Text ||
            row.text ||
            row.Content ||
            row.content ||
            row.Message ||
            row.message ||
            row.Tweet ||
            row.tweet ||
            row.Post ||
            row.post ||
            row.full_text ||
            row.Summary ||
            row.summary ||
            row.Description ||
            row.description;

          // Only include text that's substantial (> 50 characters to avoid job titles, names, etc.)
          if (text && typeof text === "string" && text.length > 50) {
            texts.push(text.trim());
          }
        });
        resolve(texts);
      },
      error: (error: any) => reject(error),
    });
  });
}

/**
 * Flexible CSV parser that auto-detects text columns
 * Works with any CSV format by analyzing column content
 */
export async function parseCSVFlexible(content: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(content, {
      header: true,
      complete: (results) => {
        const texts: string[] = [];

        // Get all column names from the CSV
        const columns = results.meta.fields || [];
        if (columns.length === 0 && results.data.length > 0) {
          columns.push(...Object.keys(results.data[0] || {}));
        }

        if (columns.length === 0) {
          resolve(texts);
          return;
        }

        // Step 1: Try standard column names first (for backward compatibility)
        const standardColumns = [
          'Text', 'text', 'Content', 'content', 'Message', 'message',
          'Tweet', 'tweet', 'Post', 'post', 'full_text',
          'Summary', 'summary', 'Description', 'description'
        ];

        let textColumn: string | null = null;
        for (const col of standardColumns) {
          if (columns.includes(col)) {
            textColumn = col;
            break;
          }
        }

        // Step 2: If not found, auto-detect by analyzing sample rows
        if (!textColumn && results.data.length > 0) {
          const sampleRows = results.data.slice(0, Math.min(10, results.data.length)) as Record<string, any>[];
          let bestColumn: string | null = null;
          let bestScore = 0;

          for (const col of columns) {
            // Skip columns that look like metadata (id, date, label, etc.)
            const colLower = col.toLowerCase();
            if (colLower.includes('id') || 
                colLower.includes('date') || 
                colLower.includes('time') ||
                colLower.includes('label') ||
                colLower.includes('category') ||
                colLower.includes('type') ||
                colLower.includes('score') ||
                colLower.includes('index')) {
              continue;
            }

            // Score this column based on how much text content it has
            let score = 0;
            let textCount = 0;
            let totalLength = 0;

            for (const row of sampleRows) {
              const value = row[col];
              if (typeof value === 'string' && value.trim().length > 0) {
                textCount++;
                totalLength += value.trim().length;
                // Bonus points for longer text (more likely to be content)
                if (value.trim().length > 50) {
                  score += 2;
                } else if (value.trim().length > 20) {
                  score += 1;
                }
              }
            }

            // Calculate final score (weighted by text count and average length)
            const avgLength = textCount > 0 ? totalLength / textCount : 0;
            const finalScore = score + (textCount / sampleRows.length) * 2 + (avgLength / 100);

            if (finalScore > bestScore) {
              bestScore = finalScore;
              bestColumn = col;
            }
          }

          textColumn = bestColumn;
        }

        // Step 3: If still not found, use the first column with substantial text
        if (!textColumn && results.data.length > 0) {
          const firstRow = results.data[0] as Record<string, any>;
          for (const col of columns) {
            const sampleValue = firstRow?.[col];
            if (typeof sampleValue === 'string' && sampleValue.trim().length > 10) {
              textColumn = col;
              break;
            }
          }
        }

        // Step 4: Extract texts using detected column
        if (textColumn) {
          console.log(`Auto-detected text column: "${textColumn}"`);
          (results.data as Record<string, any>[]).forEach((row) => {
            const text = row[textColumn!];
            if (text && typeof text === "string" && text.trim().length > 50) {
              texts.push(text.trim());
            }
          });
        } else {
          // Fallback: try all columns and use the longest text found in each row
          console.log('No text column detected, using fallback: extracting longest text from each row');
          (results.data as Record<string, any>[]).forEach((row) => {
            let bestText = '';
            for (const col of columns) {
              const value = row[col];
              if (typeof value === 'string' && value.trim().length > bestText.length) {
                bestText = value.trim();
              }
            }
            if (bestText.length > 50) {
              texts.push(bestText);
            }
          });
        }

        resolve(texts);
      },
      error: (error: any) => reject(error),
    });
  });
}

/**
 * Main CSV parser that tries flexible parser first, falls back to standard
 * This ensures maximum compatibility while maintaining backward compatibility
 */
export async function parseCSV(content: string): Promise<string[]> {
  try {
    // Try flexible parser first
    const texts = await parseCSVFlexible(content);
    
    // If flexible parser found texts, use it
    if (texts.length > 0) {
      return texts;
    }
    
    // If no texts found, try standard parser as fallback
    console.log('Flexible parser found no texts, trying standard parser...');
    return await parseCSVStandard(content);
  } catch (error) {
    // If flexible parser fails, use standard parser
    console.log('Flexible CSV parser failed, using standard parser:', error);
    return await parseCSVStandard(content);
  }
}

