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
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface WordProps {
  word: string;
  phonetics?: string;
  part_of_speech?: string;
  definitions: string[];
  examples?: string[];
  audio_url?: string;
}

interface WordDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  word: WordProps;
}

const WordDetailModal: React.FC<WordDetailModalProps> = ({ open, onOpenChange, word }) => {
  const { user } = useAuth();
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  if (!word) return null;

  const handleAddToLibrary = async () => {
    if (!user) {
      toast.error("Please log in to save words to your library");
      return;
    }

    setIsAdding(true);
    try {
      // Get the general collection or create it if it doesn't exist
      const { data: collections, error: collectionsError } = await supabase
        .from('collections')
        .select('id')
        .eq('user_id', user.id)
        .eq('name', 'General')
        .single();
        
      if (collectionsError && collectionsError.code !== 'PGRST116') {
        // PGRST116 is the code for "no rows returned", which means we need to create the collection
        console.error('Error finding collection:', collectionsError);
        toast.error("Failed to find your collections");
        setIsAdding(false);
        return;
      }
      
      let collectionId;
      
      if (!collections) {
        // Create a general collection
        const { data: newCollection, error: newCollectionError } = await supabase
          .from('collections')
          .insert({
            name: 'General',
            description: 'General collection of vocabulary words',
            user_id: user.id,
          })
          .select()
          .single();
          
        if (newCollectionError) {
          console.error('Error creating collection:', newCollectionError);
          toast.error("Failed to create a collection");
          setIsAdding(false);
          return;
        }
        
        collectionId = newCollection.id;
      } else {
        collectionId = collections.id;
      }
      
      // Insert the word into the words table
      const { data: wordData, error: wordError } = await supabase
        .from('words')
        .insert({
          word: word.word,
          phonetics: word.phonetics || null,
          part_of_speech: word.part_of_speech || null,
          definitions: word.definitions,
          examples: word.examples || [],
          audio_url: word.audio_url || null,
        })
        .select()
        .single();
        
      if (wordError) {
        console.error('Error creating word:', wordError);
        toast.error("Failed to add word. Please try again.");
        setIsAdding(false);
        return;
      }
      
      // Add the word to the collection
      const { error: collectionWordError } = await supabase
        .from('collection_words')
        .insert({
          collection_id: collectionId,
          word_variant_id: wordData.word_variant_id,
          user_id: user.id,
          status: 'new',
        });
        
      if (collectionWordError) {
        console.error('Error adding word to collection:', collectionWordError);
        toast.error("Failed to add word to collection. Please try again.");
        setIsAdding(false);
        return;
      }
      
      toast.success(`Added "${word.word}" to your library`);
      
    } catch (error) {
      console.error('Error adding word:', error);
      toast.error("Failed to add word to library");
    } finally {
      setIsAdding(false);
    }
  };

  // Function to get styling based on part of speech
  const getPartOfSpeechStyle = (pos?: string) => {
    if (!pos) return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    
    switch (pos.toLowerCase()) {
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
                {word.word}
              </DialogTitle>
              {word.phonetics && (
                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  /{word.phonetics}/
                </span>
              )}
              {word.part_of_speech && (
                <span className={cn(
                  "text-[11px] px-2 py-0.5 rounded-full font-medium transition-colors",
                  getPartOfSpeechStyle(word.part_of_speech)
                )}>
                  {word.part_of_speech}
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
                {(showFullDetails ? word.definitions : word.definitions.slice(0, 1)).map((definition, idx) => (
                  <div key={idx} className="group/def space-y-2">
                    <p className="text-gray-800 dark:text-gray-200 text-base">
                      {idx + 1}. {definition}
                    </p>
                    {word.examples && word.examples.length > idx && (
                      <div className="pl-6 border-l-2 border-[#cd4631]/30 group-hover/def:border-[#cd4631]
                                    transition-colors duration-300">
                        <p className="text-gray-600 dark:text-gray-400 italic text-sm">
                          {word.examples[idx]}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
                
                {!showFullDetails && word.definitions.length > 1 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                    + {word.definitions.length - 1} more definition{word.definitions.length > 2 ? 's' : ''}
                  </p>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-6" onClick={(e) => e.stopPropagation()}>
            {word.audio_url && (
              <Button 
                variant="secondary" 
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
                onClick={() => new Audio(word.audio_url).play()}
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
