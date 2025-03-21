import React, { useState } from 'react';
import InputBox from '@/components/InputBox';
import VocabularyResults, { VocabularyWord } from '@/components/VocabularyResults';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import 'remixicon/fonts/remixicon.css';
import { Link } from 'react-router-dom';
import WordDetailModal from '@/components/WordDetailModal';

const Index = () => {
  // State for vocabulary analysis
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<VocabularyWord[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  // State for word detail modal
  const [wordDetailOpen, setWordDetailOpen] = useState(false);
  const [currentWord, setCurrentWord] = useState({ word: '', definition: '' });

  // Sample data for Word of the Day
  const wordOfDayData = {
    word: "Serendipity",
    pronunciation: "/ˌserənˈdipəti/",
    partOfSpeech: "noun",
    definition: "The occurrence and development of events by chance in a happy or beneficial way.",
    example: "The scientists made the discovery by serendipity when they were looking for something else entirely.",
    category: "Literature"
  };

  // Sample data for Study Progress
  const progressData = {
    wordsLearned: 248,
    completion: 85
  };

  // Sample recent activity
  const recentActivity = [
    {
      id: 1,
      icon: 'add',
      message: 'Added 12 new words',
      timestamp: '2 hours ago'
    },
    {
      id: 2,
      icon: 'check',
      message: 'Completed daily review',
      timestamp: '5 hours ago'
    }
  ];

  // Sample vocabulary words
  const vocabularyWords = [
    {
      id: 1,
      word: 'Paradigm',
      phonetic: '/ˈpærəˌdaɪm/',
      partOfSpeech: 'noun',
      definition: 'A typical example or pattern of something',
      category: 'Business',
      reviewDate: 'Today',
      level: 'Advanced'
    },
    {
      id: 2,
      word: 'Algorithm',
      phonetic: '/ˈælɡəˌrɪðəm/',
      partOfSpeech: 'noun',
      definition: 'A process or set of rules to be followed in calculations',
      category: 'Technology',
      reviewDate: 'Tomorrow',
      level: 'Intermediate'
    },
    {
      id: 3,
      word: 'Quantum',
      phonetic: '/ˈkwɑːntəm/',
      partOfSpeech: 'noun',
      definition: 'The smallest amount of energy that can exist independently',
      category: 'Science',
      reviewDate: 'In 3 days',
      level: 'Advanced'
    }
  ];

  // Functions for color selection
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Business':
        return 'bg-quaternary/20 text-tertiary';
      case 'Technology':
        return 'bg-secondary/20 text-secondary';
      case 'Science':
        return 'bg-primary/20 text-primary';
      case 'Literature':
        return 'bg-quaternary/20 text-tertiary';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Advanced':
        return 'text-primary';
      case 'Intermediate':
        return 'text-secondary';
      case 'Beginner':
        return 'text-tertiary';
      default:
        return 'text-gray-600';
    }
  };

  // Function to handle vocabulary analysis
  const handleAnalyzeVocabulary = async (text: string) => {
    setIsAnalyzing(true);
    setShowResults(false);
    
    try {
      // Simulate API call with a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock response data (this would be replaced with an actual API call)
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
        },
        {
          word: "Pragmatic",
          phonetic: "/præɡˈmætɪk/",
          partOfSpeech: "adjective",
          definition: "Dealing with things sensibly and realistically in a way that is based on practical considerations.",
          example: "We need a pragmatic approach to solving this problem."
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

  // Function to show word details in modal
  const showWordDetails = (word: string, definition: string) => {
    setCurrentWord({ word, definition });
    setWordDetailOpen(true);
  };

  // Function to close analysis results
  const handleCloseResults = () => {
    setShowResults(false);
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
        onClose={handleCloseResults}
      />

      {/* Only show the rest of the UI if no results are displayed */}
      {!showResults && (
        <>
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12 mt-12">
            {/* Word of the Day */}
            <div className="md:col-span-7 bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Word of the Day</h3>
              <div className="word-card">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-2xl font-bold">{wordOfDayData.word}</p>
                  <span className="text-gray-400 italic">{wordOfDayData.pronunciation}</span>
                  <span className="text-primary text-sm">{wordOfDayData.partOfSpeech}</span>
                </div>
                <p className="text-gray-600 mb-3">{wordOfDayData.definition}</p>
                <div className="bg-gray-50 p-3 rounded-lg mb-3 italic text-gray-600 text-sm">
                  "{wordOfDayData.example}"
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 ${getCategoryColor(wordOfDayData.category)} rounded-full text-sm`}>
                      {wordOfDayData.category}
                    </span>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-primary">
                      <i className="ri-volume-up-line"></i>
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded-full">
                      <i className="ri-bookmark-line"></i>
                      Save
                    </Button>
                    <Button variant="ghost" className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded-full">
                      <i className="ri-more-line"></i>
                      More
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Column */}
            <div className="md:col-span-5 grid grid-rows-2 gap-6">
              {/* Study Progress */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Study Progress</h3>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-3xl font-bold">{progressData.wordsLearned}</p>
                    <p className="text-gray-500">Words Learned</p>
                  </div>
                  <div className="w-16 h-16 rounded-full border-4 border-primary flex items-center justify-center">
                    <span className="text-lg font-bold">{progressData.completion}%</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full py-2 text-primary font-medium border border-primary rounded-button hover:bg-primary/5"
                >
                  View Details
                </Button>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {recentActivity.map(activity => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.icon === 'add' ? 'bg-secondary/20 text-secondary' : 'bg-primary/20 text-primary'
                      }`}>
                        <i className={`ri-${activity.icon}-line`}></i>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{activity.message}</p>
                        <p className="text-xs text-gray-500">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Vocabulary Section */}
          <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Your Vocabulary</h3>
              <div className="flex items-center gap-4">
                <Button variant="ghost" className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-button">
                  <i className="ri-filter-3-line w-5 h-5 flex items-center justify-center"></i>
                  Filter
                </Button>
                <Button className="px-4 py-2 h-auto bg-primary text-white font-medium rounded-button hover:bg-primary/90">
                  Study Now
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {vocabularyWords.map(word => (
                <div 
                  key={word.id} 
                  className="word-card bg-gray-50 rounded-xl p-4 cursor-pointer"
                  onClick={() => showWordDetails(word.word, word.definition)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 ${getCategoryColor(word.category)} rounded-full text-xs`}>
                      {word.category}
                    </span>
                    <Button variant="ghost" size="icon" className="w-6 h-6 flex items-center justify-center text-gray-400">
                      <i className="ri-more-line"></i>
                    </Button>
                  </div>
                  <p className="text-xl font-bold mb-1">{word.word}</p>
                  <p className="text-gray-600 text-sm mb-3">{word.definition}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Next review: {word.reviewDate}</span>
                    <span className={`${getLevelColor(word.level)} font-medium`}>{word.level}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
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
