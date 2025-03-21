
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Volume2, Star, ArrowUpRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface VocabularyWord {
  word: string;
  partOfSpeech: string;
  definition: string;
  example: string;
}

interface VocabularyResultsProps {
  results: VocabularyWord[];
  isVisible: boolean;
  onClose: () => void;
}

const VocabularyResults: React.FC<VocabularyResultsProps> = ({ results, isVisible, onClose }) => {
  if (!isVisible || results.length === 0) return null;

  return (
    <div className="mt-8 w-full max-w-4xl mx-auto page-transition-in">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Analysis Results</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-sm">
                Save to Library <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
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
                    <span className="text-[#cd4631] text-sm italic">{item.partOfSpeech}</span>
                  </div>
                  <div className="flex gap-2">
                    <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                      <Volume2 className="h-5 w-5" />
                    </button>
                    <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                      <Star className="h-5 w-5" />
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
