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
    // Get all meaning_ids in the collection
    const { data: collectionWords, error: totalError } = await supabase
      .from("collection_words")
      .select("meaning_id")
      .eq("collection_id", collectionId)
      .eq("user_id", userId);

    if (totalError) {
      console.error("Error fetching collection words:", totalError);
      return { totalWords: 0, practicedWords: 0, percentage: 0 };
    }
    
    // Count distinct meaning_ids for total words
    const distinctMeaningIds = new Set(collectionWords?.map(item => item.meaning_id) || []);
    const totalWords = distinctMeaningIds.size;
    
    if (totalWords === 0) {
      return { totalWords: 0, practicedWords: 0, percentage: 0 };
    }

    // Get all practice session words for this collection
    const { data: practicedWordsData, error: practicedError } = await supabase
      .from("practice_session_words")
      .select("meaning_id")
      .eq("collection_id", collectionId)
      .eq("user_id", userId);

    if (practicedError) {
      console.error("Error fetching practiced words:", practicedError);
      return { totalWords, practicedWords: 0, percentage: 0 };
    }
    
    // Count distinct practiced meaning_ids
    const distinctPracticedMeaningIds = new Set(practicedWordsData?.map(item => item.meaning_id) || []);
    const practicedWords = distinctPracticedMeaningIds.size;

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
    const { data: entries, error } = await supabase
      .from("collection_words")
      .select(`
        *,
        word_info:words!collection_words_meaning_id_fkey(
          word_id,
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
      wordId: e.word_id,
      meaningId: e.meaning_id,
      collectionId: e.collection_id,
      status: e.status,
      lastReviewedAt: e.last_reviewed_at,
      reviewCount: e.review_count,
      nextReviewAt: e.next_review_at,
      word: e.word_info.word,
      phonetic: e.word_info.phonetics,
      audioUrl: e.word_info.audio_url,
      stems: e.word_info.stems,
      definitions: e.word_info.definitions,
      examples: e.word_info.examples,
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
    // Insert or get word+meaning row
    const { data: wordRow, error: insertError } = await supabase
      .from("words")
      .insert({
        word: wordData.word,
        phonetics: wordData.pronunciation?.text || null,
        audio_url: wordData.pronunciation?.audio || null,
        stems: wordData.stems || [],
        definitions: wordData.definitions.map((d) => d.meaning),
        examples: wordData.definitions.flatMap((d) => d.examples || []),
      })
      .select()
      .single();

    let entry = wordRow;
    if (insertError && insertError.code === "23505") {
      // unique violation, fetch existing row
      const { data: existing, error: fetchErr } = await supabase
        .from("words")
        .select("*")
        .eq("word", wordData.word)
        .single();
      if (fetchErr) throw fetchErr;
      entry = existing;
    } else if (insertError) {
      throw insertError;
    }

    // Link to collection
    await supabase.from("collection_words").insert({
      collection_id: collectionId,
      meaning_id: entry.meaning_id,
      user_id: userId,
      status: "new",
    });

    return true;
  } catch (error) {
    console.error("Exception in addWordToCollection:", error);
    return false;
  }
}

// Function to remove a word-meaning from a collection
export async function removeWordFromCollection(
  collectionId: string,
  meaningId: string,
  userId: string
) {
  try {
    // 1. Remove from collection_words
    const { error: collectionError } = await supabase
      .from("collection_words")
      .delete()
      .eq("collection_id", collectionId)
      .eq("meaning_id", meaningId)
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
      .eq("meaning_id", meaningId)
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
          word_info:words!collection_words_meaning_id_fkey(
            word_id,
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
      id: e.meaning_id, // Using meaning_id instead of word_id as the identifier
      meaningId: e.meaning_id,
      word: e.word_info.word,
      phonetic: { text: e.word_info.phonetics || "", audio: e.word_info.audio_url || "" },
      partOfSpeech: e.word_info.part_of_speech,
      definitions: e.word_info.definitions,
      example: e.word_info.examples?.[0] || "",
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
