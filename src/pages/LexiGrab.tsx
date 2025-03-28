import React, { useState, useEffect } from 'react';
import LexiGrabInputBox from '@/components/lexigrab/LexiGrabInputBox';
import LexiGrabResults from '@/components/lexigrab/LexiGrabResults';
import { useAppState } from '@/contexts/AppStateContext';
import { isSingleWordOrPhrases, FileInput, AnalysisResults } from '@/lib/utils';
import WordDetailModal from '@/components/WordDetailModal';
import { Card, CardContent } from '@/components/ui/card';

const LexiGrab = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const {
    setVocabularyResults,
    setTopicResults,
    setShowResults,
    setCurrentWord,
    setCurrentTool,
    lexigrabResults,
    currentWord
  } = useAppState();

  // Set current tool to lexigrab when component mounts
  useEffect(() => {
    setCurrentTool('lexigrab');
  }, [setCurrentTool]);

  // Use lexigrabResults directly instead of getCurrentResults
  const { vocabularyResults, topicResults, showResults } = lexigrabResults;

  const handleAnalyzeVocabulary = async (
    text: string, 
    files: FileInput[],
    analysisResults?: AnalysisResults
  ) => {
    setIsAnalyzing(true);
    
    // Force a repaint to ensure the loading state is immediately visible
    await new Promise(resolve => requestAnimationFrame(() => {
      resolve(null);
    }));
    
    try {
      // Simulate a small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 100)); 
      
      // For lexigrab, use pre-analyzed results if provided
      if (analysisResults) {
        setVocabularyResults(analysisResults.vocabulary, 'lexigrab');
        setTopicResults(analysisResults.topics, 'lexigrab');
      }
      
      setShowResults(true, 'lexigrab');
    } catch (error) {
      console.error("Error analyzing vocabulary:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCloseResults = () => {
    setShowResults(false, 'lexigrab');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">
          <span className="font-bold">Lexi</span><span className="font-['Pacifico'] text-[#cd4631]">Grab</span>
        </h2>
        <p className="text-gray-600">Easily extract and save vocabulary from any text, website, or document.</p>
      </div>

      {/* Input Box */}
      <LexiGrabInputBox 
        onAnalyze={handleAnalyzeVocabulary}
        isAnalyzing={isAnalyzing}
      />

      {/* Analysis Results */}
      <LexiGrabResults 
        results={vocabularyResults}
        topics={topicResults}
        isVisible={showResults}
        onClose={handleCloseResults}
        isSingleWordOrPhrases={vocabularyResults.length > 0 && isSingleWordOrPhrases(vocabularyResults[0].word)}
      />

      {/* Word Detail Modal */}
      <WordDetailModal
        open={currentWord !== null}
        onOpenChange={(open) => !open && setCurrentWord(null)}
        wordDetails={currentWord}
      />
    </div>
  );
};

export default LexiGrab;