import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { WordDefinition } from "@/lib/utils";

// Function to get user collections
export async function getUserCollections(userId: string) {
  try {
    const { data, error } = await supabase
      .from("collections")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching collections:", error);
      toast({
        title: "Error",
        description: "Failed to load collections. Please try again later.",
        variant: "destructive",
      });
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Exception fetching collections:", error);
    toast({
      title: "Error",
      description: "An unexpected error occurred. Please try again later.",
      variant: "destructive",
    });
    return [];
  }
}

// Function to get practice statistics for a collection
export async function getCollectionPracticeStats(userId: string, collectionId: string) {
  try {
    // Get all word_ids in the collection
    const { data: collectionWords, error: totalError } = await supabase
      .from("collection_words")
      .select("word_id")
      .eq("collection_id", collectionId)
      .eq("user_id", userId);

    if (totalError) {
      console.error("Error fetching collection words:", totalError);
      return { totalWords: 0, practicedWords: 0, percentage: 0 };
    }
    
    // Count distinct word_ids for total words
    const distinctWordIds = new Set(collectionWords?.map(item => item.word_id) || []);
    const totalWords = distinctWordIds.size;
    
    if (totalWords === 0) {
      return { totalWords: 0, practicedWords: 0, percentage: 0 };
    }

    // Get all practice session words for this collection
    const { data: practicedWordsData, error: practicedError } = await supabase
      .from("practice_session_words")
      .select("word_id")
      .eq("collection_id", collectionId)
      .eq("user_id", userId);

    if (practicedError) {
      console.error("Error fetching practiced words:", practicedError);
      return { totalWords, practicedWords: 0, percentage: 0 };
    }
    
    // Count distinct practiced word_ids
    const distinctPracticedWordIds = new Set(practicedWordsData?.map(item => item.word_id) || []);
    const practicedWords = distinctPracticedWordIds.size;

    // Calculate percentage
    const percentage = totalWords > 0 ? (practicedWords / totalWords) * 100 : 0;

    return { totalWords, practicedWords, percentage };
  } catch (error) {
    console.error("Exception fetching collection practice stats:", error);
    return { totalWords: 0, practicedWords: 0, percentage: 0 };
  }
}

