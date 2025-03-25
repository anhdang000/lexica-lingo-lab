import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, SchemaType } from "@google/generative-ai"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface WordDefinition {
  word: string;
  pronunciation?: {
    text: string;
    audio?: string;
  };
  partOfSpeech: string;
  definitions: Array<{
    meaning: string;
    examples?: string[];
  }>;
  stems?: string[];
}

export async function lookupWord(word: string): Promise<WordDefinition | null> {
  const apiKey = import.meta.env.VITE_LEARNERS_DICTIONARY_API_KEY;
  if (!apiKey) {
    throw new Error('Dictionary API key not found');
  }

  // Clean up the word by removing number suffix
  const cleanWord = word.replace(/:\d+$/, '');

  try {
    const response = await fetch(
      `https://www.dictionaryapi.com/api/v3/references/learners/json/${encodeURIComponent(cleanWord)}?key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch word definition');
    }

    const data = await response.json();
    
    // Check if we got a valid response
    if (!Array.isArray(data) || data.length === 0 || typeof data[0] !== 'object') {
      return null;
    }

    const firstEntry = data[0];
    
    // Basic validation to ensure we have a proper word entry
    if (!firstEntry.meta?.id) {
      return null;
    }

    // Use the cleaned word instead of the API response ID which might contain suffixes
    const wordDef: WordDefinition = {
      word: cleanWord,
      partOfSpeech: firstEntry.fl || 'unknown',
      definitions: []
    };

    // Add pronunciation if available
    if (firstEntry.hwi?.prs?.[0]) {
      const pron = firstEntry.hwi.prs[0];
      wordDef.pronunciation = {
        text: pron.ipa || '',
        audio: pron.sound?.audio ? `https://media.merriam-webster.com/audio/prons/en/us/mp3/${pron.sound.audio[0]}/${pron.sound.audio}.mp3` : undefined
      };
    }

    // Add word variations/stems
    if (firstEntry.meta.stems) {
      wordDef.stems = firstEntry.meta.stems;
    }

    // Helper function to clean formatting tokens
    const cleanFormatting = (text: string): string => {
      return text
        .replace(/\{bc\}/g, ' ') // Replace with space instead of empty string
        .replace(/\{it\}|\{\/it\}/g, '')
        .replace(/\{phrase\}|\{\/phrase\}/g, '')
        .replace(/\{dx\}.*?\{\/dx\}/g, '')
        .replace(/\{sx\|([^|]+)\|\|.*?\}/g, '$1') // Improved sx token handling
        .replace(/\{([^}]*)\}/g, '') // Clean any remaining formatting tokens
        .replace(/\[\=.*?\]/g, '')
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();
    };

    // Process definitions and examples from the detailed structure
    if (firstEntry.def?.[0]?.sseq) {
      firstEntry.def.forEach(defBlock => {
        defBlock.sseq.forEach(senseSeq => {
          senseSeq.forEach(sense => {
            if (sense[0] === 'sense') {
              const senseData = sense[1];
              let meaning = '';
              const examples: string[] = [];

              // Process all dt elements
              if (senseData.dt) {
                senseData.dt.forEach(dtElement => {
                  if (dtElement[0] === 'text') {
                    // Concatenate text pieces for the meaning
                    meaning += ' ' + cleanFormatting(dtElement[1]);
                  } else if (dtElement[0] === 'vis') {
                    // Add examples
                    dtElement[1].forEach((ex: { t: string }) => {
                      examples.push(cleanFormatting(ex.t));
                    });
                  } else if (dtElement[0] === 'uns') {
                    // Handle unstructured data which can contain both text and examples
                    const unsData = dtElement[1];
                    if (Array.isArray(unsData)) {
                      unsData.forEach(unsGroup => {
                        if (Array.isArray(unsGroup)) {
                          unsGroup.forEach(item => {
                            if (Array.isArray(item) && item.length >= 2) {
                              if (item[0] === 'text') {
                                meaning += ' ' + cleanFormatting(item[1]);
                              } else if (item[0] === 'vis' && Array.isArray(item[1])) {
                                item[1].forEach((ex: { t: string }) => {
                                  examples.push(cleanFormatting(ex.t));
                                });
                              }
                            }
                          });
                        }
                      });
                    }
                  }
                });
              }

              if (meaning) {
                wordDef.definitions.push({
                  meaning: meaning.trim(),
                  examples: examples.length > 0 ? examples : undefined
                });
              }
            }
          });
        });
      });
    } else if (firstEntry.shortdef) {
      // Fallback to shortdef if detailed structure is not available
      wordDef.definitions = firstEntry.shortdef.map(def => ({
        meaning: cleanFormatting(def),
        examples: []
      }));
    }

    // console.log('Word definition result:', JSON.stringify(wordDef, null, 2));
    return wordDef;
  } catch (error) {
    console.error('Error looking up word:', error);
    return null;
  }
}

export function isSingleWordOrPhrases(text: string): boolean {
  // Trim and split by whitespace
  const words = text.trim().split(/\s+/);
  // Check if non-empty and has 4 or fewer words
  return text.trim().length > 0 && words.length <= 4;
}

export async function analyzeVocabulary(input: string): Promise<WordDefinition[]> {
  // If input is a single word or short phrase, try lookupWord first
  if (isSingleWordOrPhrases(input)) {
    const lookupResult = await lookupWord(input);
    if (lookupResult) {
      return [lookupResult];
    }
  }
  
  // For longer text, analyze vocabulary
  return analyzeText(input);
}

export async function analyzeText(text: string): Promise<WordDefinition[]> {
  // Get a random API key from the comma-separated list
  const apiKeys = (import.meta.env.VITE_GEMINI_API_KEY || '').split(',');
  const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
  
  if (!apiKey) {
    throw new Error('Gemini API key not found');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = import.meta.env.VITE_GEMINI_MODEL_NAME || 'gemini-1.5-pro';

  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.7,
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.ARRAY,
        description: "List of vocabulary words",
        items: {
          type: SchemaType.STRING,
          description: "A vocabulary word that would be valuable for a language learner",
        },
      },
    },
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ],
  });

  const prompt = `You are an expert language teacher. Your task is to identify up to 10 words from the provided text that would be valuable for a language learner to study.

Select words that are:
1. Advanced and relatively uncommon
2. Useful in various contexts
3. Worth adding to one's vocabulary

Return only an array of words, without any additional explanation.

Text to analyze:
${text}`;

  try {
    const result = await model.generateContent(prompt);
    const words: string[] = JSON.parse(result.response.text());
    
    // Look up each word and filter out any null results
    const definitions = await Promise.all(
      words.map(word => lookupWord(word))
    );
    
    return definitions.filter((def): def is WordDefinition => def !== null);
  } catch (error) {
    console.error('Error analyzing text:', error);
    throw error;
  }
}
