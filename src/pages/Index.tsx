import React, { useState } from 'react';
import InputBox from '@/components/InputBox';
import VocabularyResults from '@/components/VocabularyResults';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { analyzeVocabulary, cn, isSingleWordOrPhrases, FileInput, analyzeText } from '@/lib/utils';
import 'remixicon/fonts/remixicon.css';
import WordDetailModal from '@/components/WordDetailModal';
import { Trophy, Target, Brain, Sparkles, Play, Clock, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { useAppState } from '@/contexts/AppStateContext';

const Index = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const {
    analysisResults,
    showResults,
    currentWord,
    setAnalysisResults,
    setShowResults,
    setCurrentWord
  } = useAppState();

  // Sample progress data
  const progressData = {
    streak: 12,
    wordsLearned: 245,
    minutesStudied: 360,
    topicsExplored: 8
  };

  const handleAnalyzeVocabulary = async (text: string, files: FileInput[], tool: 'lexigrab' | 'lexigen') => {
    setIsAnalyzing(true);
    try {
      let results;
      if (tool === 'lexigrab') {
        // For lexigrab, analyze the vocabulary from text and/or files
        if (files.length > 0) {
          // If we have files, use analyzeText directly with both text and files
          results = await analyzeText(text, files);
        } else {
          // If we only have text, use analyzeVocabulary which may try lookupWord for short phrases
          results = await analyzeVocabulary(text);
        }
      } else {
        // For lexigen, generate vocabulary based on the topic
        results = await analyzeVocabulary(text);
      }
      
      setAnalysisResults(results);
      setShowResults(true);
    } catch (error) {
      console.error("Error analyzing vocabulary:", error);
      toast.error("Failed to analyze vocabulary. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">
          Expand your <span className="font-['Pacifico'] text-primary">lexicon</span> with AI
        </h2>
        <p className="text-gray-600">Enter text, paste a URL, or upload an image to discover new words.</p>
      </div>

      {/* Input Box */}
      <InputBox 
        onAnalyze={handleAnalyzeVocabulary}
        isAnalyzing={isAnalyzing}
      />

      {/* Analysis Results */}
      <VocabularyResults 
        results={analysisResults}
        isVisible={showResults}
        onClose={() => setShowResults(false)}
        isSingleWordOrPhrases={analysisResults.length > 0 && isSingleWordOrPhrases(analysisResults[0].word)}
      />

      {/* Progress Dashboard */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ...existing progress dashboard code... */}
      </div>

      {/* Word Detail Modal */}
      <WordDetailModal
        open={currentWord !== null}
        onOpenChange={(open) => !open && setCurrentWord(null)}
        wordDetails={currentWord}
      />
    </div>
  );
};

export default Index;