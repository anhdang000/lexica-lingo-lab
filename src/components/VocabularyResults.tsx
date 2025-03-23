import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Volume2, Plus, ArrowUpRight, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { lookupWord, type WordDefinition as DetailedWordInfo } from '@/lib/utils';
import { cn } from '@/lib/utils';

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
  const [allSaved, setAllSaved] = useState(false);
  const [expandedWords, setExpandedWords] = useState<Set<number>>(new Set());
  const [detailedInfoMap, setDetailedInfoMap] = useState<Map<number, DetailedWordInfo>>(new Map());
  const [loadingWords, setLoadingWords] = useState<Set<number>>(new Set());
  
  if (!isVisible || results.length === 0) return null;

  const handleAddWord = (index: number, word: string) => {
    toast.success(`Added "${word}" to library`);
    setAddedWords(prev => new Set(prev).add(index));
  };

  const handleSaveAll = () => {
    if (allSaved) return;
    
    const newAddedWords = new Set<number>();
    results.forEach((_, index) => newAddedWords.add(index));
    setAddedWords(newAddedWords);
    setAllSaved(true);
    toast.success(`Added all ${results.length} words to library`);
  };

  const handleDetailClick = async (index: number, word: string) => {
    if (expandedWords.has(index)) {
      setExpandedWords(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
      return;
    }

    // Add to expanded set immediately for smooth UI
    setExpandedWords(prev => new Set(prev).add(index));

    if (!detailedInfoMap.has(index)) {
      setLoadingWords(prev => new Set(prev).add(index));
      try {
        const wordInfo = await lookupWord(word);
        if (wordInfo) {
          setDetailedInfoMap(prev => new Map(prev).set(index, wordInfo));
        }
      } catch (error) {
        toast.error('Failed to load word details');
        console.error('Error fetching word details:', error);
        // Remove from expanded if failed
        setExpandedWords(prev => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
      } finally {
        setLoadingWords(prev => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
      }
    }
  };

  const playAudio = (audioUrl?: string) => {
    if (audioUrl) {
      new Audio(audioUrl).play().catch(error => {
        console.error('Error playing audio:', error);
        toast.error('Failed to play pronunciation');
      });
    }
  };

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
              <Button 
                variant={allSaved ? "secondary" : "outline"} 
                size="sm" 
                onClick={handleSaveAll}
                disabled={allSaved}
                className={`text-sm text-black ${
                  allSaved
                    ? 'bg-[#81adc8] hover:bg-[#81adc8]'
                    : 'hover:bg-[#81adc8]'
                }`}
              >
                {allSaved ? "Added to Library" : "Add to Library"}{" "}
                {allSaved ? <Check className="ml-2 h-3.5 w-3.5" /> : <ArrowUpRight className="ml-2 h-3.5 w-3.5" />}
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
            {results.map((item, index) => {
              const isExpanded = expandedWords.has(index);
              const isLoading = loadingWords.has(index);
              const detailedInfo = detailedInfoMap.get(index);
              const hasAudio = detailedInfo?.pronunciation?.audio;

              return (
                <div 
                  key={index} 
                  className={cn(
                    "bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 transition-all duration-300",
                    isExpanded && "ring-2 ring-purple-500/20"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-bold">{item.word}</h4>
                      {item.phonetic && !detailedInfo?.pronunciation?.text && (
                        <span className="text-gray-400 text-sm italic">{item.phonetic}</span>
                      )}
                      {detailedInfo?.pronunciation?.text && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-sm italic">
                            /{detailedInfo.pronunciation.text}/
                          </span>
                          {hasAudio && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => playAudio(detailedInfo.pronunciation?.audio)}
                            >
                              <Volume2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-md ${getPartOfSpeechStyle(item.partOfSpeech)}`}>
                        {item.partOfSpeech}
                      </span>
                    </div>
                    <div className="flex gap-2">
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
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500 dark:text-gray-400 italic">"{item.example}"</p>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDetailClick(index, item.word)}
                      className={cn(
                        "text-base font-bold text-[#b36736] hover:text-[#b36736] hover:bg-[#b36736]/10",
                        isExpanded && "bg-[#b36736]/10"
                      )}
                    >
                      {isExpanded ? "Collapse" : "Detail"}
                    </Button>
                  </div>

                  {/* Expanded detail section */}
                  <div className={cn(
                    "grid grid-rows-[0fr] transition-all duration-300",
                    isExpanded && "grid-rows-[1fr] mt-4"
                  )}>
                    <div className="overflow-hidden">
                      {isExpanded && (
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                          {isLoading ? (
                            <div className="flex justify-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#b36736]" />
                            </div>
                          ) : detailedInfo && (
                            <div className="space-y-4">
                              {/* Definitions section */}
                              <div className="space-y-3">
                                {detailedInfo.definitions.map((def, idx) => (
                                  <div key={idx} className="space-y-2">
                                    <p className="text-gray-700 dark:text-gray-200">
                                      {idx + 1}. {def.meaning}
                                    </p>
                                    {def.examples && def.examples.length > 0 && (
                                      <ul className="list-disc list-inside space-y-1 pl-4">
                                        {def.examples.map((example, exIdx) => (
                                          <li key={exIdx} className="text-sm text-gray-500 dark:text-gray-400">
                                            {example}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {/* Word variations section */}
                              {detailedInfo.stems && detailedInfo.stems.length > 0 && (
                                <div className="pt-3">
                                  <h5 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                    Word Forms & Phrases:
                                  </h5>
                                  <div className="flex flex-wrap gap-2">
                                    {detailedInfo.stems.map((stem, idx) => (
                                      <span
                                        key={idx}
                                        className="px-2 py-1 text-sm bg-purple-50 dark:bg-purple-900/20 
                                                 text-purple-600 dark:text-purple-400 rounded-md"
                                      >
                                        {stem}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VocabularyResults;
