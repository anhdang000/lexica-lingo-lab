import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoveRight, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  getFlashcardWords,
  completePracticeSession,
  updatePracticeSessionTotalWords 
} from '@/lib/database';

interface Word {
  id: string;
  word: string;
  phonetic: {
    text: string;
    audio: string;
  };
  partOfSpeech: string;
  definition: string;
  example: string;
  collectionId: string;
  meaningId: string;
}

export interface FlashcardGameRef {
  handleBack: () => Promise<void>;
}

export const FlashcardGame = forwardRef<FlashcardGameRef, { onBack: () => void }>(
  ({ onBack }, ref) => {
    const { user } = useAuth();
    const [words, setWords] = useState<Word[]>([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [initialSide, setInitialSide] = useState<'front' | 'back'>('front');
    const [sessionCount, setSessionCount] = useState(1);
    const [showCompletionDialog, setShowCompletionDialog] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [practicedWords, setPracticedWords] = useState<Word[]>([]);
    const [recordedWords, setRecordedWords] = useState<Set<string>>(new Set());
    const [cardFlippedOnce, setCardFlippedOnce] = useState(false);
    const cardsPerSession = 5;
    const isSessionActive = useRef(false);

    // Expose the handleBack method to parent component
    useImperativeHandle(ref, () => ({
      handleBack: async () => {
        // No need to record word on back if we're already tracking on flip
        await completeCurrentSession(false);
        return Promise.resolve();
      }
    }));

    useEffect(() => {
      if (user) {
        fetchWords();
      }

      // Clean up effect - complete session when component unmounts
      return () => {
        if (isSessionActive.current && sessionId && practicedWords.length > 0) {
          completeCurrentSession(false);
        }
      };
    }, [user, sessionCount]);

    useEffect(() => {
      if (words.length > 0) {
        setInitialSide(Math.random() > 0.5 ? 'front' : 'back');
        setIsFlipped(false);
        setCardFlippedOnce(false); // Reset flip tracking for the new card
      }
    }, [currentWordIndex, words]);

    // Add practice word to the list of practiced words
    useEffect(() => {
      if (words.length > 0 && currentWordIndex < words.length) {
        // Add the current word to practiced words if not already included
        const currentWord = words[currentWordIndex];
        setPracticedWords(prev => {
          if (!prev.some(word => word.id === currentWord.id && word.meaningId === currentWord.meaningId)) {
            return [...prev, currentWord];
          }
          return prev;
        });
      }
    }, [currentWordIndex, words]);

    const fetchWords = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        // Create a new practice session
        const session = await createPracticeSession(user.id, 'flashcard', cardsPerSession);
        if (session) {
          setSessionId(session.id);
          isSessionActive.current = true;
        }
        
        // Fetch flashcard words using the dedicated function
        const flashcardWords = await getFlashcardWords(user.id, cardsPerSession);
        
        if (flashcardWords.length === 0) {
          toast({
            title: "No words found",
            description: "Add some words to your collections to practice with flashcards.",
            variant: "default",
          });
          onBack();
          return;
        }
        
        setWords(flashcardWords);
        setCurrentWordIndex(0);
        // Reset tracked words for new session
        setPracticedWords([]);
        setRecordedWords(new Set());
      } catch (error) {
        console.error("Exception fetching words:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    // Record a single practice word result, making sure not to duplicate
    const recordWordResult = async (word: Word) => {
      if (!sessionId || !user) return false;

      // Create a unique key to track recorded words
      const wordKey = `${word.id}-${word.meaningId}`;
      
      // Skip if already recorded
      if (recordedWords.has(wordKey)) {
        return true;
      }
      
      try {
        const success = await recordPracticeWordResult(
          sessionId,
          word.id,
          word.meaningId,
          word.collectionId,
          true // All flashcard reviews are considered correct
        );
        
        if (success) {
          // Mark this word as recorded
          setRecordedWords(prev => {
            const updated = new Set(prev);
            updated.add(wordKey);
            return updated;
          });
          
          // Update the practice session:
          // 1. Increment the total_words count to match recorded words
          // 2. Also update correct_answers to ensure they stay in sync
          const newCount = recordedWords.size + 1; // +1 for the word we just added
          await updatePracticeSessionTotalWords(sessionId, newCount);
          await completePracticeSession(sessionId, newCount, false);
        }
        
        return success;
      } catch (error) {
        console.error("Error recording word result:", error);
        return false;
      }
    };

    // Complete the current session and record all practiced words
    const completeCurrentSession = async (isFullyCompleted: boolean = true) => {
      if (!sessionId || !user || practicedWords.length === 0) return;
      
      try {
        // For flashcards, correct_answers should always equal total_words
        // since all flashcard interactions are considered correct
        const correctCount = practicedWords.length;
        
        // Update practice session status with actual number of practiced words
        await completePracticeSession(
          sessionId,
          correctCount, // All flashcard reviews are considered correct
          isFullyCompleted
        );
        
        // Ensure total_words matches correct_answers to fix the database issue
        await updatePracticeSessionTotalWords(sessionId, correctCount);
        
        // Mark the session as inactive after completion
        isSessionActive.current = false;
      } catch (error) {
        console.error("Error completing practice session:", error);
      }
    };

    // Handle when a user goes to the next word
    const handleNextWord = async () => {
      // No need to record here as it's recorded on card flip
      if (currentWordIndex < words.length - 1) {
        setCurrentWordIndex(prev => prev + 1);
      }
    };

    const handleCardClick = async () => {
      // Flip the card
      setIsFlipped(prev => !prev);
      
      // If this is the first flip of this card, record the practice
      if (!cardFlippedOnce && words.length > 0 && currentWordIndex < words.length) {
        setCardFlippedOnce(true);
        const currentWord = words[currentWordIndex];
        await recordWordResult(currentWord);
      }
    };

    const handleContinueSession = async () => {
      // Complete current session before starting a new one
      await completeCurrentSession(true);
      setSessionId(null);
      setSessionCount(prev => prev + 1);
    };

    const handleFinishSession = async () => {
      await completeCurrentSession(true);
      setShowCompletionDialog(true);
      setTimeout(() => {
        setShowCompletionDialog(false);
        onBack();
      }, 2000);
    };

    // Handle the back button click - ensure all data is saved before navigation
    const handleBack = async () => {
      await completeCurrentSession(false);
      
      // Navigate back
      onBack();
    };

    const CardContent = ({ type }: { type: 'definition' | 'word' }) => {
      if (!words.length) return <div className="flex items-center justify-center h-full">Loading...</div>;
      
      const currentWord = words[currentWordIndex];
      
      if (type === 'definition') {
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <span className="text-sm text-gray-500 mb-4 px-3 py-1 rounded-full bg-gray-100">
              {currentWord.partOfSpeech}
            </span>
            <p className="text-xl font-semibold mb-6">{currentWord.definition}</p>
            <p className="text-sm text-gray-600 italic border-l-2 border-[#cd4631] pl-4">
              {currentWord.example}
            </p>
          </div>
        );
      }
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <h2 className="text-4xl font-bold mb-4 text-[#cd4631]">{currentWord.word}</h2>
          <p className="text-gray-600 font-mono">/{currentWord.phonetic.text}/</p>
        </div>
      );
    };

    const fadeVariants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1 }
    };

    if (isLoading) {
      return (
        <div className="container max-w-2xl mx-auto px-4 py-8 flex justify-center items-center h-[400px]">
          <p>Loading flashcards...</p>
        </div>
      );
    }

    if (words.length === 0) {
      return (
        <div className="container max-w-2xl mx-auto px-4 py-8 flex flex-col justify-center items-center h-[400px]">
          <p className="mb-4">No words available for practice.</p>
          <Button onClick={handleBack}>Go Back</Button>
        </div>
      );
    }

    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <div className="relative h-[400px] mb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentWordIndex}
              variants={fadeVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ duration: 0.3 }}
              className="absolute w-full h-full"
              style={{ perspective: '1000px' }}
            >
              <motion.div
                className="w-full h-full"
                onClick={handleCardClick}
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* Front Side */}
                <div
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                  }}
                >
                  <Card className="h-full bg-white shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent type={initialSide === 'front' ? 'definition' : 'word'} />
                  </Card>
                </div>

                {/* Back Side */}
                <div
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                >
                  <Card className="h-full bg-white shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent type={initialSide === 'front' ? 'word' : 'definition'} />
                  </Card>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBack} 
              className="text-sm text-gray-500"
            >
              Back
            </Button>
            <p className="text-sm text-gray-500 flex items-center">
              Card {currentWordIndex + 1} of {Math.min(cardsPerSession, words.length)} · Session {sessionCount}
            </p>
          </div>
          {currentWordIndex === Math.min(cardsPerSession, words.length) - 1 ? (
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
              onClick={handleNextWord}
              disabled={currentWordIndex === Math.min(cardsPerSession, words.length) - 1}
              className="bg-[#cd4631] hover:bg-[#cd4631]/90"
            >
              Next Word
              <MoveRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        <Dialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-center gap-2 text-[#cd4631]">
                <Trophy className="h-6 w-6" />
                Congratulations!
              </DialogTitle>
              <DialogDescription className="text-center py-4 text-lg">
                You've successfully learned {practicedWords.length} words!
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);
