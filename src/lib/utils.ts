import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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
