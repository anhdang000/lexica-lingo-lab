import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from 'react';
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
  getPracticeWords,
  completePracticeSession
} from '@/lib/database';
import { supabase } from '@/integrations/supabase/client';

interface Word {
  id: string;
  wordVariantId: string;
  word: string;
  phonetics: string;
  audio_url: string;
  part_of_speech: string;
  definitions: string[];
  examples: string[];
  collectionId: string;
  status: string;
  // Selected definition and example (randomly chosen)
  selectedDefinition?: string;
  selectedExample?: string;
}

// Define the structure of the persisted state
interface FlashcardGameState {
  words: Word[];
  currentWordIndex: number;
  isFlipped: boolean;
  initialSide: 'front' | 'back';
  sessionCount: number;
  sessionId: string | null;
  practicedWords: Word[];
  recordedWords: string[];
  cardFlippedOnce: boolean;
  isSessionActive: boolean;
  timestamp: number;
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
    const STORAGE_KEY = 'flashcardGameState';
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

    // Expose the handleBack method to parent component
    useImperativeHandle(ref, () => ({
      handleBack: async () => {
        // Complete current session
        await completeCurrentSession(false);
        
        // Check if dialog was already shown (by handleFinishSession)
        const dialogAlreadyShown = localStorage.getItem('dialogAlreadyShown');
        
        // Show completion dialog if user has practiced any words AND dialog wasn't already shown
        if (practicedWords.length > 0 && !dialogAlreadyShown) {
          setShowCompletionDialog(true);
          // Return a promise that resolves after the dialog timeout
          return new Promise<void>(resolve => {
            setTimeout(() => {
              setShowCompletionDialog(false);
              resolve();
            }, 2000);
          });
        }
        
        // Clear the flag and persisted state when going back
        localStorage.removeItem('dialogAlreadyShown');
        localStorage.removeItem(STORAGE_KEY);
        
        return Promise.resolve();
      }
    }));

