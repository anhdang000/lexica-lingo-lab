import React from 'react';
import { Volume2, Star } from 'lucide-react';

interface VocabularyItemProps {
  item: {
    word: string;
    phonetics?: string;
    part_of_speech?: string;
    definitions: string[];
    examples?: string[];
  };
}

const VocabularyItem: React.FC<VocabularyItemProps> = ({ item }) => {
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
    <div className="bg-gray-50 rounded-xl p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-lg font-bold">{item.word}</h4>
          {item.phonetics && (
            <span className="text-gray-400 text-sm italic">{item.phonetics}</span>
          )}
          {item.part_of_speech && (
            <span className={`text-xs px-2 py-0.5 rounded-md ${getPartOfSpeechStyle(item.part_of_speech)}`}>
              {item.part_of_speech}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600">
            <Volume2 className="h-5 w-5" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600">
            <Star className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Display definitions as a list if there are multiple */}
      {item.definitions.length === 1 ? (
        <p className="text-gray-600 mb-2">{item.definitions[0]}</p>
      ) : (
        <div className="mb-2">
          <p className="text-gray-600 font-medium mb-1">Definitions:</p>
          <ul className="list-disc pl-5">
            {item.definitions.map((def, index) => (
              <li key={index} className="text-gray-600">{def}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Display examples if available */}
      {item.examples && item.examples.length > 0 && (
        item.examples.length === 1 ? (
          <p className="text-sm text-gray-500 italic">"{item.examples[0]}"</p>
        ) : (
          <div>
            <p className="text-gray-600 font-medium mb-1">Examples:</p>
            <ul className="list-disc pl-5">
              {item.examples.map((example, index) => (
                <li key={index} className="text-sm text-gray-500 italic">"{example}"</li>
              ))}
            </ul>
          </div>
        )
      )}
    </div>
  );
};

export default VocabularyItem;
