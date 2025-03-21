import React, { useState } from 'react';
import InputBox from '@/components/InputBox';
import VocabularyResults, { VocabularyWord } from '@/components/VocabularyResults';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import 'remixicon/fonts/remixicon.css';
import WordDetailModal from '@/components/WordDetailModal';
import { Trophy, Target, Brain, Sparkles, Play, Clock, Tag } from 'lucide-react';

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
    wordsLearned: 248,
    accuracy: 92,
    daysActive: 15
  };

  // Sample recent vocabulary
  const recentVocabulary = [
    {
      word: "Algorithm",
      definition: "A process or set of rules to be followed in calculations",
      category: "Technology",
      nextReview: "Tomorrow",
      level: "Intermediate"
    },
    {
      word: "Quantum",
      definition: "The smallest amount of energy that can exist independently",
      category: "Science",
      nextReview: "In 3 days",
      level: "Advanced"
    },
    {
      word: "Synthesis",
      definition: "The combination of components to form a connected whole",
      category: "Chemistry",
      nextReview: "In 2 days",
      level: "Advanced"
    },
    {
      word: "Paradigm",
      definition: "A typical example or pattern of something",
      category: "Academic",
      nextReview: "Today",
      level: "Intermediate"
    }
  ];

  // Function to handle vocabulary analysis
  const handleAnalyzeVocabulary = async (text: string) => {
    setIsAnalyzing(true);
    setShowResults(false);
    
    try {
      // Simulate API call with a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock response data
      const mockResponse: VocabularyWord[] = [
        {
          word: "Ubiquitous",
          phonetic: "/juːˈbɪkwɪtəs/",
          partOfSpeech: "adjective",
          definition: "Present, appearing, or found everywhere.",
          example: "His ubiquitous influence was felt in every department."
        },
        {
          word: "Paradigm",
          phonetic: "/ˈpærəˌdaɪm/",
          partOfSpeech: "noun",
          definition: "A typical example or pattern of something; a model.",
          example: "The company's business model became a paradigm for others in the industry."
        },
        {
          word: "Ephemeral",
          phonetic: "/ɪˈfɛmərəl/",
          partOfSpeech: "adjective",
          definition: "Lasting for a very short time.",
          example: "The ephemeral nature of fashion trends makes it hard to keep up."
        }
      ];
      
      setAnalysisResults(mockResponse);
      setShowResults(true);
    } catch (error) {
      console.error("Error analyzing vocabulary:", error);
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
        <p className="text-gray-600">Enter text, paste a URL, or upload an image to discover new words</p>
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
      />

      {/* Only show the progress tracker if no results are displayed */}
      {!showResults && (
        <div className="mt-12">
          {/* Progress Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <Card className="bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Current Streak</p>
                    <p className="text-2xl font-bold text-primary">{progressData.streak} days</p>
                  </div>
                  <Trophy className="h-8 w-8 text-primary/60" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-secondary/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Words Learned</p>
                    <p className="text-2xl font-bold text-secondary">{progressData.wordsLearned}</p>
                  </div>
                  <Brain className="h-8 w-8 text-secondary/60" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-tertiary/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Accuracy</p>
                    <p className="text-2xl font-bold text-tertiary">{progressData.accuracy}%</p>
                  </div>
                  <Target className="h-8 w-8 text-tertiary/60" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-quaternary/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Days Active</p>
                    <p className="text-2xl font-bold text-quaternary">{progressData.daysActive}</p>
                  </div>
                  <Sparkles className="h-8 w-8 text-quaternary/60" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Vocabulary Section - Full Width */}
          <Card className="w-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Recent Vocabulary</h3>
                <Button className="bg-primary hover:bg-primary/90">
                  <Play className="h-4 w-4 mr-2" />
                  Study Now
                </Button>
              </div>
              
              {/* Horizontal Scrollable Container */}
              <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
                {recentVocabulary.map((word, index) => (
                  <div key={index} className="flex-none w-[300px]">
                    <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-lg">{word.word}</span>
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                          {word.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {word.definition}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{word.nextReview}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          <span>{word.level}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
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