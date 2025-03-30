export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      collections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          word_count: number;
          reviewed_word_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          word_count?: number;
          reviewed_word_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          word_count?: number;
          reviewed_word_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          username: string | null;
          avatar_url: string | null;
          streak_count: number;
          last_practice_at: string | null;
          words_learned: number;
          accuracy: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          avatar_url?: string | null;
          streak_count?: number;
          last_practice_at?: string | null;
          words_learned?: number;
          accuracy?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          avatar_url?: string | null;
          streak_count?: number;
          last_practice_at?: string | null;
          words_learned?: number;
          accuracy?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      words: {
        Row: {
          id: string;
          word: string;
          phonetic: string | null;
          audio_url: string | null;
          stems: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          word: string;
          phonetic?: string | null;
          audio_url?: string | null;
          stems?: string[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          word?: string;
          phonetic?: string | null;
          audio_url?: string | null;
          stems?: string[] | null;
          created_at?: string;
        };
      };
      word_meanings: {
        Row: {
          id: string;
          word_id: string;
          ordinal_index: number;
          part_of_speech: string | null;
          definition: string;
          examples: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          word_id: string;
          ordinal_index: number;
          part_of_speech?: string | null;
          definition: string;
          examples?: string[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          word_id?: string;
          ordinal_index?: number;
          part_of_speech?: string | null;
          definition?: string;
          examples?: string[] | null;
          created_at?: string;
        };
      };
      collection_words: {
        Row: {
          id: string;
          collection_id: string;
          word_id: string;
          meaning_id: string;
          user_id: string;
          status: string;
          last_reviewed_at: string | null;
          review_count: number;
          next_review_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          collection_id: string;
          word_id: string;
          meaning_id: string;
          user_id: string;
          status?: string;
          last_reviewed_at?: string | null;
          review_count?: number;
          next_review_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          collection_id?: string;
          word_id?: string;
          meaning_id?: string;
          user_id?: string;
          status?: string;
          last_reviewed_at?: string | null;
          review_count?: number;
          next_review_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      practice_sessions: {
        Row: {
          id: string;
          user_id: string;
          mode: string;
          total_words: number;
          correct_answers: number;
          completed: boolean;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          mode: string;
          total_words: number;
          correct_answers: number;
          completed?: boolean;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          mode?: string;
          total_words?: number;
          correct_answers?: number;
          completed?: boolean;
          created_at?: string;
          completed_at?: string | null;
        };
      };
      practice_session_words: {
        Row: {
          id: string;
          session_id: string;
          user_id: string;
          word_id: string;
          meaning_id: string;
          collection_id: string;
          is_correct: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id: string;
          word_id: string;
          meaning_id: string;
          collection_id: string;
          is_correct: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          user_id?: string;
          word_id?: string;
          meaning_id?: string;
          collection_id?: string;
          is_correct?: boolean;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
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
