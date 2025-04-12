import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  removeWordMeaning: (wordVariantId: string) => Promise<boolean>;
  collectionPracticeStats: Map<string, { totalWords: number; practicedWords: number; percentage: number; }>;
};

const VocabularyContext = createContext<VocabularyContextType | undefined>(undefined);

export const VocabularyProvider: React.FC<VocabularyProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>(() => {
    if (typeof window === 'undefined') return [];
    const savedCollections = localStorage.getItem('userCollections');
    if (savedCollections) {
      try {
        return JSON.parse(savedCollections);
      } catch (e) {
        console.error('Failed to parse collections from localStorage', e);
        return [];
      }
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('selectedCollectionId');
  });

  const [collectionWords, setCollectionWords] = useState<any[]>(() => {
    if (typeof window === 'undefined') return [];
    const savedWords = localStorage.getItem('collectionWords');
    if (savedWords && selectedCollectionId) {
      try {
        return JSON.parse(savedWords);
      } catch (e) {
        console.error('Failed to parse collection words from localStorage', e);
        return [];
      }
    }
    return [];
  });

  const [isLoadingWords, setIsLoadingWords] = useState(false);

  const [collectionPracticeStats, setCollectionPracticeStats] = useState<Map<string, { 
    totalWords: number; 
    practicedWords: number; 
    percentage: number; 
  }>>(() => {
    if (typeof window === 'undefined') return new Map();
    const savedStats = localStorage.getItem('collectionPracticeStats');
    if (savedStats) {
      try {
        return new Map(JSON.parse(savedStats));
      } catch (e) {
        console.error('Failed to parse collection stats from localStorage', e);
        return new Map();
      }
    }
    return new Map();
  });

  const collectionsLoadedRef = useRef(false);
  const initialLoadComplete = useRef(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && !collectionsLoadedRef.current) {
        fetchCollections();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);

  const fetchCollections = async () => {
    if (!user) return;

    if (collections.length > 0 && initialLoadComplete.current) {
      collectionsLoadedRef.current = true;
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const collections = await getUserCollections(user.id);
      setCollections(collections);

      if (typeof window !== 'undefined') {
        localStorage.setItem('userCollections', JSON.stringify(collections));
      }

      const statsMap = new Map();
      for (const collection of collections) {
        const stats = await getCollectionPracticeStats(user.id, collection.id);
        statsMap.set(collection.id, stats);
      }
      setCollectionPracticeStats(statsMap);

      if (typeof window !== 'undefined') {
        localStorage.setItem('collectionPracticeStats', JSON.stringify(Array.from(statsMap.entries())));
      }

      collectionsLoadedRef.current = true;
    } catch (err) {
      setError('Failed to load collections');
      console.error('Error fetching collections:', err);
    } finally {
      setIsLoading(false);
      initialLoadComplete.current = true;
    }
  };

  const fetchCollectionWords = async (collectionId: string) => {
    if (!collectionId || !user) {
      setCollectionWords([]);
      return;
    }

    if (typeof window !== 'undefined' && selectedCollectionId === collectionId) {
      const savedWords = localStorage.getItem(`collectionWords_${collectionId}`);
      if (savedWords) {
        try {
          const parsedWords = JSON.parse(savedWords);
          setCollectionWords(parsedWords);
          if (initialLoadComplete.current) {
            return;
          }
        } catch (e) {
          console.error('Failed to parse collection words from localStorage', e);
        }
      }
    }

    setIsLoadingWords(true);

    try {
      const words = await getCollectionWords(user.id, collectionId);
      setCollectionWords(words);

      if (typeof window !== 'undefined') {
        localStorage.setItem(`collectionWords_${collectionId}`, JSON.stringify(words));
      }
    } catch (err) {
      console.error('Error fetching collection words:', err);
    } finally {
      setIsLoadingWords(false);
    }
  };

  const removeWordMeaning = async (wordVariantId: string) => {
    if (!selectedCollectionId || !user) return false;

    const success = await removeWordFromCollection(
      selectedCollectionId,
      wordVariantId,
      user.id
    );

    if (success) {
      setCollectionWords(prevWords => {
        const newWords = prevWords.filter(word => word.wordVariantId !== wordVariantId);
        if (typeof window !== 'undefined' && selectedCollectionId) {
          localStorage.setItem(`collectionWords_${selectedCollectionId}`, JSON.stringify(newWords));
        }
        return newWords;
      });
    }

    return success;
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && selectedCollectionId) {
      localStorage.setItem('selectedCollectionId', selectedCollectionId);
    }
  }, [selectedCollectionId]);

  useEffect(() => {
    if (user && !collectionsLoadedRef.current) {
      fetchCollections();
    } else if (!user) {
      setCollections([]);
      setIsLoading(false);
      collectionsLoadedRef.current = false;
      initialLoadComplete.current = false;
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
