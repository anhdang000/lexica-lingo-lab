import React, { useState } from 'react';
import InputBox from '@/components/InputBox';
import VocabularyResults, { VocabularyWord } from '@/components/VocabularyResults';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { analyzeVocabulary, cn, isSingleWordOrPhrases } from '@/lib/utils';
import 'remixicon/fonts/remixicon.css';
import WordDetailModal from '@/components/WordDetailModal';
import { Trophy, Target, Brain, Sparkles, Play, Clock, Tag } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  // State for vocabulary analysis
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<VocabularyWord[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  // State for word detail modal
  const [wordDetailOpen, setWordDetailOpen] = useState(false);
  const [currentWord, setCurrentWord] = useState({ word: '', definition: '' });

  // Sample progress data
  const progressData = {
    streak: 12,
    wordsLearned: 245,
    minutesStudied: 360,
    topicsExplored: 8
  };

  const handleAnalyzeVocabulary = async (text: string) => {
    setIsAnalyzing(true);
    try {
      const results = await analyzeVocabulary(text);
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
        open={wordDetailOpen}
        onOpenChange={setWordDetailOpen}
        word={currentWord.word}
        definition={currentWord.definition}
      />
    </div>
  );
};

export default Index;