// Function to create a new collection
export async function createCollection(userId: string, name: string) {
  try {
    const { data, error } = await supabase
      .from("collections")
      .insert({
        user_id: userId,
        name,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating collection:", error);
      toast({
        title: "Error",
        description: "Failed to create collection. Please try again.",
        variant: "destructive",
      });
      return null;
    }

    toast({
      title: "Success",
      description: "Collection created successfully!",
    });

    return data;
  } catch (error) {
    console.error("Exception creating collection:", error);
    toast({
      title: "Error",
      description: "An unexpected error occurred. Please try again later.",
      variant: "destructive",
    });
    return null;
  }
}

// Function to get words from a collection
export async function getCollectionWords(collectionId: string) {
  try {
    // First, get all collection word entries
    const { data: collectionEntries, error: collectionError } = await supabase
      .from("collection_words")
      .select(`
        *,
        words:word_id(id, word, phonetic, audio_url, stems),
        meanings:meaning_id(id, definition, part_of_speech, examples)
      `)
      .eq("collection_id", collectionId);

    if (collectionError) {
      console.error("Error fetching collection words:", collectionError);
      toast({
        title: "Error",
        description: "Failed to load words. Please try again later.",
        variant: "destructive",
      });
      return [];
    }

    if (!collectionEntries || collectionEntries.length === 0) {
      return [];
    }

    // Now get all meanings for each word in the collection
    // Group entries by word_id to avoid duplicate queries
    const wordIds = [...new Set(collectionEntries.map(entry => entry.word_id))];
    
    // Fetch all meanings for these words
    const { data: allMeanings, error: meaningsError } = await supabase
      .from("word_meanings")
      .select(`
        id, 
        word_id, 
        definition,
        part_of_speech,
        examples,
        ordinal_index
      `)
      .in("word_id", wordIds)
      .order("ordinal_index", { ascending: true });

    if (meaningsError) {
      console.error("Error fetching word meanings:", meaningsError);
      // Continue with what we have even if this fails
    }

    // Organize meanings by word_id
    const meaningsByWordId = (allMeanings || []).reduce((acc, meaning) => {
      if (!acc[meaning.word_id]) {
        acc[meaning.word_id] = [];
      }
      acc[meaning.word_id].push(meaning);
      return acc;
    }, {} as Record<string, any[]>);

    // Enhance collection entries with all meanings
    const enhancedEntries = collectionEntries.map(entry => ({
      ...entry,
      all_meanings: meaningsByWordId[entry.word_id] || []
    }));

    return enhancedEntries || [];
  } catch (error) {
    console.error("Exception fetching collection words:", error);
    toast({
      title: "Error",
      description: "An unexpected error occurred. Please try again later.",
      variant: "destructive",
    });
    return [];
  }
}

// Function to get practice sessions for a user
export async function getUserPracticeSessions(userId: string) {
  try {
    const { data, error } = await supabase
      .from("practice_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching practice sessions:", error);
      toast({
        title: "Error",
        description: "Failed to load practice history. Please try again later.",
        variant: "destructive",
      });
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Exception fetching practice sessions:", error);
    toast({
      title: "Error",
      description: "An unexpected error occurred. Please try again later.",
      variant: "destructive",
    });
    return [];
  }
}

// Function to create a practice session
export async function createPracticeSession(
  userId: string, 
  mode: 'flashcard' | 'quiz' | 'findword',
  totalWords: number
) {
  try {
    const { data, error } = await supabase
      .from("practice_sessions")
      .insert({
        user_id: userId,
        mode,
        total_words: totalWords,
        correct_answers: 0, // Will be updated as the session progresses
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating practice session:", error);
      toast({
        title: "Error",
        description: "Failed to start practice session. Please try again.",
        variant: "destructive",
      });
      return null;
    }

    return data;
  } catch (error) {
    console.error("Exception creating practice session:", error);
    toast({
      title: "Error",
      description: "An unexpected error occurred. Please try again later.",
      variant: "destructive",
    });
    return null;
  }
}

// Function to update practice session results
export async function completePracticeSession(
  sessionId: string,
  correctAnswers: number,
  isCompleted: boolean = true
) {
  try {
    const { data, error } = await supabase
      .from("practice_sessions")
      .update({
        correct_answers: correctAnswers,
        completed: isCompleted,
        completed_at: new Date().toISOString(),
      })
      .eq("id", sessionId)
      .select()
      .single();

    if (error) {
      console.error("Error updating practice session:", error);
      toast({
        title: "Error",
        description: "Failed to save practice results. Please try again.",
        variant: "destructive",
      });
      return null;
    }

    return data;
  } catch (error) {
    console.error("Exception updating practice session:", error);
    toast({
      title: "Error",
      description: "An unexpected error occurred. Please try again later.",
      variant: "destructive",
    });
    return null;
  }
}

// Function to update total words count in a practice session
export async function updatePracticeSessionTotalWords(
  sessionId: string,
  totalWords: number
) {
  try {
    const { data, error } = await supabase
      .from("practice_sessions")
      .update({
        total_words: totalWords
      })
      .eq("id", sessionId)
      .select()
      .single();

    if (error) {
      console.error("Error updating practice session total words:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Exception updating practice session total words:", error);
    return null;
  }
}

// Function to record practice session word results
export async function recordPracticeWordResult(
  sessionId: string,
  wordId: string,
  meaningId: string,
  collectionId: string,
  isCorrect: boolean
) {
  try {
    // Get user_id from the practice session
    const { data: session, error: sessionError } = await supabase
      .from("practice_sessions")
      .select("user_id")
      .eq("id", sessionId)
      .single();

    if (sessionError) {
      console.error("Error getting practice session:", sessionError);
      return false;
    }

    const { error } = await supabase
      .from("practice_session_words")
      .insert({
        session_id: sessionId,
        user_id: session.user_id,
        word_id: wordId,
        meaning_id: meaningId,
        collection_id: collectionId,
        is_correct: isCorrect,
      });

    if (error) {
      console.error("Error recording word result:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Exception recording word result:", error);
    return false;
  }
}

// Function to search for words
export async function searchWords(query: string) {
  try {
    if (!query || query.trim().length < 2) return [];

    // First search for direct word matches
    const { data: directMatches, error: directError } = await supabase
      .from("words")
      .select(`
        id, 
        word, 
        phonetic, 
        audio_url,
        meanings:word_meanings(id, definition, part_of_speech, examples)
      `)
      .ilike("word", `%${query}%`)
      .limit(10);

    if (directError) {
      console.error("Error searching words:", directError);
      return [];
    }

    // If we found direct matches, return them
    if (directMatches && directMatches.length > 0) {
      return directMatches;
    }

    interface DefinitionMatch {
      id: string;
      definition: string;
      part_of_speech: string | null;
      examples: string[] | null;
      word: {
        id: string;
        word: string;
        phonetic: string | null;
        audio_url: string | null;
      };
    }

    // Otherwise try full-text search on definitions
    const { data: definitionMatches, error: definitionError } = await supabase
      .from("word_meanings")
      .select(`
        id,
        definition,
        part_of_speech,
        examples,
        word:word_id(id, word, phonetic, audio_url)
      `)
      .textSearch("search_vector", query)
      .limit(10) as { data: DefinitionMatch[] | null; error: any };

    if (definitionError) {
      console.error("Error searching word meanings:", definitionError);
      return [];
    }

    // Restructure the data to match the format of directMatches
    if (definitionMatches && definitionMatches.length > 0) {
      interface RestructuredWord {
        id: string;
        word: string;
        phonetic: string | null;
        audio_url: string | null;
        meanings: Array<{
          id: string;
          definition: string;
          part_of_speech: string | null;
          examples: string[] | null;
        }>;
      }

      const restructured = definitionMatches.reduce<RestructuredWord[]>((acc, meaning) => {
        const existingWord = acc.find(w => w.id === meaning.word.id);
        
        if (existingWord) {
          existingWord.meanings.push({
            id: meaning.id,
            definition: meaning.definition,
            part_of_speech: meaning.part_of_speech,
            examples: meaning.examples
          });
        } else {
          acc.push({
            id: meaning.word.id,
            word: meaning.word.word,
            phonetic: meaning.word.phonetic,
            audio_url: meaning.word.audio_url,
            meanings: [{
              id: meaning.id,
              definition: meaning.definition,
              part_of_speech: meaning.part_of_speech,
              examples: meaning.examples
            }]
          });
        }
        
        return acc;
      }, []);
      
      return restructured;
    }

    return [];
  } catch (error) {
    console.error("Exception searching words:", error);
    return [];
  }
}

// Function to get user profile
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Exception fetching user profile:", error);
    return null;
  }
}

// Function to update user profile
export async function updateUserProfile(userId: string, updates: any) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating user profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
      return null;
    }

    toast({
      title: "Success",
      description: "Profile updated successfully!",
    });

    return data;
  } catch (error) {
    console.error("Exception updating user profile:", error);
    toast({
      title: "Error",
      description: "An unexpected error occurred. Please try again later.",
      variant: "destructive",
    });
    return null;
  }
}

