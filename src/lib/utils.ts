import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, SchemaType } from "@google/generative-ai"
import { GoogleAIFileManager } from "@google/generative-ai/server"
import https from "https"

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
    examples: string;
  }>;
  stems?: string[];
  collectionName?: string;
}

// Add TuningOptions interface
export interface TuningOptions {
  level: string; // 'auto', 'beginner', 'intermediate', 'advanced', 'all'
  useCase?: string; // For LexiGen: 'general', 'conversation', 'business', etc.
  vocabularyFocus?: string; // For LexiGrab: 'general', 'academic', 'business', 'technical', etc.
  frequency?: string; // 'low', 'medium', 'high'
  partsOfSpeech: string[]; // 'noun', 'verb', 'adjective', etc.
}

export async function lookupWord(word: string): Promise<WordDefinition[] | null> {
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

    // First, find any audio information from all entries for potential sharing
    let fallbackAudio: string | undefined;
    let fallbackPronunciation: string | undefined;
    
    // Look through all entries to find audio information
    for (const entry of data) {
      if (entry.hwi?.prs?.[0]?.sound?.audio) {
        fallbackAudio = entry.hwi.prs[0].sound.audio;
        fallbackPronunciation = entry.hwi.prs[0].ipa;
        break;
      }
    }

    // Helper function to process an entry and convert it to WordDefinition
    const processEntry = (entry: any): WordDefinition | null => {
      // Basic validation to ensure we have a proper word entry
      if (!entry.meta?.id) {
        return null;
      }

      // Get the word from the entry ID
      let entryWord = entry.meta.id;
      // Remove any number suffix for display purposes
      if (/:/.test(entryWord)) {
        entryWord = entryWord.split(':')[0];
      }

      const wordDef: WordDefinition = {
        word: entryWord,
        partOfSpeech: entry.fl || 'unknown',
        definitions: []
      };

      // Add pronunciation if available - handle both prs and altprs structures
      if (entry.hwi) {
        const mainPron = entry.hwi.prs?.[0];
        const altPron = entry.hwi.altprs?.[0];
        const pron = mainPron || altPron;
        
        if (pron) {
          const audioFile = pron.sound?.audio || fallbackAudio;
          wordDef.pronunciation = {
            text: pron.ipa || fallbackPronunciation || '',
            audio: audioFile ? `https://media.merriam-webster.com/audio/prons/en/us/mp3/${getAudioSubdirectory(audioFile)}/${audioFile}.mp3` : undefined
          };
        } else if (fallbackAudio) {
          // If this entry has no pronunciation but we found one elsewhere, use it
          wordDef.pronunciation = {
            text: fallbackPronunciation || '',
            audio: `https://media.merriam-webster.com/audio/prons/en/us/mp3/${getAudioSubdirectory(fallbackAudio)}/${fallbackAudio}.mp3`
          };
        }
      } else if (fallbackAudio) {
        // If this entry has no hwi at all but we found audio elsewhere, use it
        wordDef.pronunciation = {
          text: fallbackPronunciation || '',
          audio: `https://media.merriam-webster.com/audio/prons/en/us/mp3/${getAudioSubdirectory(fallbackAudio)}/${fallbackAudio}.mp3`
        };
      }

      // Add word variations/stems
      if (entry.meta.stems) {
        wordDef.stems = entry.meta.stems;
      }

      // Helper function to clean formatting tokens
      const cleanFormatting = (text: string): string => {
        return text
          .replace(/\{bc\}/g, ' ') // Replace with space instead of empty string
          .replace(/\{phrase\}|\{\/phrase\}/g, '')
          .replace(/\{dx\}.*?\{\/dx\}/g, '')
          .replace(/\{sx\|([^|]+)\|\|.*?\}/g, '$1') // Improved sx token handling
          .replace(/\{([^}]*)\}/g, function(match) {
            // Preserve {it} and {/it} tags
            if (match === '{it}' || match === '{/it}') {
              return match;
            }
            return ''; // Remove other formatting tokens
          })
          // Keep [=...] explanations entirely intact, don't attempt to parse them here
          .replace(/\s+/g, ' ') // Normalize spaces
          .trim();
      };

      // Helper to extract examples from vis element
      const extractExamples = (visArray: any[]): string[] => {
        const examples: string[] = [];
        if (Array.isArray(visArray)) {
          visArray.forEach((ex: { t: string }) => {
            if (ex && ex.t) {
              // For examples, we want to preserve the formatting markers
              examples.push(cleanFormatting(ex.t));
            }
          });
        }
        return examples;
      };

      // Helper to process unstructured data - this is the key improvement
      const processUnsData = (unsData: any[]): {meaning: string, examples: string[]} => {
        let meaning = '';
        const examples: string[] = [];
        
        if (Array.isArray(unsData)) {
          // Unstructured data is usually a nested array
          unsData.forEach(unsGroup => {
            if (Array.isArray(unsGroup)) {
              // Each group can contain text and examples
              unsGroup.forEach(item => {
                if (Array.isArray(item) && item.length >= 2) {
                  // Process text elements
                  if (item[0] === 'text' && typeof item[1] === 'string') {
                    // Add a semicolon before adding new text if meaning already has content
                    if (meaning.trim().length > 0) {
                      meaning += '; ' + cleanFormatting(item[1]);
                    } else {
                      meaning += ' ' + cleanFormatting(item[1]);
                    }
                  } 
                  // Process visual examples
                  else if (item[0] === 'vis' && Array.isArray(item[1])) {
                    const visExamples = extractExamples(item[1]);
                    examples.push(...visExamples);
                  }
                }
              });
            }
          });
        }
        
        return {
          meaning: meaning.trim(),
          examples
        };
      };

      // SPECIAL HANDLING FOR DROS ENTRIES (like "the ultimate in")
      if (entry.dros && Array.isArray(entry.dros)) {
        entry.dros.forEach((drosEntry: any) => {
          if (drosEntry.def && Array.isArray(drosEntry.def)) {
            drosEntry.def.forEach((defBlock: any) => {
              if (defBlock.sseq && Array.isArray(defBlock.sseq)) {
                defBlock.sseq.forEach((senseSeq: any) => {
                  if (Array.isArray(senseSeq)) {
                    senseSeq.forEach((sense: any) => {
                      if (Array.isArray(sense) && sense[0] === 'sense' && sense[1]) {
                        const senseData = sense[1];
                        let meaning = '';
                        const examples: string[] = [];

                        // Process all dt elements
                        if (Array.isArray(senseData.dt)) {
                          senseData.dt.forEach((dtElement: any) => {
                            if (Array.isArray(dtElement) && dtElement.length >= 2) {
                              // Text elements - basic definition text
                              if (dtElement[0] === 'text') {
                                if (meaning.trim().length > 0) {
                                  meaning += '; ' + cleanFormatting(dtElement[1]);
                                } else {
                                  meaning += ' ' + cleanFormatting(dtElement[1]);
                                }
                              } 
                              // Visual examples
                              else if (dtElement[0] === 'vis' && Array.isArray(dtElement[1])) {
                                const visExamples = extractExamples(dtElement[1]);
                                examples.push(...visExamples);
                              } 
                              // Unstructured data - contains both meanings and examples
                              else if (dtElement[0] === 'uns' && Array.isArray(dtElement[1])) {
                                const unsResult = processUnsData(dtElement[1]);
                                if (unsResult.meaning) {
                                  if (meaning.trim().length > 0) {
                                    meaning += '; ' + unsResult.meaning;
                                  } else {
                                    meaning += ' ' + unsResult.meaning;
                                  }
                                }
                                if (unsResult.examples.length > 0) {
                                  examples.push(...unsResult.examples);
                                }
                              }
                            }
                          });
                        }

                        // Add phrase definition if it has at least one example
                        if (meaning && examples.length > 0) {
                          wordDef.definitions.push({
                            meaning: `${drosEntry.drp || ''} - ${meaning.trim()}`,
                            examples: examples[0]
                          });
                        }
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }

      // Process definitions and examples from the detailed structure
      if (entry.def?.[0]?.sseq) {
        entry.def.forEach((defBlock: any) => {
          if (defBlock.sseq && Array.isArray(defBlock.sseq)) {
            defBlock.sseq.forEach((senseSeq: any) => {
              if (Array.isArray(senseSeq)) {
                senseSeq.forEach((sense: any) => {
                  if (Array.isArray(sense) && sense[0] === 'sense' && sense[1]) {
                    const senseData = sense[1];
                    let meaning = '';
                    const examples: string[] = [];

                    // Process all dt elements
                    if (Array.isArray(senseData.dt)) {
                      senseData.dt.forEach((dtElement: any) => {
                        if (Array.isArray(dtElement) && dtElement.length >= 2) {
                          // Text elements - basic definition text
                          if (dtElement[0] === 'text') {
                            if (meaning.trim().length > 0) {
                              meaning += '; ' + cleanFormatting(dtElement[1]);
                            } else {
                              meaning += ' ' + cleanFormatting(dtElement[1]);
                            }
                          } 
                          // Visual examples
                          else if (dtElement[0] === 'vis' && Array.isArray(dtElement[1])) {
                            const visExamples = extractExamples(dtElement[1]);
                            examples.push(...visExamples);
                          } 
                          // Unstructured data - contains both meanings and examples
                          else if (dtElement[0] === 'uns' && Array.isArray(dtElement[1])) {
                            const unsResult = processUnsData(dtElement[1]);
                            if (unsResult.meaning) {
                              if (meaning.trim().length > 0) {
                                meaning += '; ' + unsResult.meaning;
                              } else {
                                meaning += ' ' + unsResult.meaning;
                              }
                            }
                            if (unsResult.examples.length > 0) {
                              examples.push(...unsResult.examples);
                            }
                          }
                        }
                      });
                    }

                    // Only add definition if we have a meaning AND at least one example
                    if (meaning && examples.length > 0) {
                      wordDef.definitions.push({
                        meaning: meaning.trim(),
                        examples: examples[0]
                      });
                    }
                  }
                });
              }
            });
          }
        });
      } 
      
      // We no longer need the shortdef fallback since we only want definitions with examples
      // If we still have no definitions with examples, this will be filtered out later
      
      // Only return if we have at least one definition with an example
      return wordDef.definitions.length > 0 ? wordDef : null;
    };

    // Helper function to get the correct audio subdirectory based on audio filename
    function getAudioSubdirectory(audioFile: string): string {
      // For audio files that start with "bix", use the "bix" subdirectory
      if (audioFile.startsWith('bix')) {
        return 'bix';
      }
      // For audio files that start with a digit, use the "number" subdirectory
      else if (/^\d/.test(audioFile)) {
        return 'number';
      }
      // For audio files that start with "gg", use the "gg" subdirectory
      else if (audioFile.startsWith('gg')) {
        return 'gg';
      }
      // For all other audio files, use the first character as the subdirectory
      else {
        return audioFile.charAt(0);
      }
    }

    // Determine which entries to process based on the first entry's ID pattern
    const firstEntry = data[0];
    const firstEntryId = firstEntry.meta?.id || '';
    
    // Process all entries that match the pattern (for WORD:IDX pattern)
    if (firstEntryId.includes(':')) {
      // Get the base word part before the colon
      const baseWord = firstEntryId.split(':')[0];
      
      // Filter only entries that match the base word with any index
      const relevantEntries = data.filter(entry => {
        const entryId = entry.meta?.id || '';
        return entryId.startsWith(baseWord + ':');
      });
      
      // Process all matching entries
      const results = relevantEntries
        .map(entry => processEntry(entry))
        .filter((def): def is WordDefinition => def !== null);
      
      return results.length > 0 ? results : null;
    } else {
      // For a simple word entry (no index), only process the first entry
      const result = processEntry(firstEntry);
      return result ? [result] : null;
    }
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

export interface FileInput {
  file: File;
  mimeType?: string;
}

export interface AnalysisResults {
  vocabulary: WordDefinition[];
  topics: string[];
  topicName?: string;
  content?: string;
}

// Helper function to read file as data URL
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        resolve(reader.result.toString());
      } else {
        reject(new Error('Failed to read file as data URL'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function generateVocabularyFromTopic(inputText: string, tuningOptions?: TuningOptions): Promise<AnalysisResults> {
  // Get a random API key from the comma-separated list
  const apiKeys = (import.meta.env.VITE_GEMINI_API_KEY || '').split(',');
  const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
  
  if (!apiKey) {
    throw new Error('Gemini API key not found');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = import.meta.env.VITE_GEMINI_MODEL_NAME || 'gemini-2.0-flash-lite';
  
  // Add tuning options to the prompt if available
  let tuningInstructions = '';
  if (tuningOptions) {
    // Choose the appropriate property based on what's available
    const focusProperty = tuningOptions.useCase || tuningOptions.vocabularyFocus || 'general';
    
    tuningInstructions = `
Apply these specific tuning preferences to your selection of vocabulary words:
1. Language Level: ${tuningOptions.level !== 'auto' ? tuningOptions.level : 'Auto-detect based on content complexity'}
2. Vocabulary Focus: ${focusProperty} vocabulary
3. Parts of Speech: Emphasize these parts of speech: ${tuningOptions.partsOfSpeech.join(', ')}
`;
  }

  // Create prompt text for vocabulary generation from a topic
  const promptText = `
You are an advanced vocabulary instructor tasked with generating useful vocabulary words related to a given input.

Input text: ${inputText}

${tuningInstructions}

Your task is to:
1. Generate a concise topic name (1-3 words) that best represents the input text
2. Generate 10-15 vocabulary words that are clearly related to this topic
3. Provide 2-3 broader themes/categories that encompass this topic

For the topic name:
- If the input is already a concise topic, you can keep it
- If the input is longer text, extract the most relevant topic
- Always keep it concise (1-3 words) and representative

For vocabulary, select words that meet these criteria:
- Range from intermediate to advanced level
- Are genuinely useful for someone learning about this topic
- Include a mix of nouns, verbs, adjectives, and other parts of speech
- Avoid extremely rare or archaic terms

For themes/categories:
- Identify broader fields that this topic belongs to
- Keep them concise (1-3 words each)

Return words in singular and infinitive forms (e.g., "analyze" instead of "analyzing")
Return the results in JSON format with three fields: "topicName" (string), "vocabulary" (array of strings), and "topics" (array of strings).
`;

  try {
    // Define the generation config for structured output
    const generationConfig = {
      temperature: 0.8,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT as const,
        properties: {
          topicName: {
            type: SchemaType.STRING as const,
            description: "A concise topic name (1-3 words) that best represents the input text",
          },
          vocabulary: {
            type: SchemaType.ARRAY as const,
            items: {
              type: SchemaType.STRING as const,
              description: "A vocabulary word related to the given topic",
            },
          },
          topics: {
            type: SchemaType.ARRAY as const,
            items: {
              type: SchemaType.STRING as const,
              description: "A broader theme or category that encompasses the topic",
            },
          },
        },
        required: ["topicName", "vocabulary", "topics"],
      },
    };
    
    // Create model
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig
    });
    
    // Generate content with topic
    const result = await model.generateContent(promptText);
    
    // Parse the JSON result
    const generationResult = JSON.parse(result.response.text());
    
    // Force vocabulary words to lowercase
    const words: string[] = (generationResult.vocabulary || []).map((word: string) => word.toLowerCase());
    const topics: string[] = generationResult.topics || [];
    const generatedTopicName: string = generationResult.topicName || "Vocabulary Collection";
    
    // Look up each word and filter out any null results
    const definitions = await Promise.all(
      words.map(word => lookupWord(word))
    );
    
    return {
      vocabulary: definitions.filter((def): def is WordDefinition[] => def !== null).flat(),
      topics: topics,
      topicName: generatedTopicName
    };
  } catch (error) {
    console.error('Error generating vocabulary from topic:', error);
    throw error;
  }
}

export async function analyzeVocabulary(input: string, files: FileInput[] = [], tuningOptions?: TuningOptions): Promise<AnalysisResults> {
  // If input is a single word or short phrase and no files are provided, try lookupWord first
  if (isSingleWordOrPhrases(input) && files.length === 0) {
    const lookupResult = await lookupWord(input);
    if (lookupResult) {
      return {
        vocabulary: lookupResult,
        topics: [],
        topicName: lookupResult[0]?.word || ''
      };
    }
  }
  
  // For files analysis
  if (files.length > 0) {
    return analyzeFiles(files, tuningOptions);
  }
  
  // For longer text analysis
  return analyzeText(input, tuningOptions);
}

export async function analyzeText(text: string, tuningOptions?: TuningOptions): Promise<AnalysisResults> {
  // Get a random API key from the comma-separated list
  const apiKeys = (import.meta.env.VITE_GEMINI_API_KEY || '').split(',');
  const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
  
  if (!apiKey) {
    throw new Error('Gemini API key not found');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = import.meta.env.VITE_GEMINI_MODEL_NAME || 'gemini-2.0-flash-lite';
  
  // Add tuning options to the prompt if available
  let tuningInstructions = '';
  if (tuningOptions) {
    // Choose the appropriate property based on what's available
    const focusProperty = tuningOptions.useCase || tuningOptions.vocabularyFocus || 'general';
    
    tuningInstructions = `
1. Language Level: ${tuningOptions.level !== 'auto' ? tuningOptions.level : 'Auto-detect based on content complexity'}
2. Vocabulary Focus: ${focusProperty} vocabulary
3. Word Frequency: Prioritize ${tuningOptions.frequency} frequency words
4. Parts of Speech: Emphasize these parts of speech: ${tuningOptions.partsOfSpeech.join(', ')}
`;
  }
  
  // Create prompt text for vocabulary and topic extraction
  const promptText = `
You are an advanced vocabulary instructor tasked with identifying the most valuable vocabulary words and related topics from the provided content.

Your task is to extract three things:
1. Vocabulary: A carefully curated array of sophisticated words that would enhance an English language learner's lexicon
2. Topics: 3-5 relevant topics or themes that categorize the content
3. Content: An simple summary writeup, strictly use vocabulary extracted from the original source, each vocabulary word from your vocabulary list MUST be wrapped in <word> tags, like this: <word>vocabulary</word><synonym>lexicon</synonym>. The synonym should be a word that is similar in meaning to the vocabulary word, wrapped in <synonym> tags and must be simpler.

User's preferences for extracted vocabulary:
${tuningInstructions}

For vocabulary, select words that meet these criteria and strictly follow user's preferences:
- Advanced and relatively uncommon and align with the main topic
- First to prioritize nouns specifically to the main topic of the text
- Then verbs, adjectives, and other parts of speech used in the text
- For each word, assign it to a collection name that categorizes it (e.g., "Technical Terms", "Academic Vocabulary", "Business Jargon", etc.)

For topics, identify key themes that:
- Accurately categorize the content
- Would be useful as study categories
- Are concise (1-3 words each)

For the explanatory content:
- Include direct quotes from the source text where appropriate
- IMPORTANT: Ensure EVERY vocabulary word from your list appears in the writeup
- IMPORTANT: Ensure EVERY vocabulary word from your list appears in the ORIGINAL TEXT
- IMPORTANT: Wrap EACH vocabulary word in <word> tags, like this: <word>vocabulary</word>
- IMPORTANT: Each vocabulary word MUST be immediately followed by a simple synonym or an explanatory phrase wrapped in <synonym> tags: <synonym>lexicon</synonym>

Return words in singular and infinitive forms (e.g., "analyze" instead of "analyzing")
Return the results in JSON format with three fields: "vocabulary" (array of objects with "word" and "collectionName" properties), "topics" (array of strings), and "content" (string).

Analyze the following text:
${text}
`;

  try {
    // Define the generation config for structured output
    const generationConfig = {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT as const,
        properties: {
          vocabulary: {
            type: SchemaType.ARRAY as const,
            items: {
              type: SchemaType.OBJECT as const,
              properties: {
                word: {
                  type: SchemaType.STRING as const,
                  description: "A vocabulary word that would be valuable for a language learner",
                },
                collectionName: {
                  type: SchemaType.STRING as const,
                  description: "The collection name that categorizes this vocabulary word",
                }
              },
              required: ["word", "collectionName"],
            },
          },
          topics: {
            type: SchemaType.ARRAY as const,
            items: {
              type: SchemaType.STRING as const,
              description: "A relevant topic or theme that categorizes the content",
            },
          },
          content: {
            type: SchemaType.STRING as const,
            description: "A concise paragraph summarizing key points with vocabulary words wrapped in <word> tags",
          },
        },
        required: ["vocabulary", "topics", "content"],
      },
    };
    
    // Create model
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig
    });
    
    // Generate content from text
    const result = await model.generateContent(promptText);
    
    // Parse the JSON result
    const analysisResult = JSON.parse(result.response.text());
    
    // Force vocabulary words to lowercase
    const vocabularyItems = (analysisResult.vocabulary || []).map((item: { word: string, collectionName: string }) => ({
      word: item.word.toLowerCase(),
      collectionName: item.collectionName
    }));
    
    const topics: string[] = analysisResult.topics || [];
    const content: string = analysisResult.content || '';
    
    // Look up each word and filter out any null results
    const definitions = await Promise.all(
      vocabularyItems.map(item => lookupWord(item.word).then(defs => {
        if (defs) {
          return defs.map(def => ({
            ...def,
            collectionName: item.collectionName
          }));
        }
        return null;
      }))
    );
    
    return {
      vocabulary: definitions.filter((defs): defs is WordDefinition[] => defs !== null).flat(),
      topics: topics,
      topicName: '',
      content: content
    };
  } catch (error) {
    console.error('Error analyzing text:', error);
    throw error;
  }
}

export async function analyzeFiles(files: FileInput[], tuningOptions?: TuningOptions): Promise<AnalysisResults> {
  // Get a random API key from the comma-separated list
  const apiKeys = (import.meta.env.VITE_GEMINI_API_KEY || '').split(',');
  const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
  
  if (!apiKey) {
    throw new Error('Gemini API key not found');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = import.meta.env.VITE_GEMINI_MODEL_NAME || 'gemini-2.0-flash-lite';
  
  // Add tuning options to the prompt if available
  let tuningInstructions = '';
  if (tuningOptions) {
    // Choose the appropriate property based on what's available
    const focusProperty = tuningOptions.useCase || tuningOptions.vocabularyFocus || 'general';
    
    tuningInstructions = `
1. Language Level: ${tuningOptions.level !== 'auto' ? tuningOptions.level : 'Auto-detect based on content complexity'}
2. Vocabulary Focus: ${focusProperty} vocabulary
3. Word Frequency: Prioritize ${tuningOptions.frequency} frequency words
4. Parts of Speech: Emphasize these parts of speech: ${tuningOptions.partsOfSpeech.join(', ')}
`;
  }
  
  // Create prompt text for vocabulary and topic extraction
  const promptText = `
You are an advanced vocabulary instructor tasked with identifying the most valuable vocabulary words and related topics from the provided content.

Your task is to extract three things:
1. Vocabulary: A carefully curated array of sophisticated words that would enhance an English language learner's lexicon
2. Topics: 3-5 relevant topics or themes that categorize the content
3. Content: An simple explanatory writeup, strictly use vocabulary extracted, each vocabulary word from your vocabulary list MUST be wrapped in <word> tags, like this: <word>vocabulary</word><synonym>lexicon</synonym>. The synonym should be a word that is similar in meaning to the vocabulary word, wrapped in <synonym> tags and must be simpler.

User's preferences for extracted vocabulary:
${tuningInstructions}

For vocabulary, select words that meet these criteria and strictly follow user's preferences:
- Advanced and relatively uncommon and align with the main topic
- First to prioritize nouns specifically to the main topic of the text
- Then verbs, adjectives, and other parts of speech used in the text
- For each word, assign it to a collection name that categorizes it (e.g., "Technical Terms", "Academic Vocabulary", "Business Jargon", etc.)

For topics, identify key themes that:
- Accurately categorize the content
- Would be useful as study categories
- Are concise (1-3 words each)

For the explanatory content:
- Include direct quotes from the source text where appropriate
- IMPORTANT: Ensure EVERY vocabulary word from your list appears in the writeup
- IMPORTANT: Ensure EVERY vocabulary word from your list appears in the ORIGINAL TEXT
- IMPORTANT: Wrap EACH vocabulary word in <word> tags, like this: <word>vocabulary</word><synonym>lexicon</synonym>
- IMPORTANT: Each vocabulary word MUST be immediately followed by a simple synonym or an explanatory phrase wrapped in <synonym> tags: <synonym>lexicon</synonym>

Return words in singular and infinitive forms (e.g., "analyze" instead of "analyzing")
Return the results in JSON format with three fields: "vocabulary" (array of objects with "word" and "collectionName" properties), "topics" (array of strings), and "content" (string).
`;

  try {
    // Define the generation config for structured output
    const generationConfig = {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.ARRAY as const,
        items: {
          type: SchemaType.OBJECT as const,
          properties: {
            vocabulary: {
              type: SchemaType.ARRAY as const,
              items: {
                type: SchemaType.OBJECT as const,
                properties: {
                  word: {
                    type: SchemaType.STRING as const,
                    description: "A vocabulary word that would be valuable for a language learner",
                  },
                  collectionName: {
                    type: SchemaType.STRING as const,
                    description: "The collection name that categorizes this vocabulary word",
                  }
                },
                required: ["word", "collectionName"],
              },
            },
            topics: {
              type: SchemaType.ARRAY as const,
              items: {
                type: SchemaType.STRING as const,
                description: "A relevant topic or theme that categorizes the content",
              },
            },
            content: {
              type: SchemaType.STRING as const,
              description: "A concise paragraph summarizing key points with vocabulary words wrapped in <word> tags",
            },
          },
          required: ["vocabulary", "topics", "content"],
        },
      },
    };
    
    // Create model
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig
    });
    
    // If we have files, use content generation with files
    // First, prepare file parts for each file
    const fileParts = await Promise.all(files.map(async (fileInput) => {
      // Read the file as data URL
      const dataUrl = await readFileAsDataURL(fileInput.file);
      return {
        inlineData: {
          data: dataUrl.split(',')[1], // Remove the "data:image/jpeg;base64," part
          mimeType: fileInput.mimeType || fileInput.file.type
        }
      };
    }));
    
    // Create content parts with text and files
    const contentParts = [
      { text: promptText },
      ...fileParts
    ];
    
    // Generate content with files
    const result = await model.generateContent(contentParts);
    
    // Parse the JSON result
    const analysisResult = JSON.parse(result.response.text());
    
    // Force vocabulary words to lowercase
    const vocabularyItems = (analysisResult.vocabulary || []).map((item: { word: string, collectionName: string }) => ({
      word: item.word.toLowerCase(),
      collectionName: item.collectionName
    }));
    
    const topics: string[] = analysisResult.topics || [];
    const content: string = analysisResult.content || '';
    
    // Look up each word and filter out any null results
    const definitions = await Promise.all(
      vocabularyItems.map(item => lookupWord(item.word).then(defs => {
        if (defs) {
          return defs.map(def => ({
            ...def,
            collectionName: item.collectionName
          }));
        }
        return null;
      }))
    );
    
    return {
      vocabulary: definitions.filter((defs): defs is WordDefinition[] => defs !== null).flat(),
      topics: topics,
      topicName: '',
      content: content
    };
  } catch (error) {
    console.error('Error analyzing files:', error);
    throw error;
  }
}

/**
 * Fetches content from a specified URL using the backend API
 * This avoids CORS issues by using a server-side request
 * 
 * @param url - The URL to fetch content from
 * @param options - Optional configuration for the request
 * @returns Promise resolving to the content from the URL
 */
export async function fetchUrlContent(url: string, options?: { render?: 'html' }): Promise<string> {
  try {
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    if (!backendUrl) {
      throw new Error('Backend URL environment variable not defined');
    }
    
    const apiUrl = `${backendUrl}/web/fetch`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch via backend: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Fetched data:', data);
    // Format the response as "TITLE\nCONTENT"
    return `${data.title || 'No Title'}\n\n${data.content || 'No content available'}`.trim();
  } catch (error) {
    console.error('Error fetching URL content:', error);
    throw new Error(`Failed to fetch content: ${error.message}`);
  }
}

export interface WordInfo {
  word: string;
  definition: string;
  example?: string;
}

export interface QuizQuestion {
  word: string;
  definition: string;
  question: string;
  options: string[];
  correct_option_idx: number;
}

/**
 * Get detailed insights for a word with Vietnamese translation and educational content
 * 
 * @param wordDefinition - The WordDefinition object to generate insights for
 * @returns Promise resolving to the detailed insights text
 */
export async function getWordInsights(wordDefinition: WordDefinition): Promise<string> {
  // Get a random API key from the comma-separated list
  const apiKeys = (import.meta.env.VITE_GEMINI_API_KEY || '').split(',');
  const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
  
  if (!apiKey) {
    throw new Error('Gemini API key not found');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = import.meta.env.VITE_GEMINI_MODEL_NAME || 'gemini-2.0-flash-lite';
  
  // Convert the WordDefinition object to a JSON string to include in the prompt
  const wordInfoJson = JSON.stringify(wordDefinition, null, 2);
  
  // Create prompt text for word insights generation
  const promptText = `
Generate 200-500 words detail info of below word. Provide explanation and meaning in Vietnamese. The write-up should include meanings, use cases, common phrases, collocation & examples, synonyms & common confusion (if exists). Use friendly tone and be attractive to Vietnamese learners. Use icons in appropriate places

Word info:
${wordInfoJson}

Just the content, no comment, no greetings, use just the word as title
`;

  try {
    // Define the generation config
    const generationConfig = {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
    };
    
    // Create model
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig
    });
    
    // Generate insights for the word
    const result = await model.generateContent(promptText);
    
    // Return the generated text
    return result.response.text();
  } catch (error) {
    console.error('Error generating word insights:', error);
    throw new Error(`Failed to generate word insights: ${error.message}`);
  }
}

export async function getQuizQuestions(wordInfoList: WordInfo[]): Promise<QuizQuestion[]> {
  // Get a random API key from the comma-separated list
  const apiKeys = (import.meta.env.VITE_GEMINI_API_KEY || '').split(',');
  const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
  
  if (!apiKey) {
    throw new Error('Gemini API key not found');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = import.meta.env.VITE_GEMINI_MODEL_NAME || 'gemini-2.0-flash-lite';
  
  // Format word info for the prompt
  const wordInfoText = wordInfoList.map(info => {
    return `Word: ${info.word}\nDefinition: ${info.definition}${info.example ? `\nExample: ${info.example}` : ''}`;
  }).join('\n\n');
  
  // Create prompt text for quiz question generation
  const promptText = `
You are an expert language teacher creating a vocabulary quiz. Generate multiple choice questions where students guess the word based on definitions or context.

For each word:
1. Create questions WITHOUT revealing the target word, questions should be creative and engaging, and do not use too advanced words for the question
2. Provide 4 possible word choices, including the correct word
3. Make wrong options plausible but clearly incorrect (similar parts of speech, thematic relation, etc.)
4. Vary question formats (definition-based, context clues, synonyms, etc.)

IMPORTANT: The question should be funny and attractive to learners (you are encouraged to use icons) and be in various types instead of just a single question.

Words and their information:
${wordInfoText}

Return a JSON array strictly following this schema, with no additional text:
[
  {
    "word": "target word",
    "definition": "original definition",
    "question": "the quiz question",
    "options": ["correct word", "wrong option 1", "wrong option 2", "wrong option 3"],
    "correct_option_idx": 0
  }
]

Make sure:
- Each question has exactly 4 options
- correct_option_idx is 0-3, indicating which option is correct (the index of the correct word in the options array)
- Questions should NOT contain the target word
- Questions should test word recognition from definitions/context
- Wrong answers should be plausible words in similar category
- Return all words from the input list
`;

  try {
    // Define the generation config for structured output
    const generationConfig = {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.ARRAY as const,
        items: {
          type: SchemaType.OBJECT as const,
          properties: {
            word: {
              type: SchemaType.STRING as const,
              description: "The target vocabulary word",
            },
            definition: {
              type: SchemaType.STRING as const,
              description: "The definition of the target word",
            },
            question: {
              type: SchemaType.STRING as const,
              description: "The quiz question asking about the word without revealing it",
            },
            options: {
              type: SchemaType.ARRAY as const,
              items: {
                type: SchemaType.STRING as const,
                description: "A possible answer option",
              },
              description: "Four answer choices, including the correct word",
            },
            correct_option_idx: {
              type: SchemaType.NUMBER as const,
              description: "The index (0-3) of the correct answer in the options array",
            },
          },
          required: ["word", "definition", "question", "options", "correct_option_idx"],
        },
      },
    };
    
    // Create model
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig
    });
    
    // Generate quiz questions
    const result = await model.generateContent(promptText);
    
    // Parse the JSON result
    const quizQuestions: QuizQuestion[] = JSON.parse(result.response.text());
    
    // Validate the response format
    const validatedQuestions = quizQuestions.map(question => {
      // Ensure options array has exactly 4 items
      if (!Array.isArray(question.options) || question.options.length !== 4) {
        question.options = [question.word, ...Array(3).fill('')].slice(0, 4);
        question.correct_option_idx = 0;
      }
      
      // Ensure correct_option_idx is within bounds
      if (question.correct_option_idx < 0 || question.correct_option_idx > 3) {
        question.correct_option_idx = 0;
      }
      
      return question;
    });
    
    return validatedQuestions;
  } catch (error) {
    console.error('Error generating quiz questions:', error);
    throw error;
  }
}
