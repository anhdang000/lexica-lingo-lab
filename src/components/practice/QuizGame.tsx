import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, MoveRight, HelpCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface QuizQuestion {
  word: string;
  definition: string;
  question: string;
  options: string[];
  correct_option_idx: number;
}

const sampleQuizzes: QuizQuestion[] = [
  {
    word: "optimistic",
    definition: "Hopeful and confident about the future.",
    question: "Imagine a friend always sees the bright side, even when things are tough. They always believe things will get better. Which word best describes their attitude?",
    options: [
      "Pessimistic",
      "Realistic",
      "Optimistic",
      "Critical"
    ],
    correct_option_idx: 2
  },
  {
    word: "overreact",
    definition: "To respond more strongly than is appropriate or necessary.",
    question: "Sometimes, people get really upset about something small. They might yell, cry, or make a bigger deal out of it than they should. What word means the same as responding too strongly?",
    options: [
      "Ignore",
      "Underreact",
      "React calmly",
      "Overreact"
    ],
    correct_option_idx: 3
  },
  {
    word: "downside",
    definition: "The negative aspect or risk of something.",
    question: "Every good thing has a not-so-good side, like how playing video games all day might mean you don't get exercise. What is another way to say the 'not-so-good side'?",
    options: [
      "Upside",
      "Benefit",
      "Downside",
      "Advantage"
    ],
    correct_option_idx: 2
  }
];

export const QuizGame = ({ onBack }: { onBack: () => void }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [score, setScore] = useState(0);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [sessionCount, setSessionCount] = useState(1);
  const [showHint, setShowHint] = useState(false);

  const currentQuestion = sampleQuizzes[currentQuestionIndex];
  const questionsPerSession = sampleQuizzes.length;

  useEffect(() => {
    // Shuffle options when question changes
    const shuffled = [...currentQuestion.options].sort(() => Math.random() - 0.5);
    setShuffledOptions(shuffled);
    setSelectedOption(null);
    setIsCorrect(null);
    setShowHint(false); // Reset hint visibility when question changes
  }, [currentQuestionIndex]);

  const handleOptionSelect = (optionIndex: number) => {
    if (selectedOption !== null) return; // Prevent multiple selections
    
    setSelectedOption(optionIndex);
    const correctIndex = shuffledOptions.indexOf(currentQuestion.options[currentQuestion.correct_option_idx]);
    const correct = optionIndex === correctIndex;
    setIsCorrect(correct);
    if (correct) setScore(prev => prev + 1);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questionsPerSession - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setShowCompletionDialog(true);
      setTimeout(() => {
        setShowCompletionDialog(false);
        onBack();
      }, 2000);
    }
  };

  const handleContinueSession = () => {
    setSessionCount(prev => prev + 1);
    setCurrentQuestionIndex(0);
    setScore(0);
    setSelectedOption(null);
    setIsCorrect(null);
  };

  const handleFinishSession = () => {
    setShowCompletionDialog(true);
    setTimeout(() => {
      setShowCompletionDialog(false);
      onBack();
    }, 2000);
  };

  const getOptionClassName = (index: number) => {
    if (selectedOption === null) return "border-2 border-gray-200 transition-colors duration-200 hover:border-[#cd4631]";
    
    const correctIndex = shuffledOptions.indexOf(currentQuestion.options[currentQuestion.correct_option_idx]);
    
    if (index === correctIndex) {
      return "border-2 border-green-500 bg-green-50";
    }
    if (selectedOption === index) {
      return "border-2 border-red-500 bg-red-50";
    }
    return "border-2 border-gray-200";
  };

  return (
    <div className="container max-w-4xl mx-auto px-4">
      <Progress 
        value={(currentQuestionIndex / questionsPerSession) * 100}
        className="h-3 mb-8"
      />
      <div className="mb-8">
        <p className="text-sm text-gray-500 mb-4">
          Question {currentQuestionIndex + 1} of {questionsPerSession} · Score: {score} · Session {sessionCount}
        </p>
        <Card className="bg-white p-8">
          <p className="text-2xl font-medium mb-4 leading-relaxed">{currentQuestion.question}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHint(!showHint)}
            className="mb-8 text-[#cd4631] hover:text-[#cd4631]/80 hover:bg-[#f8f2dc] flex items-center gap-2"
          >
            <HelpCircle className="h-4 w-4" />
            {showHint ? 'Hide Hint' : 'Show Hint'}
          </Button>
          {showHint && (
            <blockquote className="mb-8 pl-4 border-l-4 border-[#cd4631] text-gray-600 italic">
              {currentQuestion.definition}
            </blockquote>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shuffledOptions.map((option, index) => (
              <Button
                key={option}
                variant="outline"
                className={`p-8 h-auto text-left justify-start text-lg hover:bg-transparent ${getOptionClassName(index)} ${selectedOption !== null ? 'pointer-events-none' : ''}`}
                onClick={() => handleOptionSelect(index)}
              >
                {option}
                {selectedOption !== null && (
                  <span className="ml-auto">
                    {index === shuffledOptions.indexOf(currentQuestion.options[currentQuestion.correct_option_idx]) && (
                      <span className="text-green-500">✓</span>
                    )}
                    {selectedOption === index && index !== shuffledOptions.indexOf(currentQuestion.options[currentQuestion.correct_option_idx]) && (
                      <span className="text-red-500">×</span>
                    )}
                  </span>
                )}
              </Button>
            ))}
          </div>
        </Card>
      </div>

      {selectedOption !== null && (
        <div className="flex justify-end">
          {currentQuestionIndex === questionsPerSession - 1 ? (
            <div className="space-x-3">
              <Button
                onClick={handleFinishSession}
                variant="outline"
                className="border-[#cd4631] text-[#cd4631] hover:bg-[#cd4631]/10"
              >
                Finish
              </Button>
              <Button
                onClick={handleContinueSession}
                className="bg-[#cd4631] hover:bg-[#cd4631]/80"
              >
                Continue Session
                <MoveRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleNextQuestion}
              className="bg-[#cd4631] hover:bg-[#cd4631]/90"
            >
              Next Question
              <MoveRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-[#cd4631]">
              <Trophy className="h-6 w-6" />
              Quiz Complete!
            </DialogTitle>
            <DialogDescription className="text-center py-4 text-lg">
              You scored {score * sessionCount} points in {sessionCount} {sessionCount === 1 ? 'session' : 'sessions'}!
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};
