import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Volume2, Plus, ArrowUpRight, X, Check, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { WordDefinition } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { getOrCreateCollection, addWordToCollection } from '@/lib/database';

interface LexiGenResultsProps {
  results: WordDefinition[];
  topics: string[];
  isVisible: boolean;
  onClose: () => void;
  isSingleWordOrPhrases: boolean;
  topicName: string;
}

const LexiGenResults: React.FC<LexiGenResultsProps> = ({
  results,
  topics = [],
  isVisible,
  onClose,
  isSingleWordOrPhrases,
  topicName = 'Vocabulary Collection'
}) => {
  const { user } = useAuth();
  const [addedWords, setAddedWords] = useState<Set<number>>(new Set());
  const [allSaved, setAllSaved] = useState(false);
  const [expandedWords, setExpandedWords] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [visuallyVisible, setVisuallyVisible] = useState(false);

  // Handle animation and visibility
  useEffect(() => {
    if (isVisible) {
      // Show immediately when results are ready
      setVisuallyVisible(true);
    } else {
      // Add a small delay before hiding to allow exit animation
      const timer = setTimeout(() => {
        setVisuallyVisible(false);
      }, 300); // Match this with your CSS transition duration
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  useEffect(() => {
    setExpandedWords(new Set(results.length === 1 ? [0] : []));
    setAddedWords(new Set());
    setAllSaved(false);
  }, [results, isVisible]);

  if (!isVisible || results.length === 0) return null;

  // Helper function to get definition text based on definition format
  const getDefinitionText = (def: any): string => {
    // If definition is an object with meaning property (old format)
    if (def && typeof def === 'object' && def.meaning) {
      return def.meaning;
    }
    // If definition is a string (new format)
    if (typeof def === 'string') {
      return def;
    }
    // Fallback
    return 'No definition available';
  };

  // Helper function to get examples based on definition format
  const getExamples = (def: any): string[] => {
    // If definition is an object with examples array (old format)
    if (def && typeof def === 'object' && Array.isArray(def.examples)) {
      return def.examples;
    }
    // No examples available
    return [];
  };

  // Function to render formatted examples with {it} tags and [=...] explanations
  const renderFormattedExample = (example: string) => {
    if (!example) return null;

    // Pre-process the text to handle special cases
    // First, let's extract all [=...] explanations and replace them with placeholders
    const explanationPlaceholders: {placeholder: string, text: string}[] = [];
    let processedText = example.replace(/\[=([^\]]+)\]/g, (match, explanation) => {
      // Clean any {it} tags inside the explanation
      const cleanExplanation = explanation.replace(/\{it\}|\{\/it\}/g, '');
      const placeholder = `__EXPL_${explanationPlaceholders.length}__`;
      explanationPlaceholders.push({placeholder, text: cleanExplanation});
      return placeholder;
    });

    // Now process the {it} tags
    const italicizedParts: {start: number, end: number, text: string}[] = [];
    const itRegex = /\{it\}(.*?)\{\/it\}/g;
    let itMatch;
    while ((itMatch = itRegex.exec(processedText)) !== null) {
      const fullMatch = itMatch[0];
      const innerText = itMatch[1];
      const startPos = itMatch.index;
      const endPos = startPos + fullMatch.length;
      
      italicizedParts.push({
        start: startPos,
        end: endPos,
        text: innerText
      });
    }
    
    // Now build the elements
    const parts: JSX.Element[] = [];
    let lastPos = 0;
    
    italicizedParts.forEach((part, index) => {
      // Add regular text before this italicized part
      if (part.start > lastPos) {
        const textBefore = processedText.substring(lastPos, part.start);
        // Process any explanation placeholders in this segment
        const processedBefore = processExplanationPlaceholders(textBefore, explanationPlaceholders);
        if (processedBefore.length > 0) {
          parts.push(...processedBefore);
        }
      }
      
      // Add the italicized text
      parts.push(
        <span key={`it-${part.start}`} className="font-bold text-[#6366f1]">
          {part.text}
        </span>
      );
      
      lastPos = part.end;
    });
    
    // Add any remaining text after the last italicized part
    if (lastPos < processedText.length) {
      const textAfter = processedText.substring(lastPos);
      // Process any explanation placeholders in this segment
      const processedAfter = processExplanationPlaceholders(textAfter, explanationPlaceholders);
      if (processedAfter.length > 0) {
        parts.push(...processedAfter);
      }
    }
    
    return <>{parts}</>;
  };

  // Helper function to process explanation placeholders
  const processExplanationPlaceholders = (text: string, explanations: {placeholder: string, text: string}[]): JSX.Element[] => {
    if (!explanations.length) return [<span key="plain">{text}</span>];
    
    const parts: JSX.Element[] = [];
    let remainingText = text;
    
    explanations.forEach((expl, idx) => {
      const segments = remainingText.split(expl.placeholder);
      if (segments.length > 1) {
        // Add the text before the placeholder
        if (segments[0]) {
          parts.push(<span key={`before-${idx}`}>{segments[0]}</span>);
        }
        
        // Add the explanation in italic
        parts.push(
          <span key={`expl-${idx}`} className="italic text-gray-500">
            ({expl.text})
          </span>
        );
        
        // Update the remaining text
        remainingText = segments.slice(1).join(expl.placeholder);
      }
    });
    
    // Add any remaining text
    if (remainingText) {
      parts.push(<span key="remaining">{remainingText}</span>);
    }
    
    return parts;
  };

  const handleAddWord = async (index: number, wordData: WordDefinition) => {
    if (!user) {
      toast.error("Please log in to save words to your library");
      return;
    }

    if (addedWords.has(index)) return;

    setIsProcessing(true);
    try {
      // For LexiGen, use the topic name as collection name
      const collection = await getOrCreateCollection(user.id, topicName);
      const displayName = topicName;
      toast.info(`Adding to "${displayName}" collection`);
      
      const success = await addWordToCollection(user.id, wordData, collection.id);

      if (success) {
        toast.success(`Added "${wordData.word}" to library`);
        setAddedWords(prev => new Set(prev).add(index));
      } else {
        toast.error(`Failed to add "${wordData.word}" to library`);
      }
    } catch (error) {
      console.error('Error adding word:', error);
      toast.error("Failed to add word to library");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveAll = async () => {
    if (!user) {
      toast.error("Please log in to save words to your library");
      return;
    }

    if (allSaved || isProcessing) return;

    setIsProcessing(true);
    try {
      // For LexiGen, use the topic name as collection name
      const collection = await getOrCreateCollection(user.id, topicName);
      const displayName = topicName;
      toast.info(`Adding to "${displayName}" collection`);
      
      const newAddedWords = new Set<number>();
      for (let i = 0; i < results.length; i++) {
        if (!addedWords.has(i)) {
          const success = await addWordToCollection(user.id, results[i], collection.id);
          if (success) {
            newAddedWords.add(i);
          }
        }
      }

      setAddedWords(prev => new Set([...prev, ...newAddedWords]));
      setAllSaved(true);
      toast.success(`Added ${newAddedWords.size} words to library`);
    } catch (error) {
      console.error('Error adding all words:', error);
      toast.error("Failed to add all words to library");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDetailClick = (index: number) => {
    setExpandedWords((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const playAudio = (audioUrl?: string) => {
    if (audioUrl) {
      new Audio(audioUrl).play().catch((error) => {
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
    <div className={cn(
      "mt-8 w-full max-w-4xl mx-auto transition-all duration-300 ease-in-out",
      visuallyVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    )}>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">
              {topicName ? `Topic: ${topicName}` : 'Generated Vocabulary'}
            </h3>
            <div className="flex gap-2">
              <Button
                variant={allSaved ? 'secondary' : 'outline'}
                size="sm"
                onClick={handleSaveAll}
                disabled={allSaved || isProcessing}
                className={cn(
                  'text-sm text-black',
                  allSaved ? 'bg-[#81adc8] hover:bg-[#81adc8]' : 'hover:bg-[#81adc8]'
                )}
              >
                {allSaved ? 'Added to Library' : 'Add to Library'}{' '}
                {allSaved ? (
                  <Check className="ml-2 h-3.5 w-3.5" />
                ) : (
                  <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-[#6366f1]/10 text-gray-500 hover:text-[#6366f1]"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {topics.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-4 w-4 text-[#6366f1]" />
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Related Topics:
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {topics.map((topic, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 text-sm bg-[#6366f1]/10 dark:bg-[#6366f1]/20
                            text-[#6366f1] dark:text-[#a78bfa] rounded-full
                            hover:bg-[#6366f1]/20 dark:hover:bg-[#6366f1]/30
                            transition-colors duration-200"
                  >
                    {topic}
                  </span>
                ))}
              </div>
              <div className="mt-6 border-t border-gray-100 dark:border-gray-800 pt-6"></div>
            </div>
          )}

          {results.length > 1 && (
            <p className="text-base text-gray-500 mb-6">
              Generated {results.length} words related to your topic.
            </p>
          )}

          <div className="space-y-6">
            {results.map((item, index) => {
                  const isExpanded = expandedWords.has(index);
                  const hasAudio = item.pronunciation?.audio;

                  return (
                    <div
                      key={index}
                      className={cn(
                        'collection-card relative group rounded-xl p-6',
                        'border',
                        isExpanded 
                          ? 'border-[#6366f1]/90 shadow-xl' 
                          : 'border-gray-200 dark:border-gray-700',
                        'backdrop-blur-sm bg-white/30 dark:bg-gray-800/30',
                        'cursor-pointer',
                        'transition-all duration-300 ease-in-out'
                      )}
                      onClick={() => handleDetailClick(index)}
                    >
                      <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h4 className="text-xl font-bold text-[#6366f1] dark:text-[#a78bfa]">
                                {item.word}
                              </h4>
                              {item.pronunciation?.text && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                    /{item.pronunciation.text}/
                                  </span>
                                  {hasAudio && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 hover:text-[#6366f1] hover:bg-[#6366f1]/10"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        playAudio(item.pronunciation?.audio);
                                      }}
                                    >
                                      <Volume2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              )}
                              <span
                                className={cn(
                                  'text-[11px] px-2 py-0.5 rounded-full font-medium transition-colors',
                                  getPartOfSpeechStyle(item.partOfSpeech)
                                )}
                              >
                                {item.partOfSpeech}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {/* Add to Library Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-full hover:bg-[#6366f1]/10 hover:text-[#6366f1]"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddWord(index, item);
                                }}
                                disabled={addedWords.has(index) || isProcessing}
                              >
                                {addedWords.has(index) ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Plus className="h-4 w-4" />
                                )}
                              </Button>
                              
                              {/* Expand/Collapse Button */}
                              <button 
                                className="text-[#6366f1] transition-transform duration-300 ease-in-out"
                                aria-label={isExpanded ? "Collapse" : "Expand"}
                              >
                                <svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  width="24" 
                                  height="24" 
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="2" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round"
                                  className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
                                >
                                  <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                              </button>
                            </div>
                          </div>

                      {/* First definition - always visible when collapsed */}
                      {!isExpanded && item.definitions.length > 0 && (
                        <div className="group/def space-y-2">
                          <p className="text-gray-800 dark:text-gray-200 text-base">
                            {getDefinitionText(item.definitions[0])}
                          </p>
                          {getExamples(item.definitions[0]).length > 0 && (
                            <div
                              className="pl-6 border-l-2 border-[#6366f1]/30 group-hover/def:border-[#6366f1]
                                        transition-colors duration-300"
                            >
                              <p className="text-gray-600 dark:text-gray-400 text-sm">
                                {renderFormattedExample(getExamples(item.definitions[0])[0])}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Show indication of more definitions in compact mode */}
                      {!isExpanded && item.definitions.length > 1 && (
                        <p className="text-xs text-gray-500 mt-3 pl-4 border-l-2 border-gray-200">
                          + {item.definitions.length - 1} more definition
                          {item.definitions.length > 2 ? 's' : ''}
                        </p>
                      )}

                      {/* All definitions - with smooth animation */}
                      <div
                        className={cn(
                          'mt-4 space-y-4',
                          'overflow-hidden transition-all duration-500 ease-in-out',
                          isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                        )}
                      >
                        {item.definitions.map((def, idx) => (
                          <div key={idx} className="group/def space-y-2">
                            <p className="text-gray-800 dark:text-gray-200 text-base">
                              {item.definitions.length > 1 ? `${idx + 1}. ` : ''}
                              {getDefinitionText(def)}
                            </p>
                            {getExamples(def).length > 0 && (
                              <div
                                className="pl-6 border-l-2 border-[#6366f1]/30 group-hover/def:border-[#6366f1]
                                          transition-colors duration-300"
                              >
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                  {renderFormattedExample(getExamples(def)[0])}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Word Forms & Phrases section - with smooth animation */}
                      <div
                        className={cn(
                          'mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50',
                          'overflow-hidden transition-all duration-500 ease-in-out',
                          isExpanded ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0 border-t-0'
                        )}
                      >
                        {item.stems && item.stems.length > 0 && (
                          <>
                            <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">
                              Word Forms & Phrases:
                            </h5>
                            <div className="flex flex-wrap gap-2">
                              {item.stems.map((stem, idx) => (
                                <span
                                  key={idx}
                                  className="px-2.5 py-1 text-xs bg-[#6366f1]/10 dark:bg-[#6366f1]/20
                                           text-[#6366f1] dark:text-[#a78bfa] rounded-full
                                           hover:bg-[#6366f1]/20 dark:hover:bg-[#6366f1]/30
                                           transition-colors duration-200"
                                >
                                  {stem}
                                </span>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="absolute bottom-2 right-4 text-xs text-gray-400 dark:text-gray-500 transition-opacity duration-200 group-hover:opacity-100 opacity-50">
                        Click to {isExpanded ? 'hide' : 'view'} details
                      </div>
                    </div>
                  );
                })}
          </div>
        </CardContent>
      </Card>

      {/* Hover and click effect styles */}
      <style>{`
        .collection-card {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .collection-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 12px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default LexiGenResults;