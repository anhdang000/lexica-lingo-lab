import React, { createContext, useContext, useState, ReactNode } from 'react';
import { type WordDefinition } from '@/lib/utils';

interface AppState {
  analysisResults: WordDefinition[];
  showResults: boolean;
  currentWord: WordDefinition | null;
  setAnalysisResults: (results: WordDefinition[]) => void;
  setShowResults: (show: boolean) => void;
  setCurrentWord: (word: WordDefinition | null) => void;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [analysisResults, setAnalysisResults] = useState<WordDefinition[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [currentWord, setCurrentWord] = useState<WordDefinition | null>(null);

  const value = {
    analysisResults,
    showResults,
    currentWord,
    setAnalysisResults,
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