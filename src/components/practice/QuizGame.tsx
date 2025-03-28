import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { 
  createPracticeSession, 
  recordPracticeWordResult, 
  getQuizQuestions,
  completePracticeSession
} from '@/lib/database';

interface QuizQuestion {
  word: string;
  definition: string;
  question: string;
  options: string[];
  correct_option_idx: number;
  wordId: string;
  meaningId: string;
  collectionId: string;
}

export interface QuizGameRef {
  handleBack: () => Promise<void>;
}

export const QuizGame = forwardRef<QuizGameRef, { onBack: () => void }>(({ onBack }, ref) => {
  const { user } = useAuth();
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [sessionCount, setSessionCount] = useState(1);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<QuizQuestion[]>([]);
  const [recordedAnswers, setRecordedAnswers] = useState<Set<string>>(new Set());
  const questionsPerSession = 3;
  const isSessionActive = React.useRef(false);

  // Expose handleBack method to parent
  useImperativeHandle(ref, () => ({
    handleBack: async () => {
      if (sessionId && answeredQuestions.length > 0) {
        // Record the current question if it hasn't been recorded yet
        if (quizQuestions.length > 0 && currentQuestionIndex < quizQuestions.length && selectedOption !== null) {
          await recordQuizAnswer(quizQuestions[currentQuestionIndex], selectedOption);
        }
        
        // Complete the session with all answered questions
        await completeCurrentSession(false);
      }
      
      return Promise.resolve();
    }
  }));

  useEffect(() => {
    if (user) {
      fetchQuizQuestions();
    }

    // Clean up effect - complete session when component unmounts
    return () => {
      if (isSessionActive.current && sessionId && answeredQuestions.length > 0) {
        completeCurrentSession(false);
      }
    };
  }, [user, sessionCount]);

  // Add answered question to the list
  useEffect(() => {
    if (quizQuestions.length > 0 && currentQuestionIndex < quizQuestions.length && selectedOption !== null) {
      // Add the current question to answered questions if not already included
      const currentQuestion = quizQuestions[currentQuestionIndex];
      setAnsweredQuestions(prev => {
        if (!prev.some(q => q.wordId === currentQuestion.wordId && q.meaningId === currentQuestion.meaningId)) {
          return [...prev, currentQuestion];
        }
        return prev;
      });
    }
  }, [currentQuestionIndex, selectedOption, quizQuestions]);

  const fetchQuizQuestions = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Create a new practice session
      const session = await createPracticeSession(user.id, 'quiz', questionsPerSession);
      if (session) {
        setSessionId(session.id);
        isSessionActive.current = true;
      }
      
      // Fetch quiz questions using the dedicated function
      const questions = await getQuizQuestions(user.id, questionsPerSession);
      
      if (questions.length === 0) {
        toast({
          title: "No questions available",
          description: "Add more words to your collections to practice with quizzes.",
          variant: "default",
        });
        onBack();
        return;
      }
      
      setQuizQuestions(questions);
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      // Reset tracked answers for new session
      setAnsweredQuestions([]);
      setRecordedAnswers(new Set());
      setScore(0);
    } catch (error) {
      console.error("Exception fetching quiz questions:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Record a quiz answer, making sure not to duplicate
  const recordQuizAnswer = async (question: QuizQuestion, selectedIdx: number) => {
    if (!sessionId || !user) return false;

    // Create a unique key to track recorded answers
    const answerKey = `${question.wordId}-${question.meaningId}`;
    
    // Skip if already recorded
    if (recordedAnswers.has(answerKey)) {
      return true;
    }
    
    try {
      const isCorrect = selectedIdx === question.correct_option_idx;
      
      const success = await recordPracticeWordResult(
        sessionId,
        question.wordId,
        question.meaningId,
        question.collectionId,
        isCorrect
      );
      
      if (success) {
        // Mark this answer as recorded
        setRecordedAnswers(prev => {
          const updated = new Set(prev);
          updated.add(answerKey);
          return updated;
        });
      }
      
      return success;
    } catch (error) {
      console.error("Error recording quiz answer:", error);
      return false;
    }
  };

  // Complete the current session and record all answered questions
  const completeCurrentSession = async (isFullyCompleted: boolean = true) => {
    if (!sessionId || !user || answeredQuestions.length === 0) return;
    
    try {
      // Record all answers that haven't been recorded yet
      for (const question of answeredQuestions) {
        const answerKey = `${question.wordId}-${question.meaningId}`;
        
        // Only record if not already recorded and the question has been answered
        if (!recordedAnswers.has(answerKey)) {
          const questionIndex = quizQuestions.findIndex(
            q => q.wordId === question.wordId && q.meaningId === question.meaningId
          );
          
          if (questionIndex !== -1 && selectedOption !== null) {
            await recordQuizAnswer(question, selectedOption);
          }
        }
      }
      
      // Update practice session status with actual number of answered questions
      await completePracticeSession(
        sessionId,
        answeredQuestions.length, // Number of questions actually answered
        isFullyCompleted
      );
      
      // Mark the session as inactive after completion
      isSessionActive.current = false;
    } catch (error) {
      console.error("Error completing quiz session:", error);
    }
  };

  const handleOptionSelect = (index: number) => {
    setSelectedOption(index);
    
    // Check if selected option is correct
    const currentQuestion = quizQuestions[currentQuestionIndex];
    if (index === currentQuestion.correct_option_idx) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = async () => {
    // Record the current answer
    if (selectedOption !== null) {
      await recordQuizAnswer(quizQuestions[currentQuestionIndex], selectedOption);
    }
    
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowHint(false);
    } else {
      await completeCurrentSession(true);
      setShowCompletionDialog(true);
      setTimeout(() => {
        setShowCompletionDialog(false);
        if (sessionCount < 3) {
          setSessionCount(prev => prev + 1);
          setCurrentQuestionIndex(0);
          setScore(0);
          fetchQuizQuestions();
        } else {
          onBack();
        }
      }, 2000);
    }
  };

  const handleBack = async () => {
    // Fix recursive call to handleBack
    if (sessionId && answeredQuestions.length > 0) {
      // Record the current question if it hasn't been recorded yet
      if (quizQuestions.length > 0 && currentQuestionIndex < quizQuestions.length && selectedOption !== null) {
        await recordQuizAnswer(quizQuestions[currentQuestionIndex], selectedOption);
      }
      
      // Complete the session with all answered questions
      await completeCurrentSession(false);
    }
    
    onBack();
  };

  const getOptionClassName = (index: number) => {
    if (selectedOption === null) return "mb-3 w-full";
    
    const isCorrectOption = index === quizQuestions[currentQuestionIndex].correct_option_idx;
    const isSelectedOption = index === selectedOption;
    
    if (isCorrectOption) {
      return "mb-3 w-full bg-green-50 border-green-500 text-green-800";
    } else if (isSelectedOption) {
      return "mb-3 w-full bg-red-50 border-red-500 text-red-800";
    }
    
    return "mb-3 w-full opacity-50";
  };

  if (isLoading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8 flex justify-center items-center h-[400px]">
        <p>Loading quiz questions...</p>
      </div>
    );
  }

  if (quizQuestions.length === 0) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8 flex flex-col justify-center items-center h-[400px]">
        <p className="mb-4">No questions available for practice.</p>
        <Button onClick={onBack}>Go Back</Button>
      </div>
    );
  }

  const currentQuestion = quizQuestions[currentQuestionIndex];

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      {/* Progress Section */}
      <div className="mb-6">
        <div className="flex justify-between mb-2">
          <p className="text-sm text-gray-600">Question {currentQuestionIndex + 1} of {quizQuestions.length}</p>
          <p className="text-sm text-gray-600">Score: {score}</p>
        </div>
        <Progress value={((currentQuestionIndex + 1) / quizQuestions.length) * 100} className="h-2" />
      </div>

      {/* Question Section */}
      <div className="mb-8">
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
          
          {currentQuestion.options.map((option, index) => (
            <Button
              key={index}
              variant="outline"
              className={`p-8 h-auto text-left justify-start text-lg hover:bg-transparent ${getOptionClassName(index)} ${selectedOption !== null ? 'pointer-events-none' : ''}`}
              onClick={() => handleOptionSelect(index)}
            >
              {option}
              {selectedOption !== null && (
                <span className="ml-auto">
                  {index === currentQuestion.correct_option_idx && (
                    <span className="text-green-500">✓</span>
                  )}
                  {selectedOption === index && index !== currentQuestion.correct_option_idx && (
                    <span className="text-red-500">×</span>
                  )}
                </span>
              )}
            </Button>
          ))}
        </Card>
      </div>

      {/* Actions Section */}
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="text-gray-500"
        >
          Back
        </Button>
        
        <Button
          onClick={handleNextQuestion}
          disabled={selectedOption === null}
          className="bg-[#cd4631] hover:bg-[#cd4631]/90"
        >
          {currentQuestionIndex === quizQuestions.length - 1 ? 'Finish' : 'Next Question'}
          <MoveRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-[#cd4631]">
              <Trophy className="h-6 w-6" />
              Great job!
            </DialogTitle>
            <DialogDescription className="text-center py-4 text-lg">
              You scored {score} out of {quizQuestions.length} questions!
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
});
