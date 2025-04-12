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
    // Get all word_variant_ids in the collection
    const { data: collectionWords, error: totalError } = await supabase
      .from("collection_words")
      .select("word_variant_id")
      .eq("collection_id", collectionId)
      .eq("user_id", userId);

    if (totalError) {
      console.error("Error fetching collection words:", totalError);
      return { totalWords: 0, practicedWords: 0, percentage: 0 };
    }
    
    // Count distinct word_variant_ids for total words
    const distinctWordVariantIds = new Set(collectionWords?.map(item => item.word_variant_id) || []);
    const totalWords = distinctWordVariantIds.size;
    
    if (totalWords === 0) {
      return { totalWords: 0, practicedWords: 0, percentage: 0 };
    }

    // Get all practice session words for this collection
    const { data: practicedWordsData, error: practicedError } = await supabase
      .from("practice_session_words")
      .select("word_variant_id")
      .eq("collection_id", collectionId)
      .eq("user_id", userId);

    if (practicedError) {
      console.error("Error fetching practiced words:", practicedError);
      return { totalWords, practicedWords: 0, percentage: 0 };
    }
    
    // Count distinct practiced word_variant_ids
    const distinctPracticedWordVariantIds = new Set(practicedWordsData?.map(item => item.word_variant_id) || []);
    const practicedWords = distinctPracticedWordVariantIds.size;

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
export async function getCollectionWords(
  userId: string,
  collectionId: string
) {
  try {
    // Validate inputs
    if (!userId || !collectionId) {
      console.error("Invalid parameters in getCollectionWords:", { userId, collectionId });
      toast({
        title: "Error",
        description: "Invalid collection parameters. Please try again.",
        variant: "destructive",
      });
      return [];
    }

    const { data: entries, error } = await supabase
      .from("collection_words")
      .select(`
        *,
        words!collection_words_word_variant_id_fkey(
          word_id,
          word_variant_id,
          word,
          part_of_speech,
          phonetics,
          audio_url,
          stems,
          definitions,
          examples
        )
      `)
      .eq("collection_id", collectionId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching collection words:", error);
      toast({
        title: "Error",
        description: "Failed to load words. Please try again later.",
        variant: "destructive",
      });
      return [];
    }

    return (entries || []).map((e: any) => ({
      id: e.id,
      wordVariantId: e.word_variant_id,
      collectionId: e.collection_id,
      status: e.status,
      lastReviewedAt: e.last_reviewed_at,
      reviewCount: e.review_count,
      nextReviewAt: e.next_review_at,
      word: e.words.word,
      phonetics: e.words.phonetics,
      part_of_speech: e.words.part_of_speech,
      audioUrl: e.words.audio_url,
      stems: e.words.stems,
      definitions: e.words.definitions,
      examples: e.words.examples,
    }));
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
  wordVariantId: string,
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
        word_variant_id: wordVariantId,
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

// Function to get or create collection with a specific name
export async function getOrCreateCollection(userId: string, name: string) {
  try {
    // Sanitize collection name to ensure it's valid for use as a key
    const sanitizedName = name.trim().toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    const collectionName = sanitizedName || 'unnamed-collection';
    
    // Use the original name as provided for display
    const displayName = name.trim();
    
    // First try to find existing collection with this name
    const { data: existingCollections, error: findError } = await supabase
      .from("collections")
      .select("*")
      .eq("user_id", userId)
      .ilike("name", displayName);  // Using ilike for case-insensitive matching

    if (findError) {
      console.error(`Error finding collection '${collectionName}':`, findError);
      throw findError;
    }

    // Check if we have a matching collection
    const existingCollection = existingCollections?.find(
      col => col.name.toLowerCase() === displayName.toLowerCase()
    );
    
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
    const { data: existingCollections, error: findError } = await supabase
      .from("collections")
      .select("*")
      .eq("user_id", userId)
      .ilike("name", "General");

    if (findError) {
      console.error("Error finding general collection:", findError);
      throw findError;
    }

    // Check if we have a matching collection
    const existingCollection = existingCollections?.find(
      col => col.name.toLowerCase() === "general"
    );
    
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
    // Transform wordDefinition format to the new schema format
    const definitions = wordData.definitions.map(d => d.meaning);
    const examples = wordData.definitions.flatMap(d => d.examples || []);
    
    // Insert word into words table
    const { data: wordRow, error: insertError } = await supabase
      .from("words")
      .insert({
        word: wordData.word,
        phonetics: wordData.pronunciation?.text || null,
        part_of_speech: wordData.partOfSpeech || null,
        audio_url: wordData.pronunciation?.audio || null,
        stems: wordData.stems || [],
        definitions: definitions,
        examples: examples,
      })
      .select()
      .single();

    let entry = wordRow;
    if (insertError) {
      if (insertError.code === "23505") {
        // Unique violation, fetch existing row
        const { data: existing, error: fetchErr } = await supabase
          .from("words")
          .select("*")
          .eq("word", wordData.word)
          .single();
        if (fetchErr) throw fetchErr;
        entry = existing;
      } else {
        throw insertError;
      }
    }

    // Link to collection with word_variant_id
    const { error: linkError } = await supabase
      .from("collection_words")
      .insert({
        collection_id: collectionId,
        word_variant_id: entry.word_variant_id,
        user_id: userId,
        status: "new",
      });
      
    if (linkError) {
      if (linkError.code === "23505") {
        // Word already exists in this collection, that's fine
        return true;
      }
      throw linkError;
    }

    return true;
  } catch (error) {
    console.error("Exception in addWordToCollection:", error);
    return false;
  }
}

// Function to remove a word-variant from a collection
export async function removeWordFromCollection(
  collectionId: string,
  wordVariantId: string,
  userId: string
) {
  try {
    // 1. Remove from collection_words
    const { error: collectionError } = await supabase
      .from("collection_words")
      .delete()
      .eq("collection_id", collectionId)
      .eq("word_variant_id", wordVariantId)
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
      .eq("word_variant_id", wordVariantId)
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
export async function getPracticeWords(
  userId: string,
  count: number = 5
): Promise<any[]> {
  try {
    const { data: collections } = await supabase
      .from("collections")
      .select("id")
      .eq("user_id", userId);
    const ids = collections?.map((c) => c.id) || [];
    if (!ids.length) return [];

    // Fetch entries by status priority
    const fetchByStatus = async (status: string, limit: number) => {
      const { data } = await supabase
        .from("collection_words")
        .select(`
          *,
          words!collection_words_word_variant_id_fkey(
            word_id,
            word_variant_id,
            word,
            part_of_speech,
            phonetics,
            audio_url,
            stems,
            definitions,
            examples
          )
        `)
        .in("collection_id", ids)
        .eq("user_id", userId)
        .eq("status", status)
        .limit(limit);
      return data || [];
    };

    let selected = await fetchByStatus("new", count);
    if (selected.length < count) {
      const more = await fetchByStatus("learning", count - selected.length);
      selected = [...selected, ...more];
    }
    if (selected.length < count) {
      const more = await fetchByStatus("mastered", count - selected.length);
      selected = [...selected, ...more];
    }

    // Shuffle
    const shuffled = selected.sort(() => Math.random() - 0.5);

    return shuffled.map((e: any) => ({
      id: e.word_variant_id, // Using word_variant_id as the identifier
      wordVariantId: e.word_variant_id,
      word: e.words.word,
      phonetics: e.words.phonetics,
      audio_url: e.words.audio_url,
      part_of_speech: e.words.part_of_speech,
      definitions: e.words.definitions,
      examples: e.words.examples || [],
      collectionId: e.collection_id,
      status: e.status,
    }));
  } catch (error) {
    console.error("Error fetching practice words:", error);
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
