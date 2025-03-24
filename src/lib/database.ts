import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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

// Function to create a new collection
export async function createCollection(userId: string, name: string, description?: string) {
  try {
    const { data, error } = await supabase
      .from("collections")
      .insert({
        user_id: userId,
        name,
        description,
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
    const { data, error } = await supabase
      .from("collection_words")
      .select(`
        *,
        words:word_id(id, word, phonetic, audio_url),
        meanings:meaning_id(id, definition, part_of_speech, examples)
      `)
      .eq("collection_id", collectionId);

    if (error) {
      console.error("Error fetching collection words:", error);
      toast({
        title: "Error",
        description: "Failed to load words. Please try again later.",
        variant: "destructive",
      });
      return [];
    }

    return data || [];
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

    toast({
      title: "Success",
      description: "Practice session completed!",
    });

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

// Function to record practice session word results
export async function recordPracticeWordResult(
  sessionId: string,
  wordId: string,
  meaningId: string,
  collectionId: string,
  isCorrect: boolean
) {
  try {
    const { error } = await supabase
      .from("practice_session_words")
      .insert({
        session_id: sessionId,
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
      .limit(10);

    if (definitionError) {
      console.error("Error searching word meanings:", definitionError);
      return [];
    }

    // Restructure the data to match the format of directMatches
    if (definitionMatches && definitionMatches.length > 0) {
      const restructured = definitionMatches.reduce((acc, meaning) => {
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
      }, [] as any[]);
      
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
