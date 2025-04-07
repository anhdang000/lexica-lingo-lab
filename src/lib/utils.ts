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
    examples?: string[];
  }>;
  stems?: string[];
  collectionName?: string;
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

    // If stems are available, use the first stem as the word
    if (wordDef.stems && wordDef.stems.length > 0) {
      wordDef.word = wordDef.stems[0];
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
  return new Promise((resolve, reject) => {
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

export async function generateVocabularyFromTopic(inputText: string): Promise<AnalysisResults> {
  // Get a random API key from the comma-separated list
  const apiKeys = (import.meta.env.VITE_GEMINI_API_KEY || '').split(',');
  const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
  
  if (!apiKey) {
    throw new Error('Gemini API key not found');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = import.meta.env.VITE_GEMINI_MODEL_NAME || 'gemini-2.0-flash-lite';
  
  // Create prompt text for vocabulary generation from a topic
  const promptText = `
You are an advanced vocabulary instructor tasked with generating useful vocabulary words related to a given input.

Input text: ${inputText}

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
      vocabulary: definitions.filter((def): def is WordDefinition => def !== null),
      topics: topics,
      topicName: generatedTopicName
    };
  } catch (error) {
    console.error('Error generating vocabulary from topic:', error);
    throw error;
  }
}

export async function analyzeVocabulary(input: string, files: FileInput[] = []): Promise<AnalysisResults> {
  // If input is a single word or short phrase and no files are provided, try lookupWord first
  if (isSingleWordOrPhrases(input) && files.length === 0) {
    const lookupResult = await lookupWord(input);
    if (lookupResult) {
      return {
        vocabulary: [lookupResult],
        topics: [],
        topicName: lookupResult.word
      };
    }
  }
  
  // For files analysis
  if (files.length > 0) {
    return analyzeFiles(files);
  }
  
  // For longer text analysis
  return analyzeText(input);
}

export async function analyzeText(text: string): Promise<AnalysisResults> {
  // Get a random API key from the comma-separated list
  const apiKeys = (import.meta.env.VITE_GEMINI_API_KEY || '').split(',');
  const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
  
  if (!apiKey) {
    throw new Error('Gemini API key not found');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = import.meta.env.VITE_GEMINI_MODEL_NAME || 'gemini-2.0-flash-lite';
  
  // Create prompt text for vocabulary and topic extraction
  const promptText = `
You are an advanced vocabulary instructor tasked with identifying the most valuable vocabulary words and related topics from the provided content.

Your task is to extract three things:
1. Vocabulary: A carefully curated array of sophisticated words that would enhance an English language learner's lexicon
2. Topics: 3-5 relevant topics or themes that categorize the content
3. Content: An simple summary writeup, strictly use vocabulary extracted from the original source, each vocabulary word from your vocabulary list MUST be wrapped in <word> tags, like this: <word>vocabulary</word><synonym>lexicon</synonym>. The synonym should be a word that is similar in meaning to the vocabulary word, wrapped in <synonym> tags and must be simpler.

For vocabulary, select words that meet these criteria:
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
- IMPORTANT: Each vocabulary word MUST be immediately followed by an appropriate synonym wrapped in <synonym> tags: <synonym>lexicon</synonym>

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
      vocabularyItems.map(item => lookupWord(item.word).then(def => {
        if (def) {
          return {
            ...def,
            collectionName: item.collectionName
          };
        }
        return null;
      }))
    );
    
    return {
      vocabulary: definitions.filter((def): def is WordDefinition & { collectionName: string } => def !== null),
      topics: topics,
      topicName: '',
      content: content
    };
  } catch (error) {
    console.error('Error analyzing text:', error);
    throw error;
  }
}

export async function analyzeFiles(files: FileInput[]): Promise<AnalysisResults> {
  // Get a random API key from the comma-separated list
  const apiKeys = (import.meta.env.VITE_GEMINI_API_KEY || '').split(',');
  const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
  
  if (!apiKey) {
    throw new Error('Gemini API key not found');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = import.meta.env.VITE_GEMINI_MODEL_NAME || 'gemini-2.0-flash-lite';
  
  // Create prompt text for vocabulary and topic extraction
  const promptText = `
You are an advanced vocabulary instructor tasked with identifying the most valuable vocabulary words and related topics from the provided content.

Your task is to extract three things:
1. Vocabulary: A carefully curated array of sophisticated words that would enhance an English language learner's lexicon
2. Topics: 3-5 relevant topics or themes that categorize the content
3. Content: An simple explanatory writeup, strictly use vocabulary extracted, each vocabulary word from your vocabulary list MUST be wrapped in <word> tags, like this: <word>vocabulary</word><synonym>lexicon</synonym>. The synonym should be a word that is similar in meaning to the vocabulary word, wrapped in <synonym> tags and must be simpler.

For vocabulary, select words that meet these criteria:
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
      vocabularyItems.map(item => lookupWord(item.word).then(def => {
        if (def) {
          return {
            ...def,
            collectionName: item.collectionName
          };
        }
        return null;
      }))
    );
    
    return {
      vocabulary: definitions.filter((def): def is WordDefinition & { collectionName: string } => def !== null),
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
 * Fetches content from a specified URL
 * Note: Due to CORS restrictions, this uses a simplified text extraction approach
 * 
 * @param url - The URL to fetch content from
 * @param options - Optional configuration for the request
 * @returns Promise resolving to the content from the URL
 */
export async function fetchUrlContent(url: string, options?: { render?: 'html' }): Promise<string> {
  try {
    // In a production environment, this would use a proxy server or backend API
    // to avoid CORS issues. For this demo, we'll use a simplified approach.
    
    // First, try a simple extraction approach with a CORS proxy
    // Note: This is not reliable for production use and is rate-limited
    const corsProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    try {
      const response = await fetch(corsProxyUrl, { 
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch via proxy: ${response.status}`);
      }
      
      const content = await response.text();
      return processHtmlContent(content, url);
    
    } catch (proxyError) {
      console.warn(`CORS proxy failed: ${proxyError.message}. Attempting URL metadata extraction.`);
      
      // Fallback to metadata extraction - pretend we successfully got content
      // In a real app, you would implement server-side URL fetching
      return extractTextFromUrl(url);
    }
  } catch (error) {
    console.error('Error fetching URL content:', error);
    throw new Error(`Failed to fetch content: ${error.message}`);
  }
}

