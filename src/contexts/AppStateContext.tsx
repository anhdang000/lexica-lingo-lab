import React, { createContext, useContext, useState, ReactNode } from 'react';
import { type WordDefinition } from '@/lib/utils';

type ToolType = 'lexigrab' | 'lexigen';

interface ActiveFile {
  id: string;
  preview: string;
  file: File;
  fileType: 'image' | 'document';
  fileExtension?: string;
  isUploading: boolean;
  uploadError?: string;
}

interface TabResults {
  vocabularyResults: WordDefinition[];
  topicResults: string[];
  showResults: boolean;
  topicName?: string;
}

interface AppState {
  lexigrabResults: TabResults;
  lexigenResults: TabResults;
  currentWord: WordDefinition | null;
  currentTool: ToolType;
  setVocabularyResults: (results: WordDefinition[], tool: ToolType) => void;
  setTopicResults: (topics: string[], tool: ToolType) => void;
  setShowResults: (show: boolean, tool: ToolType, topicName?: string) => void;
  setCurrentWord: (word: WordDefinition | null) => void;
  setCurrentTool: (tool: ToolType) => void;

  lexigrabInputValue: string;
  lexigrabActiveFiles: ActiveFile[];
  lexigrabRecognizedUrls: string[];
  lexigrabSummaryContent: string;
  setLexigrabInputValue: (value: string) => void;
  setLexigrabActiveFiles: (files: ActiveFile[] | ((prevFiles: ActiveFile[]) => ActiveFile[])) => void;
  setLexigrabRecognizedUrls: (urls: string[]) => void;
  setLexigrabSummaryContent: (content: string) => void;

  lexigenInputValue: string;
  setLexigenInputValue: (value: string) => void;

  showTuningOptions: boolean;
  setShowTuningOptions: (show: boolean) => void;

  getCurrentResults: () => TabResults;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [currentTool, setCurrentTool] = useState<ToolType>('lexigrab');
  const [currentWord, setCurrentWord] = useState<WordDefinition | null>(null);

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

  const [lexigrabInputValue, setLexigrabInputValue] = useState('');
  const [lexigrabActiveFiles, setLexigrabActiveFiles] = useState<ActiveFile[]>([]);
  const [lexigrabRecognizedUrls, setLexigrabRecognizedUrls] = useState<string[]>([]);
  const [lexigrabSummaryContent, setLexigrabSummaryContent] = useState<string>("");
  const [lexigenInputValue, setLexigenInputValue] = useState('');
  const [showTuningOptions, setShowTuningOptions] = useState(false);

  const setVocabularyResults = (results: WordDefinition[], tool: ToolType) => {
    if (tool === 'lexigrab') {
      setLexigrabResults(prev => ({ ...prev, vocabularyResults: results }));
    } else {
      setLexigenResults(prev => ({ ...prev, vocabularyResults: results }));
    }
  };

  const setTopicResults = (topics: string[], tool: ToolType) => {
    if (tool === 'lexigrab') {
      setLexigrabResults(prev => ({ ...prev, topicResults: topics }));
    } else {
      setLexigenResults(prev => ({ ...prev, topicResults: topics }));
    }
  };

  const setShowResults = (show: boolean, tool: ToolType, topicName?: string) => {
    if (tool === 'lexigrab') {
      setLexigrabResults(prev => ({ ...prev, showResults: show, topicName }));
    } else {
      setLexigenResults(prev => ({ ...prev, showResults: show, topicName }));
    }
  };

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
    getCurrentResults,
    lexigrabInputValue,
    lexigrabActiveFiles,
    lexigrabRecognizedUrls,
    lexigrabSummaryContent,
    setLexigrabInputValue,
    setLexigrabActiveFiles,
    setLexigrabRecognizedUrls,
    setLexigrabSummaryContent,
    lexigenInputValue,
    setLexigenInputValue,
    showTuningOptions,
    setShowTuningOptions,
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