    // Save game state to localStorage
    const saveGameState = () => {
      if (!user) return;
      
      const state: FlashcardGameState = {
        words,
        currentWordIndex,
        isFlipped,
        initialSide,
        sessionCount,
        sessionId,
        practicedWords,
        recordedWords: Array.from(recordedWords),
        cardFlippedOnce,
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
        
        const state: FlashcardGameState = JSON.parse(savedState);
        
        // Check if the session has expired (30 minutes)
        if (Date.now() - state.timestamp > SESSION_TIMEOUT) {
          localStorage.removeItem(STORAGE_KEY);
          return false;
        }
        
        // Restore the state
        setWords(state.words);
        setCurrentWordIndex(state.currentWordIndex);
        setIsFlipped(state.isFlipped);
        setInitialSide(state.initialSide);
        setSessionCount(state.sessionCount);
        setSessionId(state.sessionId);
        setPracticedWords(state.practicedWords);
        setRecordedWords(new Set(state.recordedWords));
        setCardFlippedOnce(state.cardFlippedOnce);
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
        // Always start fresh when the component mounts for the first time or sessionCount changes
        // Clear any persisted state first
        localStorage.removeItem(STORAGE_KEY);
        // Set loading state to true first, then fetch words
        setIsLoading(true);
        fetchWords();
        // Don't set isLoading to false here, it will be set in fetchWords when data is ready
      }

      // Clean up effect - complete session when component unmounts
      return () => {
        if (isSessionActive.current && sessionId && practicedWords.length > 0) {
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
        if (document.visibilityState === 'visible' && user && words.length === 0) {
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
    }, [user, words.length, loadGameState]);

    // Save state whenever relevant state changes
    useEffect(() => {
      if (user && words.length > 0) {
        saveGameState();
      }
    }, [
      words, 
      currentWordIndex, 
      isFlipped, 
      initialSide, 
      sessionCount, 
      sessionId, 
      practicedWords, 
      recordedWords,
      cardFlippedOnce
    ]);

    useEffect(() => {
      if (words.length > 0) {
        setInitialSide(Math.random() > 0.5 ? 'front' : 'back');
        setIsFlipped(false);
        setCardFlippedOnce(false); // Reset flip tracking for the new card
      }
    }, [currentWordIndex, words]);

    const fetchWords = async () => {
      if (!user) return;
      
      // Reset the state before fetching new words
      setPracticedWords([]);
      setRecordedWords(new Set());
      setCurrentWordIndex(0);
      setIsLoading(true);
      
      try {
        // Create a new practice session
        const session = await createPracticeSession(user.id, 'flashcard', cardsPerSession);
        if (session) {
          setSessionId(session.id);
          isSessionActive.current = true;
        }
        
        // Fetch flashcard words using the dedicated function
        const fetchedWords = await getPracticeWords(user.id, cardsPerSession);
        
        if (fetchedWords.length === 0) {
          toast({
            title: "No words found",
            description: "Add some words to your collections to practice with flashcards.",
            variant: "default",
          });
          onBack();
          return;
        }
        
        // Process each word to randomly select one definition and its corresponding example
        const processedWords = fetchedWords.map(word => {
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
          const selectedDefinition = word.definitions[randomIndex];
          
          // Get the corresponding example if available at the same index
          const selectedExample = word.examples && word.examples.length > randomIndex 
            ? word.examples[randomIndex] 
            : "No example available";
            
          return {
            ...word,
            selectedDefinition,
            selectedExample
          };
        });
        
        setWords(processedWords);
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
      const wordKey = `${word.wordVariantId}`;
      
      // Skip if already recorded
      if (recordedWords.has(wordKey)) {
        return true;
      }
      
      try {
        const success = await recordPracticeWordResult(
          sessionId,
          word.wordVariantId,
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
        }
        
        return success;
      } catch (error) {
        console.error("Error recording word result:", error);
        return false;
      }
    };

    // Complete the current session and record all practiced words
    const completeCurrentSession = async (isFullyCompleted: boolean = true) => {
      if (!sessionId || !user) return;
      
      // If no words were actually practiced (flipped), we should delete the session
      if (recordedWords.size === 0) {
        try {
          // Delete the empty practice session
          const { error } = await supabase
            .from("practice_sessions")
            .delete()
            .eq("id", sessionId);
            
          if (error) {
            console.error("Error deleting empty practice session:", error);
          }
          
          // Mark the session as inactive after deletion
          isSessionActive.current = false;
          return;
        } catch (error) {
          console.error("Exception deleting empty practice session:", error);
          return;
        }
      }
      
      // Only update the session if words were actually practiced
      try {
        // Update practice session status with completion flag
        await completePracticeSession(
          sessionId,
          recordedWords.size, // Pass the actual count of correctly practiced words
          isFullyCompleted
        );
        
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
        
        // Add the current word to practiced words if not already included
        setPracticedWords(prev => {
          if (!prev.some(word => word.id === currentWord.id && word.wordVariantId === currentWord.wordVariantId)) {
            return [...prev, currentWord];
          }
          return prev;
        });
        
        // Record the word in the database
        await recordWordResult(currentWord);
      }
    };

    const handleContinueSession = async () => {
      // Complete current session before starting a new one
      await completeCurrentSession(true);
      // Clear saved state to ensure we start fresh
      localStorage.removeItem(STORAGE_KEY);
      setSessionId(null);
      setSessionCount(prev => prev + 1);
    };

    const handleFinishSession = async () => {
      await completeCurrentSession(true);
      // Clear saved state to ensure we start fresh on next entry
      localStorage.removeItem(STORAGE_KEY);
      
      // Show completion dialog and pass a flag to prevent showing it again in handleBack
      setShowCompletionDialog(true);
      
      // Create a flag in localStorage to indicate we've already shown the dialog
      localStorage.setItem('dialogAlreadyShown', 'true');
      
      setTimeout(() => {
        setShowCompletionDialog(false);
        onBack();
      }, 2000);
    };

    // Handle the back button click - ensure all data is saved before navigation
    const handleBack = async () => {
      await completeCurrentSession(false);
      
      // Clear saved state to ensure a fresh start on next entry
      localStorage.removeItem(STORAGE_KEY);
      
      // Check if dialog was already shown (by handleFinishSession)
      const dialogAlreadyShown = localStorage.getItem('dialogAlreadyShown');
      
      // Show completion dialog if user has flipped any cards AND dialog wasn't already shown
      if (recordedWords.size > 0 && !dialogAlreadyShown) {
        setShowCompletionDialog(true);
        setTimeout(() => {
          setShowCompletionDialog(false);
          onBack();
        }, 2000);
      } else {
        // Clear the flag
        localStorage.removeItem('dialogAlreadyShown');
        // Navigate back immediately if no words practiced or dialog was already shown
        onBack();
      }
    };

    const CardContent = ({ type }: { type: 'definition' | 'word' }) => {
      if (!words.length) return <div className="flex items-center justify-center h-full">Loading...</div>;
      
      const currentWord = words[currentWordIndex];
      
      if (type === 'definition') {
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <span className="text-sm text-gray-500 mb-4 px-3 py-1 rounded-full bg-gray-100">
              {currentWord.part_of_speech}
            </span>
            <p className="text-xl font-semibold mb-6">{currentWord.selectedDefinition}</p>
            <p className="text-sm text-gray-600 italic border-l-2 border-[#cd4631] pl-4">
              {currentWord.selectedExample}
            </p>
          </div>
        );
      }
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
          <h2 className="text-4xl font-bold mb-4 text-[#cd4631]">{currentWord.word}</h2>
          {currentWord.phonetics && (
            <p className="text-gray-600 font-mono">/{currentWord.phonetics}/</p>
          )}
        </div>
      );
    };

    const fadeVariants = {
      hidden: { opacity: 0 },
      visible: { opacity: 1 }
    };

    // Improved loading state handling to prevent "No words" flash
    if (isLoading) {
      return (
        <div className="container max-w-2xl mx-auto px-4 py-8 flex justify-center items-center h-[400px]">
          <p>Loading flashcards...</p>
        </div>
      );
    }

    // Only show this when not loading AND we know there are no words
    if (!isLoading && words.length === 0) {
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
