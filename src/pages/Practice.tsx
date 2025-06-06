import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Brain, Target, Trophy, Calendar, Play, BookOpen, Shuffle, ArrowLeft, TextSearch } from 'lucide-react';
import { FlashcardGame, FlashcardGameRef } from '@/components/practice/FlashcardGame';
import { QuizGame, QuizGameRef } from '@/components/practice/QuizGame';

const Practice = () => {
  const [currentGame, setCurrentGame] = useState<string | null>(null);
  const [gameKey, setGameKey] = useState<number>(0); // Add a key to force component remounting
  const flashcardRef = useRef<FlashcardGameRef>(null);
  const quizRef = useRef<QuizGameRef>(null);

  // Sample learning stats
  const learningStats = {
    todayGoal: 15,
    completed: 8,
    streak: 7,
    accuracy: 92,
    wordsToReview: 12,
  };

  // Sample practice modes
  const practiceModes = [
    {
      title: "Flashcards",
      description: "Review vocabulary with interactive flashcards",
      icon: BookOpen,
      color: "text-[#dea47e]",
      bgColor: "bg-[#dea47e]/10",
    },
    {
      title: "Quizz with AI",
      description: "Test your knowledge with AI-generated quizzes",
      icon: Brain,
      color: "text-[#cd4631]",
      bgColor: "bg-[#cd4631]/10",
    },
    {
      title: "Find the Word",
      description: "Find the correct word from a passage",
      icon: TextSearch,
      color: "text-[#b6c199]",
      bgColor: "bg-[#b6c199]/10",
    },
    {
      title: "Random Challenge",
      description: "Test your knowledge with random words",
      icon: Shuffle,
      color: "text-[#81adc8]",
      bgColor: "bg-[#81adc8]/10",
    }
  ];

  const handleStartPractice = (gameType: string) => {
    // Increment the key to force component remounting
    setGameKey(prevKey => prevKey + 1);
    setCurrentGame(gameType);
    
    // DON'T clear the flashcard state completely, as it would remove totalPracticedWords
    // Instead, we'll let the component handle its own state management
  };

  const handleReturnToPracticeMenu = async () => {
    if (currentGame === "Flashcards" && flashcardRef.current) {
      await flashcardRef.current.handleBack();
    } else if (currentGame === "Quizz with AI" && quizRef.current) {
      await quizRef.current.handleBack();
    }
    
    // Don't completely remove the flashcard state as it contains totalPracticedWords
    // The component will handle its own state management
    
    setCurrentGame(null);
  };

  if (currentGame) {
    return (
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <Button 
          variant="ghost" 
          className="mb-8 hover:bg-gray-100"
          onClick={handleReturnToPracticeMenu}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Practice
        </Button>
        
        {currentGame === "Flashcards" && <FlashcardGame key={gameKey} ref={flashcardRef} onBack={handleReturnToPracticeMenu} />}
        {currentGame === "Quizz with AI" && <QuizGame key={gameKey} ref={quizRef} onBack={handleReturnToPracticeMenu} />}
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      {/* Progress Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">Today's Progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Daily Goal Progress */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Daily Goal</p>
                    <p className="text-2xl font-bold text-[#cd4631]">
                      {learningStats.completed}/{learningStats.todayGoal}
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-[#cd4631]/60" />
                </div>
                <Progress 
                  value={(learningStats.completed / learningStats.todayGoal) * 100}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Streak */}
          <Card className="bg-[#dea47e]/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Current Streak</p>
                  <p className="text-2xl font-bold text-[#dea47e]">{learningStats.streak} days</p>
                </div>
                <Trophy className="h-8 w-8 text-[#dea47e]/60" />
              </div>
            </CardContent>
          </Card>

          {/* Accuracy */}
          <Card className="bg-[#81adc8]/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Accuracy</p>
                  <p className="text-2xl font-bold text-[#81adc8]">{learningStats.accuracy}%</p>
                </div>
                <Brain className="h-8 w-8 text-[#81adc8]/60" />
              </div>
            </CardContent>
          </Card>

          {/* Due for Review */}
          <Card className="bg-[#b6c199]/5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Due for Review</p>
                  <p className="text-2xl font-bold text-[#b6c199]">{learningStats.wordsToReview}</p>
                </div>
                <Calendar className="h-8 w-8 text-[#b6c199]/60" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Practice Modes Section */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Choose Practice Mode</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {practiceModes.map((mode, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 flex flex-col h-full">
                <div className={`w-12 h-12 rounded-lg ${mode.bgColor} ${mode.color} flex items-center justify-center mb-4`}>
                  <mode.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{mode.title}</h3>
                <p className="text-sm text-gray-600 mb-4 flex-grow">{mode.description}</p>
                <Button 
                  className="w-full bg-gray-900 hover:bg-gray-800"
                  onClick={() => handleStartPractice(mode.title)}
                >
                  Start Practice
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Practice;