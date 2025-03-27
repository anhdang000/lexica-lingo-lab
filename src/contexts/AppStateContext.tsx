import React, { createContext, useContext, useState, ReactNode } from 'react';
import { type WordDefinition } from '@/lib/utils';

type ToolType = 'lexigrab' | 'lexigen';

interface TabResults {
  vocabularyResults: WordDefinition[];
  topicResults: string[];
  showResults: boolean;
}

interface AppState {
  lexigrabResults: TabResults;
  lexigenResults: TabResults;
  currentWord: WordDefinition | null;
  currentTool: ToolType;
  setVocabularyResults: (results: WordDefinition[], tool: ToolType) => void;
  setTopicResults: (topics: string[], tool: ToolType) => void;
  setShowResults: (show: boolean, tool: ToolType) => void;
  setCurrentWord: (word: WordDefinition | null) => void;
  setCurrentTool: (tool: ToolType) => void;
  
  // Helper function to get current tab results
  getCurrentResults: () => TabResults;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [currentTool, setCurrentTool] = useState<ToolType>('lexigrab');
  const [currentWord, setCurrentWord] = useState<WordDefinition | null>(null);
  
  // Initialize tab-specific results
  const [lexigrabResults, setLexigrabResults] = useState<TabResults>({
    vocabularyResults: [],
    topicResults: [],
    showResults: false
  });
  
  const [lexigenResults, setLexigenResults] = useState<TabResults>({
    vocabularyResults: [],
    topicResults: [],
    showResults: false
  });

  // Function to set vocabulary results for a specific tool tab
  const setVocabularyResults = (results: WordDefinition[], tool: ToolType) => {
    if (tool === 'lexigrab') {
      setLexigrabResults(prev => ({ ...prev, vocabularyResults: results }));
    } else {
      setLexigenResults(prev => ({ ...prev, vocabularyResults: results }));
    }
  };

  // Function to set topic results for a specific tool tab
  const setTopicResults = (topics: string[], tool: ToolType) => {
    if (tool === 'lexigrab') {
      setLexigrabResults(prev => ({ ...prev, topicResults: topics }));
    } else {
      setLexigenResults(prev => ({ ...prev, topicResults: topics }));
    }
  };

  // Function to set show results for a specific tool tab
  const setShowResults = (show: boolean, tool: ToolType) => {
    if (tool === 'lexigrab') {
      setLexigrabResults(prev => ({ ...prev, showResults: show }));
    } else {
      setLexigenResults(prev => ({ ...prev, showResults: show }));
    }
  };
  
  // Helper function to get current tab results
  const getCurrentResults = (): TabResults => {
    return currentTool === 'lexigrab' ? lexigrabResults : lexigenResults;
  };

  const value = {
    lexigrabResults,
    lexigenResults,
    currentWord,
    currentTool,
    setVocabularyResults,
    setTopicResults,
    setShowResults,
    setCurrentWord,
    setCurrentTool,
    getCurrentResults
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