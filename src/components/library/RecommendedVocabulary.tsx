
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

// Mock recommended vocabulary
const mockRecommendations = [
  { id: '1', word: 'Equity', definition: 'The value of the shares issued by a company', related: 'Business' },
  { id: '2', word: 'Amortization', definition: 'The process of gradually writing off the initial cost of an asset', related: 'Business' },
  { id: '3', word: 'Quantum Computing', definition: 'Computing using quantum phenomena to perform operations on data', related: 'Technology' },
  { id: '4', word: 'Prognosis', definition: 'A forecast of the likely outcome of a situation', related: 'Medicine' },
];

interface RecommendedVocabularyProps {
  onAddToLibrary: (word: string) => void;
}

const RecommendedVocabulary: React.FC<RecommendedVocabularyProps> = ({ onAddToLibrary }) => {
  return (
    <div className="grid grid-cols-1 gap-3">
      {mockRecommendations.map(item => (
        <div 
          key={item.id}
          className="border border-cream rounded-lg p-3 hover:border-tan-300 dark:hover:border-tan-800 transition-colors bg-white/50 dark:bg-brown-900/50 shadow-sm"
        >
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium text-brown-800 dark:text-cream">{item.word}</h4>
              <p className="text-sm text-muted-foreground mt-0.5">{item.definition}</p>
              <div className="mt-1.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-cream text-brown-800 dark:bg-brown-800 dark:text-cream">
                  {item.related}
                </span>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0 rounded-full hover:bg-tan-100 dark:hover:bg-tan-900/50" 
              onClick={() => onAddToLibrary(item.word)}
            >
              <Plus className="h-4 w-4 text-rust-500" />
              <span className="sr-only">Add</span>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecommendedVocabulary;
