import React, { useState, useEffect } from 'react';
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
  DialogFooter,
} from "@/components/ui/dialog";

interface Word {
  word: string;
  phonetic: {
    text: string;
    audio: string;
  };
  partOfSpeech: string;
  definition: string;
  example: string;
}

const sampleWords: Word[] = [
  {
    word: "optimistic",
    phonetic: {
      text: "/ˌɒptɪˈmɪstɪk/",
      audio: ""
    },
    partOfSpeech: "adjective",
    definition: "Hopeful and confident about the future.",
    example: "Despite the challenges, she remained optimistic about the project's success."
  },
  {
    word: "serendipity",
    phonetic: {
      text: "/ˌserənˈdɪpɪti/",
      audio: ""
    },
    partOfSpeech: "noun",
    definition: "The occurrence and development of events by chance in a happy or beneficial way.",
    example: "The discovery of penicillin was a perfect example of serendipity."
  },
  {
    word: "eloquent",
    phonetic: {
      text: "/ˈeləkwənt/",
      audio: ""
    },
    partOfSpeech: "adjective",
    definition: "Fluent or persuasive in speaking or writing.",
    example: "Her eloquent speech moved the entire audience."
  },
  {
    word: "persevere",
    phonetic: {
      text: "/ˌpɜːsɪˈvɪə/",
      audio: ""
    },
    partOfSpeech: "verb",
    definition: "Continue in a course of action even in the face of difficulty.",
    example: "You must persevere with your studies if you want to succeed."
  },
  {
    word: "ephemeral",
    phonetic: {
      text: "/ɪˈfem(ə)rəl/",
      audio: ""
    },
    partOfSpeech: "adjective",
    definition: "Lasting for a very short time.",
    example: "The beauty of cherry blossoms is ephemeral, lasting only a few days."
  }
];

export const FlashcardGame = ({ onBack }: { onBack: () => void }) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [initialSide, setInitialSide] = useState<'front' | 'back'>('front');
  const [sessionCount, setSessionCount] = useState(1);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const cardsPerSession = 5;

  useEffect(() => {
    setInitialSide(Math.random() > 0.5 ? 'front' : 'back');
    setIsFlipped(false);
  }, [currentWordIndex]);

  const currentWord = sampleWords[currentWordIndex];

  const handleNextWord = () => {
    if (currentWordIndex < sampleWords.length - 1) {
      setCurrentWordIndex((prev) => prev + 1);
    }
  };

  const handleCardClick = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleContinueSession = () => {
    setSessionCount(prev => prev + 1);
    setCurrentWordIndex(0);
  };

  const handleFinishSession = () => {
    setShowCompletionDialog(true);
    setTimeout(() => {
      setShowCompletionDialog(false);
      onBack();
    }, 2000);
  };

  const CardContent = ({ type }: { type: 'definition' | 'word' }) => {
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
        <p className="text-gray-600 font-mono">{currentWord.phonetic.text}</p>
      </div>
    );
  };

  const fadeVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

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
        <p className="text-sm text-gray-500">
          Card {currentWordIndex + 1} of {cardsPerSession} · Session {sessionCount}
        </p>
        {currentWordIndex === cardsPerSession - 1 ? (
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
            disabled={currentWordIndex === cardsPerSession - 1}
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
              You've successfully learned {cardsPerSession * sessionCount} words!
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};
