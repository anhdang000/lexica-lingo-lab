import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserCollections, getCollectionWords, removeWordFromCollection, getCollectionPracticeStats } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';

type Collection = {
  id: string;
  name: string;
  description: string | null;
  word_count: number;
  reviewed_word_count: number; // Added field from new schema
  created_at: string;
  updated_at: string;
};

type VocabularyProviderProps = {
  children: React.ReactNode;
};

type VocabularyContextType = {
  collections: Collection[];
  isLoading: boolean;
  error: string | null;
  refreshCollections: () => Promise<void>;
  selectedCollectionId: string | null;
  setSelectedCollectionId: (id: string | null) => void;
  collectionWords: any[];
  isLoadingWords: boolean;
  removeWordMeaning: (wordId: string) => Promise<boolean>;
  collectionPracticeStats: Map<string, { totalWords: number; practicedWords: number; percentage: number; }>;
};

const VocabularyContext = createContext<VocabularyContextType | undefined>(undefined);

export const VocabularyProvider: React.FC<VocabularyProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [collectionWords, setCollectionWords] = useState<any[]>([]);
  const [isLoadingWords, setIsLoadingWords] = useState(false);
  const [collectionPracticeStats, setCollectionPracticeStats] = useState<Map<string, { 
    totalWords: number; 
    practicedWords: number; 
    percentage: number; 
  }>>(new Map());

  const fetchCollections = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const collections = await getUserCollections(user.id);
      setCollections(collections);
      
      // Create practice stats from collection data directly
      const statsMap = new Map();
      for (const collection of collections) {
        // Either use the getCollectionPracticeStats function or calculate directly
        // Option 1: Using the updated helper function
        const stats = await getCollectionPracticeStats(user.id, collection.id);
        statsMap.set(collection.id, stats);
        
        // Option 2: Calculate directly from collection fields (alternative)
        /*
        const totalWords = collection.word_count || 0;
        const practicedWords = collection.reviewed_word_count || 0;
        const percentage = totalWords > 0 ? (practicedWords / totalWords) * 100 : 0;
        
        statsMap.set(collection.id, {
          totalWords,
          practicedWords,
          percentage
        });
        */
      }
      setCollectionPracticeStats(statsMap);
      
    } catch (err) {
      setError('Failed to load collections');
      console.error('Error fetching collections:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCollectionWords = async (collectionId: string) => {
    if (!collectionId) {
      setCollectionWords([]);
      return;
    }
    
    setIsLoadingWords(true);
    
    try {
      const words = await getCollectionWords(collectionId);
      setCollectionWords(words);
    } catch (err) {
      console.error('Error fetching collection words:', err);
    } finally {
      setIsLoadingWords(false);
    }
  };

  const removeWordMeaning = async (wordId: string) => {
    if (!selectedCollectionId || !user) return false;
    
    const success = await removeWordFromCollection(
      selectedCollectionId,
      wordId,
      user.id
    );
    
    if (success) {
      setCollectionWords(prevWords => 
        prevWords.filter(word => word.word_id !== wordId)
      );
    }
    
    return success;
  };

  useEffect(() => {
    if (user) {
      fetchCollections();
    } else {
      setCollections([]);
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (selectedCollectionId) {
      fetchCollectionWords(selectedCollectionId);
    } else {
      setCollectionWords([]);
    }
  }, [selectedCollectionId]);

  const value = {
    collections,
    isLoading,
    error,
    refreshCollections: fetchCollections,
    selectedCollectionId,
    setSelectedCollectionId,
    collectionWords,
    isLoadingWords,
    removeWordMeaning,
    collectionPracticeStats,
  };

  return (
    <VocabularyContext.Provider value={value}>
      {children}
    </VocabularyContext.Provider>
  );
};

export const useVocabulary = () => {
  const context = useContext(VocabularyContext);
  if (context === undefined) {
    throw new Error('useVocabulary must be used within a VocabularyProvider');
  }
  return context;
};
