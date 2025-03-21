import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Volume2, Plus, ArrowUpRight, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export interface VocabularyWord {
  word: string;
  partOfSpeech: string;
  phonetic?: string;
  definition: string;
  example: string;
}

interface VocabularyResultsProps {
  results: VocabularyWord[];
  isVisible: boolean;
  onClose: () => void;
}

const VocabularyResults: React.FC<VocabularyResultsProps> = ({ results, isVisible, onClose }) => {
  const [addedWords, setAddedWords] = useState<Set<number>>(new Set());
  
  if (!isVisible || results.length === 0) return null;

  const handleAddWord = (index: number, word: string) => {
    toast.success(`Added "${word}" to library`);
    setAddedWords(prev => new Set(prev).add(index));
  };

  // Function to get styling based on part of speech
  const getPartOfSpeechStyle = (pos: string) => {
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
    <div className="mt-8 w-full max-w-4xl mx-auto page-transition-in">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Analysis Results</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-sm">
                Save all to Library <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full hover:bg-[#cd4631]/10 text-gray-500 hover:text-[#cd4631]"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 mb-6">
            Found {results.length} words that might enhance your vocabulary.
          </p>
          
          <div className="space-y-4">
            {results.map((item, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg font-bold">{item.word}</h4>
                    {item.phonetic && (
                      <span className="text-gray-400 text-sm italic">{item.phonetic}</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-md ${getPartOfSpeechStyle(item.partOfSpeech)}`}>
                      {item.partOfSpeech}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                      <Volume2 className="h-5 w-5" />
                    </button>
                    <button 
                      className={`w-8 h-8 flex items-center justify-center transition-colors ${
                        addedWords.has(index) 
                          ? 'text-green-500 hover:text-green-600' 
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                      onClick={() => handleAddWord(index, item.word)}
                      disabled={addedWords.has(index)}
                    >
                      {addedWords.has(index) ? <Check className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-2">{item.definition}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">"{item.example}"</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VocabularyResults;
