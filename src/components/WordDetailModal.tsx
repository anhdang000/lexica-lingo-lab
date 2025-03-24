import React, { useState } from 'react';
import { cn } from '@/lib/utils';
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
import type { WordDefinition } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { getOrCreateGeneralCollection, addWordToCollection } from '@/lib/database';
import { toast } from 'sonner';

interface WordDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wordDetails: WordDefinition | null;
}

const WordDetailModal: React.FC<WordDetailModalProps> = ({ open, onOpenChange, wordDetails }) => {
  const { user } = useAuth();
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  if (!wordDetails) return null;

  const handleAddToLibrary = async () => {
    if (!user) {
      toast.error("Please log in to save words to your library");
      return;
    }

    setIsAdding(true);
    try {
      const collection = await getOrCreateGeneralCollection(user.id);
      const success = await addWordToCollection(user.id, wordDetails, collection.id);

      if (success) {
        toast.success(`Added "${wordDetails.word}" to library`);
      } else {
        toast.error(`Failed to add "${wordDetails.word}" to library`);
      }
    } catch (error) {
      console.error('Error adding word:', error);
      toast.error("Failed to add word to library");
    } finally {
      setIsAdding(false);
    }
  };

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
      <DialogContent 
        className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-xl p-6 max-w-lg w-full mx-4 shadow-xl"
        onClick={() => setShowFullDetails(!showFullDetails)}
      >
        <div className="cursor-pointer group/card">
          <DialogHeader>
            <div className="flex items-center gap-3 flex-wrap">
              <DialogTitle className="text-2xl font-bold text-[#cd4631] dark:text-[#de6950]">
                {wordDetails.word}
              </DialogTitle>
              {wordDetails.pronunciation?.text && (
                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  /{wordDetails.pronunciation.text}/
                </span>
              )}
              {wordDetails.partOfSpeech && (
                <span className={cn(
                  "text-[11px] px-2 py-0.5 rounded-full font-medium transition-colors",
                  getPartOfSpeechStyle(wordDetails.partOfSpeech)
                )}>
                  {wordDetails.partOfSpeech}
                </span>
              )}
            </div>
            <DialogDescription className="text-gray-600 dark:text-gray-300 mt-4 space-y-6">
              {/* Small hint text */}
              <div className="text-xs text-gray-400 dark:text-gray-500 mb-2 transition-opacity duration-200 group-hover/card:opacity-100 opacity-50">
                Click anywhere to {showFullDetails ? 'hide' : 'view'} details
              </div>

              {/* Definitions with smooth height animation */}
              <div className="space-y-4 overflow-hidden transition-all duration-300 ease-in-out">
                {(showFullDetails ? wordDetails.definitions : wordDetails.definitions.slice(0, 1)).map((def, idx) => (
                  <div key={idx} className="group/def space-y-2">
                    <p className="text-gray-800 dark:text-gray-200 text-base">
                      {idx + 1}. {def.meaning}
                    </p>
                    {def.examples && def.examples.length > 0 && (
                      <div className="pl-6 border-l-2 border-[#cd4631]/30 group-hover/def:border-[#cd4631]
                                    transition-colors duration-300">
                        <p className="text-gray-600 dark:text-gray-400 italic text-sm">
                          {def.examples[0]}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                
                {!showFullDetails && wordDetails.definitions.length > 1 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                    + {wordDetails.definitions.length - 1} more definition{wordDetails.definitions.length > 2 ? 's' : ''}
                  </p>
                )}
              </div>

              {/* Word variations with smooth height animation */}
              <div 
                className={cn(
                  "overflow-hidden transition-all duration-300 ease-in-out",
                  showFullDetails ? "opacity-100 max-h-40" : "opacity-0 max-h-0"
                )}
              >
                {showFullDetails && wordDetails.stems && wordDetails.stems.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Word Forms & Phrases:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {wordDetails.stems.map((stem, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 text-xs bg-[#f8f2dc] dark:bg-[#cd4631]/10 
                                   text-[#9e6240] dark:text-[#dea47e] rounded-full
                                   hover:bg-[#f8f2dc]/70 dark:hover:bg-[#cd4631]/20
                                   transition-colors duration-200"
                        >
                          {stem}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-6" onClick={(e) => e.stopPropagation()}>
            {wordDetails.pronunciation?.audio && (
              <Button 
                variant="secondary" 
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                onClick={() => new Audio(wordDetails.pronunciation?.audio).play()}
              >
                <Volume2 className="h-4 w-4" />
                <span className="text-sm">Listen</span>
              </Button>
            )}
            <Button 
              className="flex items-center gap-2 bg-[#cd4631] hover:bg-[#cd4631]/90 text-white"
              onClick={handleAddToLibrary}
              disabled={isAdding}
            >
              <Star className="h-4 w-4" />
              <span className="text-sm">Add to Study List</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WordDetailModal;