// Function to get or create collection with a specific name
export async function getOrCreateCollection(userId: string, name: string) {
  try {
    // Sanitize collection name to ensure it's valid for use as a key
    const sanitizedName = name.trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    const collectionName = sanitizedName || 'unnamed-collection';
    
    // Use the original name as provided for display
    const displayName = name.trim();
    
    // First try to find existing collection with this name
    const { data: existingCollection, error: findError } = await supabase
      .from("collections")
      .select("*")
      .eq("user_id", userId)
      .eq("name", displayName)  // Look for the original display name
      .single();

    if (findError && findError.code !== "PGRST116") { // PGRST116 is "not found" error
      console.error(`Error finding collection '${collectionName}':`, findError);
      throw findError;
    }

    if (existingCollection) {
      return existingCollection;
    }

    // Create new collection if it doesn't exist
    const { data: newCollection, error: createError } = await supabase
      .from("collections")
      .insert({
        user_id: userId,
        name: displayName, // Use the original display name instead of sanitized name
      })
      .select()
      .single();

    if (createError) {
      console.error(`Error creating collection '${displayName}':`, createError);
      throw createError;
    }

    return newCollection;
  } catch (error) {
    console.error("Exception in getOrCreateCollection:", error);
    throw error;
  }
}

// Function to get or create general collection
export async function getOrCreateGeneralCollection(userId: string) {
  try {
    // First try to find existing general collection
    const { data: existingCollection, error: findError } = await supabase
      .from("collections")
      .select("*")
      .eq("user_id", userId)
      .eq("name", "General")
      .single();

    if (findError && findError.code !== "PGRST116") { // PGRST116 is "not found" error
      console.error("Error finding general collection:", findError);
      throw findError;
    }

    if (existingCollection) {
      return existingCollection;
    }

    // Create new general collection if it doesn't exist
    const { data: newCollection, error: createError } = await supabase
      .from("collections")
      .insert({
        user_id: userId,
        name: "General",
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating general collection:", createError);
      throw createError;
    }

    return newCollection;
  } catch (error) {
    console.error("Exception in getOrCreateGeneralCollection:", error);
    throw error;
  }
}

// Function to add a word to the database and collection
export async function addWordToCollection(
  userId: string,  
  wordData: WordDefinition,
  collectionId: string
) {
  try {
    // 1. Create or get the word entry
    const { data: word, error: wordError } = await supabase
      .from("words")
      .insert({
        word: wordData.word,
        phonetic: wordData.pronunciation?.text || null,
        audio_url: wordData.pronunciation?.audio || null,
        stems: wordData.stems || [],
      })
      .select()
      .single();

    // Handle case where word already exists (unique violation)
    let existingWord = word;
    if (wordError) {
      if (wordError.code === "23505") { // Unique violation - word already exists
        const { data: existing, error: getError } = await supabase
          .from("words")
          .select("*")
          .eq("word", wordData.word)
          .single();
        
        if (getError) {
          console.error("Error getting existing word:", getError);
          throw getError;
        }
        existingWord = existing;
      } else {
        console.error("Error creating word:", wordError);
        throw wordError;
      }
    }

    // 2. Check if meanings already exist for this word
    const { data: existingMeanings, error: checkMeaningsError } = await supabase
      .from("word_meanings")
      .select("*")
      .eq("word_id", existingWord.id);
    
    if (checkMeaningsError) {
      console.error("Error checking existing meanings:", checkMeaningsError);
      throw checkMeaningsError;
    }
    
    let meanings = existingMeanings;
    
    // Only create new meanings if they don't exist
    if (!existingMeanings || existingMeanings.length === 0) {
      // Create meanings for the word
      const meaningsToInsert = wordData.definitions.map((def, index) => ({
        word_id: existingWord.id,
        ordinal_index: index + 1,
        part_of_speech: wordData.partOfSpeech,
        definition: def.meaning,
        examples: def.examples || [],
      }));

      const { data: newMeanings, error: meaningsError } = await supabase
        .from("word_meanings")
        .insert(meaningsToInsert)
        .select();

      if (meaningsError) {
        console.error("Error creating word meanings:", meaningsError);
        throw meaningsError;
      }
      
      meanings = newMeanings;
    }

    // 3. Add all word meanings to the collection (if not already added)
    for (const meaning of meanings) {
      // Check if this meaning is already in the collection for this user
      const { data: existingCollectionWord, error: checkCollectionWordError } = await supabase
        .from("collection_words")
        .select("*")
        .eq("collection_id", collectionId)
        .eq("word_id", existingWord.id)
        .eq("meaning_id", meaning.id)
        .eq("user_id", userId)
        .maybeSingle();
      
      if (checkCollectionWordError) {
        console.error("Error checking collection word:", checkCollectionWordError);
        // Continue with other meanings even if one fails
        continue;
      }
      
      // Skip if this meaning is already in the collection
      if (existingCollectionWord) continue;
      
      // Add to collection_words if not exists
      const { error: collectionWordError } = await supabase
        .from("collection_words")
        .insert({
          collection_id: collectionId,
          word_id: existingWord.id,
          meaning_id: meaning.id,
          user_id: userId,
          status: "new",
        });

      if (collectionWordError && collectionWordError.code !== "23505") { // Not a unique violation
        console.error("Error adding word meaning to collection:", collectionWordError);
        // Continue with other meanings even if one fails
      }
    }

    return true;
  } catch (error) {
    console.error("Exception in addWordToCollection:", error);
    return false;
  }
}

// Function to remove a word-meaning from a collection
export async function removeWordFromCollection(
  collectionId: string,
  wordId: string,
  userId: string
) {
  try {
    // 1. Remove from collection_words
    const { error: collectionError } = await supabase
      .from("collection_words")
      .delete()
      .eq("collection_id", collectionId)
      .eq("word_id", wordId)
      .eq("user_id", userId);

    if (collectionError) {
      console.error("Error removing word from collection:", collectionError);
      toast({
        title: "Error",
        description: "Failed to remove word from collection. Please try again.",
        variant: "destructive",
      });
      return false;
    }

    // 2. Remove from practice_session_words that reference this collection
    const { error: practiceError } = await supabase
      .from("practice_session_words")
      .delete()
      .eq("word_id", wordId)
      .eq("collection_id", collectionId)
      .eq("user_id", userId);

    if (practiceError) {
      console.error("Error removing word from practice sessions:", practiceError);
      // Continue with next step even if this fails
    }

    return true;
  } catch (error) {
    console.error("Exception removing word from collection:", error);
    toast({
      title: "Error",
      description: "An unexpected error occurred. Please try again later.",
      variant: "destructive",
    });
    return false;
  }
}

// Function to fetch random words for flashcard practice
export async function getFlashcardWords(userId: string, count: number = 5): Promise<any[]> {
  try {
    const { data: collections, error: collectionsError } = await supabase
      .from('collections')
      .select('id')
      .eq('user_id', userId);

    if (collectionsError) throw collectionsError;
    if (!collections.length) return [];

    const collectionIds = collections.map(c => c.id);

    // First, try to get words with status 'new'
    const { data: newWords, error: newWordsError } = await supabase
      .from('collection_words')
      .select(`
        id,
        collection_id,
        word_id,
        meaning_id,
        status,
        words:word_id(
          id,
          word,
          phonetic
        ),
        meanings:meaning_id(
          id,
          word_id,
          definition,
          part_of_speech,
          examples
        )
      `)
      .in('collection_id', collectionIds)
      .eq('user_id', userId)
      .eq('status', 'new')
      .order('meaning_id')
      .limit(count);

    if (newWordsError) throw newWordsError;
    
    let selectedWords = newWords || [];
    
    // If we don't have enough 'new' words, get additional words with status 'learning' or 'mastered'
    if (selectedWords.length < count) {
      const remainingCount = count - selectedWords.length;
      
      const { data: additionalWords, error: additionalWordsError } = await supabase
        .from('collection_words')
        .select(`
          id,
          collection_id,
          word_id,
          meaning_id,
          status,
          words:word_id(
            id,
            word,
            phonetic
          ),
          meanings:meaning_id(
            id,
            word_id,
            definition,
            part_of_speech,
            examples
          )
        `)
        .in('collection_id', collectionIds)
        .eq('user_id', userId)
        .in('status', ['learning', 'mastered'])
        .order('meaning_id')
        .limit(remainingCount);
      
      if (additionalWordsError) throw additionalWordsError;
      
      // Combine the words
      selectedWords = [...selectedWords, ...(additionalWords || [])];
    }
    
    if (!selectedWords.length) return [];

    // Shuffle the selected words to randomize them
    selectedWords = shuffleArray(selectedWords);

    // Transform to the format expected by the flashcard component
    return selectedWords.map(item => {
      // Type assertions to help TypeScript understand the structure
      const wordsData = item.words as any;
      const meaningsData = item.meanings as any;
      
      // Determine if we're dealing with arrays or objects
      const wordInfo = Array.isArray(wordsData) ? wordsData[0] : wordsData;
      const meaningInfo = Array.isArray(meaningsData) ? meaningsData[0] : meaningsData;
      
      return {
        id: item.word_id,
        meaningId: item.meaning_id,
        word: wordInfo?.word,
        phonetic: {
          text: wordInfo?.phonetic || '',
          audio: '' // No audio available in current schema
        },
        partOfSpeech: meaningInfo?.part_of_speech || '',
        definition: meaningInfo?.definition,
        example: meaningInfo?.examples && Array.isArray(meaningInfo.examples) && meaningInfo.examples.length > 0
          ? meaningInfo.examples[0]
          : '',
        collectionId: item.collection_id,
        status: item.status
      };
    });
  } catch (error) {
    console.error('Error fetching flashcard words:', error);
    return [];
  }
}

// Helper function to shuffle an array (Fisher-Yates algorithm)
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export async function getQuizQuestions(userId: string, count: number = 3): Promise<any[]> {
  try {
    const { data: collections, error: collectionsError } = await supabase
      .from('collections')
      .select('id')
      .eq('user_id', userId);

    if (collectionsError) throw collectionsError;
    if (!collections.length) return [];

    const collectionIds = collections.map(c => c.id);

    // Get words from user's collections through collection_words join
    const { data: collectionWords, error: collectionWordsError } = await supabase
      .from('collection_words')
      .select(`
        id,
        collection_id,
        word_id,
        meaning_id,
        words:word_id(
          id,
          word,
          phonetic
        ),
        meanings:meaning_id(
          id,
          word_id,
          definition,
          part_of_speech,
          examples
        )
      `)
      .in('collection_id', collectionIds)
      .eq('user_id', userId)
      .limit(count * 3); // Get more words for options

    if (collectionWordsError) throw collectionWordsError;
    if (!collectionWords.length) return [];

    // Shuffle the words array client-side
    const shuffledWords = [...collectionWords].sort(() => Math.random() - 0.5);

    // Ensure we have enough words for the quiz (at least count)
    if (shuffledWords.length < count) return [];

    // Transform data into quiz questions
    const quizQuestions = [];
    
    // Use the first 'count' words as correct answers
    for (let i = 0; i < count; i++) {
      if (i >= shuffledWords.length) break;
      
      const correctWord = shuffledWords[i];
      const wordObj = Array.isArray(correctWord.words) ? correctWord.words[0] : correctWord.words;
      const meaningObj = Array.isArray(correctWord.meanings) ? correctWord.meanings[0] : correctWord.meanings;
      
      // Get 3 random words for incorrect options (excluding the correct one)
      const incorrectOptions = shuffledWords
        .filter((w, idx) => idx !== i && idx >= count)
        .slice(0, 3)
        .map(w => {
          const wordData = Array.isArray(w.words) ? w.words[0] : w.words;
          return wordData?.word;
        });
      
      // If we don't have enough incorrect options, skip this question
      if (incorrectOptions.length < 3) continue;
      
      // Create options including the correct one
      const options = [...incorrectOptions, wordObj?.word];
      
      // Shuffle options
      for (let j = options.length - 1; j > 0; j--) {
        const k = Math.floor(Math.random() * (j + 1));
        [options[j], options[k]] = [options[k], options[j]];
      }
      
      // Create a context-based question based on the definition
      const question = `Which word best matches this definition: "${meaningObj?.definition}"?`;
      
      quizQuestions.push({
        word: wordObj?.word,
        definition: meaningObj?.definition,
        question,
        options,
        correct_option_idx: options.indexOf(wordObj?.word),
        wordId: correctWord.word_id,
        meaningId: correctWord.meaning_id,
        collectionId: correctWord.collection_id
      });
    }
    
    return quizQuestions;
  } catch (error) {
    console.error('Error fetching quiz questions:', error);
    return [];
  }
}
