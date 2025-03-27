import React, { useState } from 'react';
import InputBox from '@/components/InputBox';
import VocabularyResults from '@/components/VocabularyResults';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { analyzeVocabulary, cn, isSingleWordOrPhrases, FileInput, analyzeText, AnalysisResults, WordDefinition, generateVocabularyFromTopic } from '@/lib/utils';
import 'remixicon/fonts/remixicon.css';
import WordDetailModal from '@/components/WordDetailModal';
import { Trophy, Target, Brain, Sparkles, Play, Clock, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { useAppState } from '@/contexts/AppStateContext';

const Index = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [topicName, setTopicName] = useState('');
  const {
    currentTool,
    setVocabularyResults,
    setTopicResults,
    setShowResults,
    setCurrentWord,
    getCurrentResults,
    currentWord
  } = useAppState();

  // Get current tab's results
  const { vocabularyResults, topicResults, showResults } = getCurrentResults();

  // Sample progress data
  const progressData = {
    streak: 12,
    wordsLearned: 245,
    minutesStudied: 360,
    topicsExplored: 8
  };

  const handleAnalyzeVocabulary = async (
    text: string, 
    files: FileInput[], 
    tool: 'lexigrab' | 'lexigen',
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
      
      if (tool === 'lexigrab') {
        // For lexigrab, use pre-analyzed results if provided
        if (analysisResults) {
          setVocabularyResults(analysisResults.vocabulary, tool);
          setTopicResults(analysisResults.topics, tool);
          setTopicName('');
        } else {
          // If no pre-analyzed results, analyze the text/files now
          const results = await analyzeVocabulary(text, files);
          setVocabularyResults(results.vocabulary, tool);
          setTopicResults(results.topics, tool);
          setTopicName('');
        }
      } else {
        // For lexigen, generate vocabulary based on the topic
        const results = await generateVocabularyFromTopic(text);
        setVocabularyResults(results.vocabulary, tool);
        setTopicResults(results.topics, tool);
        setTopicName(results.topicName || 'Vocabulary Collection');
      }
      
      setShowResults(true, tool);
    } catch (error) {
      console.error("Error analyzing vocabulary:", error);
      toast.error("Failed to analyze vocabulary. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCloseResults = () => {
    setShowResults(false, currentTool);
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

      {/* Analysis Results - Only show for the current tool */}
      <VocabularyResults 
        results={vocabularyResults}
        topics={topicResults}
        isVisible={showResults}
        onClose={handleCloseResults}
        isSingleWordOrPhrases={vocabularyResults.length > 0 && isSingleWordOrPhrases(vocabularyResults[0].word)}
        tool={currentTool}
        topicName={topicName}
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