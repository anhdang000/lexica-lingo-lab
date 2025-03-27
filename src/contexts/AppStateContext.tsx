import React, { createContext, useContext, useState, ReactNode } from 'react';
import { type WordDefinition } from '@/lib/utils';

interface AppState {
  vocabularyResults: WordDefinition[];
  topicResults: string[];
  showResults: boolean;
  currentWord: WordDefinition | null;
  setVocabularyResults: (results: WordDefinition[]) => void;
  setTopicResults: (topics: string[]) => void;
  setShowResults: (show: boolean) => void;
  setCurrentWord: (word: WordDefinition | null) => void;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [vocabularyResults, setVocabularyResults] = useState<WordDefinition[]>([]);
  const [topicResults, setTopicResults] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [currentWord, setCurrentWord] = useState<WordDefinition | null>(null);

  const value = {
    vocabularyResults,
    topicResults,
    showResults,
    currentWord,
    setVocabularyResults,
    setTopicResults,
    setShowResults,
    setCurrentWord,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}