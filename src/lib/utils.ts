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

export interface VocabularyAnalysis {
  word: string;
  phonetic?: {
    text: string;
    audio?: string;
  };
  context: {
    partOfSpeech: string;
    definition: string;
    example: string;
  };
  detail?: Omit<WordDefinition, 'pronunciation'>;
}

export async function lookupWord(word: string): Promise<WordDefinition | null> {
  const apiKey = import.meta.env.VITE_LEARNERS_DICTIONARY_API_KEY;
  if (!apiKey) {
    throw new Error('Dictionary API key not found');
  }

  try {
    const response = await fetch(
      `https://www.dictionaryapi.com/api/v3/references/learners/json/${encodeURIComponent(word)}?key=${apiKey}`
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

    const wordDef: WordDefinition = {
      word: firstEntry.meta.id,
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

    // Process definitions and examples
    if (firstEntry.shortdef) {
      wordDef.definitions = firstEntry.shortdef.map(def => ({
        meaning: def,
        examples: []
      }));
    } else if (firstEntry.def) {
      // Process more detailed definition structure
      firstEntry.def.forEach(defBlock => {
        if (defBlock.sseq) {
          defBlock.sseq.forEach(senseSeq => {
            senseSeq.forEach(sense => {
              if (sense[0] === 'sense' && sense[1].dt) {
                const examples: string[] = [];
                let meaning = '';

                // Extract meaning and examples from the dt array
                sense[1].dt.forEach(dtElement => {
                  if (dtElement[0] === 'text') {
                    meaning += dtElement[1].replace(/[{}]/g, '').replace(/^:?\s*/, '');
                  } else if (dtElement[0] === 'vis') {
                    dtElement[1].forEach((ex: { t: string }) => {
                      examples.push(ex.t.replace(/[{}]/g, ''));
                    });
                  }
                });

                if (meaning) {
                  wordDef.definitions.push({
                    meaning,
                    examples: examples.length > 0 ? examples : undefined
                  });
                }
              }
            });
          });
        }
      });
    }

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

export async function analyzeVocabulary(input: string): Promise<VocabularyAnalysis[]> {
  // If input is a single word or short phrase, try lookupWord first
  if (isSingleWordOrPhrases(input)) {
    const lookupResult = await lookupWord(input);
    if (lookupResult) {
      // Convert WordDefinition to VocabularyAnalysis format
      const firstDefinition = lookupResult.definitions[0];
      return [{
        word: lookupResult.word,
        phonetic: lookupResult.pronunciation,
        context: {
          partOfSpeech: lookupResult.partOfSpeech,
          definition: firstDefinition.meaning,
          example: firstDefinition.examples?.[0] || ''
        },
        detail: {
          word: lookupResult.word,
          partOfSpeech: lookupResult.partOfSpeech,
          definitions: lookupResult.definitions,
          stems: lookupResult.stems
        }
      }];
    }
  }
  
  // Fallback to text analysis for longer text or if lookupWord fails
  return analyzeText(input);
}

// Rename existing analyzeText to _analyzeText since it's now an internal function
export async function analyzeText(text: string): Promise<VocabularyAnalysis[]> {
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
        description: "List of vocabulary words with their context",
        items: {
          type: SchemaType.OBJECT,
          properties: {
            word: {
              type: SchemaType.STRING,
              description: "The vocabulary word",
            },
            context: {
              type: SchemaType.OBJECT,
              properties: {
                partOfSpeech: {
                  type: SchemaType.STRING,
                  description: "Part of speech of the word",
                },
                definition: {
                  type: SchemaType.STRING,
                  description: "Brief definition of the word",
                },
                example: {
                  type: SchemaType.STRING,
                  description: "Example usage from the original text or a relevant example",
                },
              },
              required: ["partOfSpeech", "definition", "example"],
            },
          },
          required: ["word", "context"],
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

Text to analyze:
${text}`;

  try {
    const result = await model.generateContent(prompt);
    const response = JSON.parse(result.response.text());
    
    // Enhance each word with dictionary lookup
    const enhancedWords = await Promise.all(
      response.map(async (item: VocabularyAnalysis) => {
        const lookupResult = await lookupWord(item.word);
        if (lookupResult) {
          item.phonetic = lookupResult.pronunciation;
          item.detail = {
            word: lookupResult.word,
            partOfSpeech: lookupResult.partOfSpeech,
            definitions: lookupResult.definitions,
            stems: lookupResult.stems
          };
        }
        return item;
      })
    );

    return enhancedWords;
  } catch (error) {
    console.error('Error analyzing text:', error);
    throw error;
  }
}
