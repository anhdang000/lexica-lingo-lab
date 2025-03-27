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

export interface FileInput {
  path: string;
  mimeType?: string;
}

export async function analyzeText(text: string, files: FileInput[] = []): Promise<WordDefinition[]> {
  // Get a random API key from the comma-separated list
  const apiKeys = (import.meta.env.VITE_GEMINI_API_KEY || '').split(',');
  const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
  
  if (!apiKey) {
    throw new Error('Gemini API key not found');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = import.meta.env.VITE_GEMINI_MODEL_NAME || 'gemini-1.5-pro';
  const fileManager = new GoogleAIFileManager(apiKey);
  
  // Function to upload files to Gemini
  async function uploadToGemini(fileInput: FileInput) {
    try {
      const mimeType = fileInput.mimeType || 
        fileInput.path.endsWith('.png') ? 'image/png' :
        fileInput.path.endsWith('.jpg') || fileInput.path.endsWith('.jpeg') ? 'image/jpeg' :
        fileInput.path.endsWith('.pdf') ? 'application/pdf' :
        fileInput.path.endsWith('.txt') ? 'text/plain' :
        fileInput.path.endsWith('.html') ? 'text/html' :
        'application/octet-stream';
      
      const uploadResult = await fileManager.uploadFile(fileInput.path, {
        mimeType,
        displayName: fileInput.path,
      });
      
      console.log(`Uploaded file ${uploadResult.file.displayName} as: ${uploadResult.file.name}`);
      return uploadResult.file;
    } catch (error) {
      console.error(`Error uploading file ${fileInput.path}:`, error);
      throw error;
    }
  }
  
  // Function to wait for files to be active
  async function waitForFilesActive(uploadedFiles) {
    console.log("Waiting for file processing...");
    for (const name of uploadedFiles.map((file) => file.name)) {
      let file = await fileManager.getFile(name);
      while (file.state === "PROCESSING") {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        file = await fileManager.getFile(name);
      }
      if (file.state !== "ACTIVE") {
        throw Error(`File ${file.name} failed to process`);
      }
    }
    console.log("...all files ready");
    return uploadedFiles;
  }

  try {
    // Only upload and process files if files array is not empty
    const uploadedFiles = files.length > 0 ? await Promise.all(files.map(uploadToGemini)) : [];
    
    // Wait for files to be processed if there are any
    if (uploadedFiles.length > 0) {
      await waitForFilesActive(uploadedFiles);
    }
    
    // Base prompt text
    const promptText = `You are an expert language teacher. Your task is to identify up to 10 words from the provided ${files.length > 0 ? 'text and/or files' : 'text'} that would be valuable for a language learner to study.

Select words that are:
1. Advanced and relatively uncommon
2. Useful in various contexts
3. Worth adding to one's vocabulary

Return only an array of words, without any additional explanation.

${text ? `Text to analyze:\n${text}` : ''}`;

    const generationConfig = {
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
    };
    
    // Schema for structural generation
    const responseSchema = {
      type: SchemaType.ARRAY,
      description: "List of vocabulary words",
      items: {
        type: SchemaType.STRING,
        description: "A vocabulary word that would be valuable for a language learner",
      },
    };
    
    // If we have files, use a chat session
    let result;
    if (uploadedFiles.length > 0) {
      const model = genAI.getGenerativeModel({
        model: modelName,
      });
      
      // Prepare the initial parts array with file data
      const initialParts = uploadedFiles.map(file => ({
        fileData: {
          mimeType: file.mimeType,
          fileUri: file.uri,
        }
      }));
      
      const chatSession = model.startChat({
        generationConfig,
        history: [
          {
            role: "user",
            parts: initialParts,
          }
        ],
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      });
      
      // Send the prompt text as a separate message
      result = await chatSession.sendMessage(promptText);
    } else {
      // For text-only, use standard prompt with schema in model config
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      });
      
      result = await model.generateContent(promptText);
    }

    const words: string[] = JSON.parse(result.response.text());
    
    // Look up each word and filter out any null results
    const definitions = await Promise.all(
      words.map(word => lookupWord(word))
    );
    
    return definitions.filter((def): def is WordDefinition => def !== null);
  } catch (error) {
    console.error('Error analyzing text/files:', error);
    throw error;
  }
}

/**
 * Fetches content from a specified URL using the Oxylabs API
 * 
 * @param url - The URL to fetch content from
 * @param options - Optional configuration for the request
 * @returns Promise resolving to the content from the URL
 */
export async function fetchUrlContent(url: string, options?: { render?: 'html' }): Promise<string> {
  const username = import.meta.env.VITE_OXYLABS_USERNAME;
  const password = import.meta.env.VITE_OXYLABS_PASSWORD;

  if (!username || !password) {
    throw new Error('Oxylabs credentials not found in environment variables');
  }

  const body = {
    "source": "universal",
    "url": url,
    ...(options?.render && { "render": options.render })
  };

  const requestOptions = {
    "hostname": "realtime.oxylabs.io",
    "path": "/v1/queries",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Basic " + Buffer.from(`${username}:${password}`).toString("base64")
    }
  };

  return new Promise((resolve, reject) => {
    const request = https.request(requestOptions, (response) => {
      let data = "";
      
      response.on("data", (chunk) => {
        data += chunk;
      });
      
      response.on("end", () => {
        try {
          const responseData = JSON.parse(data);
          
          // Check if the results array exists and has at least one entry with content
          if (responseData.results && 
              Array.isArray(responseData.results) && 
              responseData.results.length > 0 && 
              responseData.results[0].content) {
            resolve(responseData.results[0].content);
          } else {
            reject(new Error('No content found in the response'));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    request.on("error", (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    request.write(JSON.stringify(body));
    request.end();
  });
}