/**
 * Process HTML content to extract the main text
 */
function processHtmlContent(htmlContent: string, url: string): string {
  try {
    // Create a new DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // Get the page title
    const title = doc.title || url;
    
    // Get main content - focus on article content, paragraphs, and headings
    const mainContent = doc.querySelector('article') || doc.body;
    
    // Extract text from paragraphs and headings
    const paragraphs = Array.from(mainContent.querySelectorAll('p, h1, h2, h3, h4, h5, h6'));
    
    const textContent = paragraphs
      .map(p => p.textContent?.trim())
      .filter(text => text && text.length > 20) // Filter out short text fragments
      .join('\n\n');
    
    return `Title: ${title}\n\n${textContent || mainContent.textContent}`.trim();
  } catch (error) {
    // If HTML processing fails, return raw HTML (better than nothing)
    console.warn('HTML processing failed, returning unprocessed content');
    return htmlContent;
  }
}

/**
 * Fallback method to extract text from URL when direct fetching fails
 * This simulates content extraction in case CORS or other issues prevent direct access
 */
function extractTextFromUrl(url: string): string {
  // Get domain from URL
  const domain = new URL(url).hostname;
  const path = new URL(url).pathname;
  
  // Extract potential title from URL
  const pathSegments = path.split('/').filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1] || '';
  const title = lastSegment
    .replace(/[_-]/g, ' ')
    .replace(/\.\w+$/, '') // Remove file extension
    .trim();
  
  // Create a simulated article text based on the URL
  return `
  URL: ${url}
  
  [Note: Direct content extraction failed due to CORS restrictions. Using URL metadata only.]
  
  Title: ${title || 'Unknown article'}
  
  Source: ${domain}
  
  Path: ${path}
  
  This URL appears to contain content about ${title || 'an unknown topic'}.
  `.trim();
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
