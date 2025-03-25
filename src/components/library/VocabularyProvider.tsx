import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserCollections, getCollectionWords, removeWordFromCollection } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';

type Collection = {
  id: string;
  name: string;
  description: string | null;
  word_count: number;
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

  const fetchCollections = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const collections = await getUserCollections(user.id);
      setCollections(collections);
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

  // Handle removal of a word-meaning from the current collection
  const removeWordMeaning = async (wordId: string) => {
    if (!selectedCollectionId || !user) return false;
    
    const success = await removeWordFromCollection(
      selectedCollectionId,
      wordId,
      user.id
    );
    
    if (success) {
      // Update the local state to filter out all entries with this word_id
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
