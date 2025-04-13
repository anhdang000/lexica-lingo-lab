import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
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
  getPracticeWords,
  completePracticeSession
} from '@/lib/database';
import { getQuizQuestions, WordInfo } from '@/lib/utils';

// Helper functions to process text content
const processDefinition = (definition: string, word: string): string => {
  // First, remove the {it} and {/it} tags (instead of replacing with placeholders)
  let processed = definition.replace(/{it}(.*?){\/it}/g, '$1');
  
  // Check if the definition contains the word and hide it
  // Create a regex that matches the word as a whole word (with word boundaries)
  const wordRegex = new RegExp(`\\b${word}\\b`, 'gi');
  
  // Replace the word with underscore placeholders
  processed = processed.replace(wordRegex, '______');
  
  return processed;
};

const processExample = (example: string, word: string): string => {
  // First, remove the {it} and {/it} tags (instead of replacing with placeholders)
  let processed = example.replace(/{it}(.*?){\/it}/g, '$1');
  
  // Remove explanations in format [=...]
  processed = processed.replace(/\[=.*?\]/g, '');
  
  // Check if the example contains the word and hide it
  const wordRegex = new RegExp(`\\b${word}\\b`, 'gi');
  processed = processed.replace(wordRegex, '______');
  
  return processed;
};

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

