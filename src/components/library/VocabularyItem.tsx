
import React from 'react';
import { Volume2, Star } from 'lucide-react';

interface VocabularyItemProps {
  item: {
    word: string;
    definition: string;
    example: string;
  };
}

const VocabularyItem: React.FC<VocabularyItemProps> = ({ item }) => {
  return (
    <div className="bg-gray-50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-lg font-bold">{item.word}</h4>
        <div className="flex gap-2">
          <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600">
            <Volume2 className="h-5 w-5" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600">
            <Star className="h-5 w-5" />
          </button>
        </div>
      </div>
      <p className="text-gray-600 mb-2">{item.definition}</p>
      <p className="text-sm text-gray-500 italic">"{item.example}"</p>
    </div>
  );
};

export default VocabularyItem;
