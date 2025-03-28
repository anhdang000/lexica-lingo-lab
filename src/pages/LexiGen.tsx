import React, { useState, useEffect } from 'react';
import LexiGenInputBox from '@/components/lexigen/LexiGenInputBox';
import LexiGenResults from '@/components/lexigen/LexiGenResults';
import { useAppState } from '@/contexts/AppStateContext';
import { isSingleWordOrPhrases, generateVocabularyFromTopic } from '@/lib/utils';
import WordDetailModal from '@/components/WordDetailModal';

const LexiGen = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [topicName, setTopicName] = useState<string>('');
  const {
    setVocabularyResults,
    setTopicResults,
    setShowResults,
    setCurrentWord,
    setCurrentTool,
    lexigenResults,
    currentWord
  } = useAppState();

  // Set current tool to lexigen when component mounts
  useEffect(() => {
    setCurrentTool('lexigen');
  }, [setCurrentTool]);

  // Use lexigenResults directly instead of getCurrentResults
  const { vocabularyResults, topicResults, showResults } = lexigenResults;

  const handleGenerateVocabulary = async (text: string) => {
    setIsAnalyzing(true);
    
    // Force a repaint to ensure the loading state is immediately visible
    await new Promise(resolve => requestAnimationFrame(() => {
      resolve(null);
    }));
    
    try {
      // Simulate a small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 100)); 
      
      // Generate vocabulary based on the topic
      const results = await generateVocabularyFromTopic(text);
      setVocabularyResults(results.vocabulary, 'lexigen');
      setTopicResults(results.topics, 'lexigen');
      setTopicName(results.topicName || text);
      
      setShowResults(true, 'lexigen');
    } catch (error) {
      console.error("Error generating vocabulary:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCloseResults = () => {
    setShowResults(false, 'lexigen');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">
          <span className="font-bold">Lexi</span><span className="font-['Pacifico'] text-[#6366f1]">Gen</span>
        </h2>
        <p className="text-gray-600">Generate vocabulary lists from any topic to expand your lexicon.</p>
      </div>

      {/* Input Box */}
      <LexiGenInputBox 
        onAnalyze={handleGenerateVocabulary}
        isAnalyzing={isAnalyzing}
      />

      {/* Results */}
      <LexiGenResults 
        results={vocabularyResults}
        topics={topicResults}
        isVisible={showResults}
        onClose={handleCloseResults}
        isSingleWordOrPhrases={vocabularyResults.length > 0 && isSingleWordOrPhrases(vocabularyResults[0].word)}
        topicName={topicName}
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

export default LexiGen;