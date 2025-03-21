
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose
} from '@/components/ui/dialog';
import { Volume2, Star } from 'lucide-react';

interface WordDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  word: string;
  phonetic?: string;
  partOfSpeech?: string;
  definition: string;
  example?: string;
}

const WordDetailModal: React.FC<WordDetailModalProps> = ({
  open,
  onOpenChange,
  word,
  phonetic,
  partOfSpeech,
  definition,
  example
}) => {
  // Function to get styling based on part of speech
  const getPartOfSpeechStyle = (pos: string) => {
    switch (pos?.toLowerCase()) {
      case 'noun':
        return 'bg-primary/10 text-primary';
      case 'verb':
        return 'bg-secondary/10 text-secondary';
      case 'adjective':
        return 'bg-[#dea47e]/20 text-[#9e6240]';
      case 'adverb':
        return 'bg-[#81adc8]/20 text-[#81adc8]';
      case 'pronoun':
        return 'bg-[#f8f2dc]/40 text-[#9e6240]';
      case 'preposition':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'conjunction':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'interjection':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <DialogTitle className="text-2xl font-bold">{word}</DialogTitle>
            {phonetic && (
              <span className="text-gray-400 text-sm italic">{phonetic}</span>
            )}
            {partOfSpeech && (
              <span className={`text-xs px-2 py-0.5 rounded-md ${getPartOfSpeechStyle(partOfSpeech)}`}>
                {partOfSpeech}
              </span>
            )}
          </div>
          <DialogDescription className="text-gray-600 mt-2">{definition}</DialogDescription>
          {example && (
            <p className="text-sm text-gray-500 italic mt-2">"{example}"</p>
          )}
        </DialogHeader>
        <div className="flex gap-2 mt-4">
          <Button variant="secondary" className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Listen
          </Button>
          <Button className="flex items-center gap-2 bg-[#cd4631] hover:bg-[#cd4631]/90 text-white">
            <Star className="h-4 w-4" />
            Add to Study List
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WordDetailModal;
