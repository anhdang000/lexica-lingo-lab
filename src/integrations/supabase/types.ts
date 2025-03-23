export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          accuracy: number | null
          created_at: string | null
          id: string
          last_practice_at: string | null
          streak_count: number | null
          updated_at: string | null
          username: string | null
          words_learned: number | null
        }
        Insert: {
          accuracy?: number | null
          created_at?: string | null
          id: string
          last_practice_at?: string | null
          streak_count?: number | null
          updated_at?: string | null
          username?: string | null
          words_learned?: number | null
        }
        Update: {
          accuracy?: number | null
          created_at?: string | null
          id?: string
          last_practice_at?: string | null
          streak_count?: number | null
          updated_at?: string | null
          username?: string | null
          words_learned?: number | null
        }
        Relationships: []
      }
      words: {
        Row: {
          id: string
          word: string
          phonetic: string | null
          audio_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          word: string
          phonetic?: string | null
          audio_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          word?: string
          phonetic?: string | null
          audio_url?: string | null
          created_at?: string
        }
      }
      word_meanings: {
        Row: {
          id: string
          word_id: string
          ordinal_index: number
          part_of_speech: string | null
          definition: string
          created_at: string
        }
        Insert: {
          id?: string
          word_id: string
          ordinal_index: number
          part_of_speech?: string | null
          definition: string
          created_at?: string
        }
        Update: {
          id?: string
          word_id?: string
          ordinal_index?: number
          part_of_speech?: string | null
          definition?: string
          created_at?: string
        }
      }
      meaning_examples: {
        Row: {
          id: string
          meaning_id: string
          example: string
          created_at: string
        }
        Insert: {
          id?: string
          meaning_id: string
          example: string
          created_at?: string
        }
        Update: {
          id?: string
          meaning_id?: string
          example?: string
          created_at?: string
        }
      }
      collection_words: {
        Row: {
          id: string
          collection_id: string
          word_id: string
          meaning_id: string
          user_id: string
          status: 'new' | 'learning' | 'mastered'
          last_reviewed_at: string | null
          review_count: number
          next_review_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          collection_id: string
          word_id: string
          meaning_id: string
          user_id: string
          status?: 'new' | 'learning' | 'mastered'
          last_reviewed_at?: string | null
          review_count?: number
          next_review_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          collection_id?: string
          word_id?: string
          meaning_id?: string
          user_id?: string
          status?: 'new' | 'learning' | 'mastered'
          last_reviewed_at?: string | null
          review_count?: number
          next_review_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      practice_sessions: {
        Row: {
          id: string
          user_id: string
          mode: 'flashcard' | 'quiz' | 'findword'
          total_words: number
          correct_answers: number
          completed: boolean
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          mode: 'flashcard' | 'quiz' | 'findword'
          total_words: number
          correct_answers: number
          completed?: boolean
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          mode?: 'flashcard' | 'quiz' | 'findword'
          total_words?: number
          correct_answers?: number
          completed?: boolean
          created_at?: string
          completed_at?: string | null
        }
      }
      practice_session_words: {
        Row: {
          id: string
          session_id: string
          word_id: string
          meaning_id: string
          collection_id: string
          is_correct: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          word_id: string
          meaning_id: string
          collection_id: string
          is_correct?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          word_id?: string
          meaning_id?: string
          collection_id?: string
          is_correct?: boolean | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
