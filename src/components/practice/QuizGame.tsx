import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, MoveRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface QuizQuestion {
  word: string;
  question: string;
  options: string[];
  correct_option_idx: number;
}

// Placeholder API response - this would come from your actual API
const sampleQuizzes: QuizQuestion[] = [
  {
    word: "optimistic",
    question: "Imagine you're planning a picnic, and the weather forecast predicts rain. Someone with this quality might say, \"It'll clear up!\" even if the chance of rain is high. What word describes their outlook?",
    options: [
      "pessimistic",
      "realistic",
      "optimistic",
      "apathetic"
    ],
    correct_option_idx: 2
  },
  {
    word: "overreact",
    question: "Your friend spills their drink, and instead of just cleaning it up, they start yelling and slamming things around. Which word best describes their behavior?",
    options: [
      "respond",
      "underreact",
      "overreact",
      "react"
    ],
    correct_option_idx: 2
  },
  {
    word: "downside",
    question: "You're considering buying a pet snake. You've thought about the fun of owning a snake, but what's a negative thing to keep in mind about this?",
    options: [
      "upside",
      "benefit",
      "downside",
      "advantage"
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

  const currentQuestion = sampleQuizzes[currentQuestionIndex];
  const questionsPerSession = sampleQuizzes.length;

  useEffect(() => {
    // Shuffle options when question changes
    const shuffled = [...currentQuestion.options].sort(() => Math.random() - 0.5);
    setShuffledOptions(shuffled);
    setSelectedOption(null);
    setIsCorrect(null);
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
    if (selectedOption === null) return "border-2 border-gray-200 hover:border-[#cd4631]";
    if (selectedOption !== index) return "border-2 border-gray-200 opacity-50";
    return isCorrect 
      ? "border-2 border-green-500 bg-green-50" 
      : "border-2 border-red-500 bg-red-50";
  };

  return (
    <div className="container max-w-3xl mx-auto px-4">
      <Progress 
        value={(currentQuestionIndex / questionsPerSession) * 100}
        className="h-2 mb-8"
      />
      <div className="mb-8">
        <p className="text-sm text-gray-500 mb-2">
          Question {currentQuestionIndex + 1} of {questionsPerSession} · Score: {score} · Session {sessionCount}
        </p>
        <Card className="bg-white p-6">
          <p className="text-xl font-medium mb-12 leading-relaxed">{currentQuestion.question}</p>
          <div className="grid grid-cols-2 gap-4">
            {shuffledOptions.map((option, index) => (
              <Button
                key={option}
                variant="outline"
                className={`p-6 h-auto text-left justify-start font-normal ${getOptionClassName(index)}`}
                onClick={() => handleOptionSelect(index)}
                disabled={selectedOption !== null}
              >
                {option}
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
                className="bg-[#cd4631] hover:bg-[#cd4631]/90"
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