// Define the structure of the persisted state
interface QuizGameState {
  quizQuestions: QuizQuestion[];
  currentQuestionIndex: number;
  selectedOption: number | null;
  score: number;
  showHint: boolean;
  sessionCount: number;
  sessionId: string | null;
  answeredQuestions: QuizQuestion[];
  recordedAnswers: string[];
  isSessionActive: boolean;
  timestamp: number;
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
  // Add a new state to track total score across all sessions
  const [totalScore, setTotalScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [sessionCount, setSessionCount] = useState(1);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [answeredQuestions, setAnsweredQuestions] = useState<QuizQuestion[]>([]);
  const [recordedAnswers, setRecordedAnswers] = useState<Set<string>>(new Set());
  const questionsPerSession = 5; // Changed to match requirement of 5 quizzes per session
  const isSessionActive = React.useRef(false);
  const STORAGE_KEY = 'quizGameState';
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

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
      
      // Clear the persisted state when going back
      localStorage.removeItem(STORAGE_KEY);
      
      return Promise.resolve();
    }
  }));

  // Save game state to localStorage
  const saveGameState = () => {
    if (!user) return;
    
    const state: QuizGameState = {
      quizQuestions,
      currentQuestionIndex,
      selectedOption,
      score,
      showHint,
      sessionCount,
      sessionId,
      answeredQuestions,
      recordedAnswers: Array.from(recordedAnswers),
      isSessionActive: isSessionActive.current,
      timestamp: Date.now()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  // Load game state from localStorage
  const loadGameState = useCallback(() => {
    if (!user) return false;
    
    try {
      const savedState = localStorage.getItem(STORAGE_KEY);
      if (!savedState) return false;
      
      const state: QuizGameState = JSON.parse(savedState);
      
      // Check if the session has expired (30 minutes)
      if (Date.now() - state.timestamp > SESSION_TIMEOUT) {
        localStorage.removeItem(STORAGE_KEY);
        return false;
      }
      
      // Restore the state
      setQuizQuestions(state.quizQuestions);
      setCurrentQuestionIndex(state.currentQuestionIndex);
      setSelectedOption(state.selectedOption);
      setScore(state.score);
      setShowHint(state.showHint);
      setSessionCount(state.sessionCount);
      setSessionId(state.sessionId);
      setAnsweredQuestions(state.answeredQuestions);
      setRecordedAnswers(new Set(state.recordedAnswers));
      isSessionActive.current = state.isSessionActive;
      
      return true;
    } catch (error) {
      console.error("Error loading game state:", error);
      localStorage.removeItem(STORAGE_KEY);
      return false;
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      // Always start a new session when entering the quiz game
      // Clear any persisted state first to ensure fresh start
      localStorage.removeItem(STORAGE_KEY);
      // Set loading state to true first, then fetch words
      setIsLoading(true);
      fetchQuizQuestions();
    }

    // Clean up effect - complete session when component unmounts
    return () => {
      if (isSessionActive.current && sessionId && answeredQuestions.length > 0) {
        completeCurrentSession(false);
      }
      // Clear storage when unmounting
      localStorage.removeItem(STORAGE_KEY);
    };
  }, [user, sessionCount]);

  // Handle visibility change (tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      // When tab becomes visible again, check if we need to load state
      if (document.visibilityState === 'visible' && user && quizQuestions.length === 0) {
        const stateLoaded = loadGameState();
        if (stateLoaded) {
          setIsLoading(false);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, quizQuestions.length, loadGameState]);

  // Save state whenever relevant state changes
  useEffect(() => {
    if (user && quizQuestions.length > 0) {
      saveGameState();
    }
  }, [
    quizQuestions, 
    currentQuestionIndex, 
    selectedOption, 
    score, 
    showHint, 
    sessionCount, 
    sessionId, 
    answeredQuestions, 
    recordedAnswers
  ]);

  // Add answered question to the list
  useEffect(() => {
    if (quizQuestions.length > 0 && currentQuestionIndex < quizQuestions.length && selectedOption !== null) {
      // Add the current question to answered questions if not already included
      const currentQuestion = quizQuestions[currentQuestionIndex];
      const questionKey = `${currentQuestion.wordId}-${currentQuestion.meaningId}`;
      
      setAnsweredQuestions(prev => {
        // First check if we already have this question in the answered list
        // This prevents the infinite update loop
        if (!prev.some(q => q.wordId === currentQuestion.wordId && q.meaningId === currentQuestion.meaningId)) {
          return [...prev, currentQuestion];
        }
        return prev;
      });
    }
  }, [currentQuestionIndex, selectedOption]);  // Remove quizQuestions from dependency array

  // Update the totalScore state whenever the score changes
  useEffect(() => {
    if (score > 0) {
      setTotalScore(prev => prev + score);
    }
  }, [score, currentQuestionIndex === quizQuestions.length - 1]);

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
      
      // First, get practice words using getPracticeWords
      const practiceWords = await getPracticeWords(user.id, questionsPerSession);
      
      if (practiceWords.length === 0) {
        toast({
          title: "No questions available",
          description: "Add more words to your collections to practice with quizzes.",
          variant: "default",
        });
        onBack();
        return;
      }
      
      // Process each word to randomly select one definition and its corresponding example
      const processedWords = practiceWords.map(word => {
        // If no definitions, provide default values
        if (!word.definitions || word.definitions.length === 0) {
          return {
            ...word,
            selectedDefinition: "No definition available",
            selectedExample: "No example available"
          };
        }
        
        // Pick a random index from the definitions array
        const randomIndex = Math.floor(Math.random() * word.definitions.length);
        
        // Get the corresponding definition and example
        const selectedDefinition = processDefinition(word.definitions[randomIndex], word.word);
        
        // Get the corresponding example if available at the same index
        const selectedExample = word.examples && word.examples.length > randomIndex 
          ? processExample(word.examples[randomIndex], word.word) 
          : "No example available";
          
        return {
          ...word,
          selectedDefinition,
          selectedExample
        };
      });
      
      // Format practice words for quiz generation
      const wordInfoList: WordInfo[] = processedWords.map(word => ({
        word: word.word,
        definition: word.selectedDefinition || "No definition available",
        example: word.selectedExample || ""
      }));
      
      // Generate quiz questions using the utility function
      const quizData = await getQuizQuestions(wordInfoList);
      
      // Enhance quiz data with IDs needed for recording results
      const enhancedQuizData = quizData.map((question, index) => {
        const matchingWord = practiceWords.find(w => w.word.toLowerCase() === question.word.toLowerCase());
        return {
          ...question,
          wordId: matchingWord?.wordVariantId || '', // Using wordVariantId as the word ID
          meaningId: matchingWord?.wordVariantId || '', // Using wordVariantId as the meaning ID as well
          collectionId: matchingWord?.collectionId || ''
        };
      });
      
      setQuizQuestions(enhancedQuizData);
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
    const answerKey = `${question.wordId}-${question.collectionId}`;
    
    // Skip if already recorded
    if (recordedAnswers.has(answerKey)) {
      return true;
    }
    
    try {
      const isCorrect = selectedIdx === question.correct_option_idx;
      
      const success = await recordPracticeWordResult(
        sessionId,
        question.wordId, // This is the wordVariantId from getPracticeWords
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
      
      // Update practice session status with actual completed state
      await completePracticeSession(
        sessionId,
        score, // Use the score as the count of correct answers
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

  // Go to the previous question in the session
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      
      // Restore the previously selected option for this question if it exists
      const previousQuestion = quizQuestions[currentQuestionIndex - 1];
      
      // Check if this question has been answered already
      const answeredIndex = answeredQuestions.findIndex(
        q => q.wordId === previousQuestion.wordId && q.meaningId === previousQuestion.meaningId
      );
      
      if (answeredIndex !== -1) {
        // Find which option was selected before
        const previousOptionIndex = answeredQuestions[answeredIndex].correct_option_idx === previousQuestion.correct_option_idx 
          ? previousQuestion.correct_option_idx 
          : answeredQuestions[answeredIndex].options.findIndex(
              (option, idx) => option === previousQuestion.options[idx] && idx !== previousQuestion.correct_option_idx
            );
            
        setSelectedOption(previousOptionIndex >= 0 ? previousOptionIndex : null);
      } else {
        setSelectedOption(null);
      }
      
      setShowHint(false);
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

  const handleFinishSession = async () => {
    // Record the current answer if not already recorded
    if (selectedOption !== null) {
      await recordQuizAnswer(quizQuestions[currentQuestionIndex], selectedOption);
    }
    
    // Complete the current session as fully completed
    await completeCurrentSession(true);
    
    // Show completion dialog and navigate back after timeout
    setShowCompletionDialog(true);
    setTimeout(() => {
      setShowCompletionDialog(false);
      onBack();
    }, 2000);
  };

  const handleContinueSession = async () => {
    // Record the current answer if not already recorded
    if (selectedOption !== null) {
      await recordQuizAnswer(quizQuestions[currentQuestionIndex], selectedOption);
    }
    
    // Complete the current session as fully completed
    await completeCurrentSession(true);
    
    // Clear state for new session
    localStorage.removeItem(STORAGE_KEY);
    setSessionId(null);
    
    // Increment session count to trigger new session fetch
    setSessionCount(prev => prev + 1);
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
      <div className="container max-w-3xl mx-auto px-4 py-8 flex justify-center items-center h-[400px]">
        <p>Loading quiz questions...</p>
      </div>
    );
  }

  if (quizQuestions.length === 0) {
    return (
      <div className="container max-w-3xl mx-auto px-4 py-8 flex flex-col justify-center items-center h-[400px]">
        <p className="mb-4">No questions available for practice.</p>
        <Button onClick={onBack}>Go Back</Button>
      </div>
    );
  }

  const currentQuestion = quizQuestions[currentQuestionIndex];

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8">
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
          
          {/* Answer options grid 2x2 */}
          <div className="grid grid-cols-2 gap-4">
            {currentQuestion.options.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                className={`p-6 h-auto text-left justify-start text-lg hover:bg-transparent ${getOptionClassName(index)} ${selectedOption !== null ? 'pointer-events-none' : ''}`}
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
          </div>
        </Card>
      </div>

      {/* Actions Section */}
      <div className="flex justify-between">
        {currentQuestionIndex > 0 ? (
          <Button 
            variant="outline" 
            onClick={handlePreviousQuestion}
            className="text-gray-500"
          >
            Previous Question
          </Button>
        ) : (
          <Button 
            variant="outline" 
            onClick={onBack}
            className="text-gray-500"
          >
            Exit Quiz
          </Button>
        )}
        
        {currentQuestionIndex === quizQuestions.length - 1 ? (
          <div className="space-x-3">
            <Button
              onClick={handleFinishSession}
              variant="outline"
              disabled={selectedOption === null}
              className="border-[#cd4631] text-[#cd4631] hover:bg-[#cd4631]/10"
            >
              Finish
            </Button>
            <Button
              onClick={handleContinueSession}
              disabled={selectedOption === null}
              className="bg-[#cd4631] hover:bg-[#cd4631]/90"
            >
              Next Session
              <MoveRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleNextQuestion}
            disabled={selectedOption === null}
            className="bg-[#cd4631] hover:bg-[#cd4631]/90"
          >
            Next Question
            <MoveRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-[#cd4631]">
              <Trophy className="h-6 w-6" />
              Great job!
            </DialogTitle>
            <DialogDescription className="text-center py-4 text-lg">
              You scored {totalScore} out of {quizQuestions.length * sessionCount} questions!
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
});
