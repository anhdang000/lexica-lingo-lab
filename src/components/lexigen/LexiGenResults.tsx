import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Volume2, Plus, ArrowUpRight, X, Check, Tag, Loader2, Sparkles, RefreshCw, Settings, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn, generateVocabularyFromTopic } from '@/lib/utils';
import type { WordDefinition } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { getOrCreateCollection, addWordToCollection } from '@/lib/database';
import { useAppState } from '@/contexts/AppStateContext';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen, MessageCircle, Briefcase, GraduationCap, Plane, Feather, Gauge, BadgePlus, BadgeCheck, Award, Layers } from 'lucide-react';

// Import TuningOptions type that's already defined in LexiGenInputBox
import { TuningOptions } from './LexiGenInputBox';

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
  const { setVocabularyResults, setTopicResults, setShowResults, lexigenInputValue } = useAppState();
  const [addedWords, setAddedWords] = useState<Set<number>>(new Set());
  const [allSaved, setAllSaved] = useState(false);
  const [expandedWords, setExpandedWords] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [visuallyVisible, setVisuallyVisible] = useState(false);
  
  // New states for tuning options in results view
  const [showTuningOptionsInResults, setShowTuningOptionsInResults] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [tuningOptions, setTuningOptions] = useState<TuningOptions>({
    level: 'auto',
    useCase: 'general',
    partsOfSpeech: ['noun', 'verb', 'adjective', 'adverb'],
  });

  // Define theme specific to LexiGen - same as in LexiGenInputBox
  const theme = {
    gradient: "from-[#6366f1] to-[#a855f7]",
    hoverGradient: "from-[#6366f1]/90 to-[#a855f7]/90",
    ring: "ring-[#6366f1] border-[#6366f1]",
    iconColor: "text-[#6366f1]",
    borderColor: "border-[#6366f1]"
  };
  
  // Parts of speech options - same as in LexiGenInputBox
  const partsOfSpeechOptions = [
    { id: 'noun', label: 'noun' },
    { id: 'verb', label: 'verb' },
    { id: 'adjective', label: 'adjective' },
    { id: 'adverb', label: 'adverb' },
  ];

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
  
  // Add effect to manage loading indicator styles for the Re-gen button
  useEffect(() => {
    // Create and append style element for loading indicators
    const style = document.createElement('style');
    style.textContent = `
      .loading-indicator-regen {
        display: none !important;
      }
      
      .normal-indicator-regen {
        display: inline-flex !important;
      }
      
      .is-loading-regen .loading-indicator-regen {
        display: inline-flex !important;
      }
      
      .is-loading-regen .normal-indicator-regen {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    // Cleanup function to remove the style when component unmounts
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Add effect to manage loading state for the Re-gen button
  useEffect(() => {
    const button = document.querySelector("[data-loading-button-regen]");
    if (button) {
      if (isRegenerating) {
        button.classList.add("is-loading-regen");
      } else {
        button.classList.remove("is-loading-regen");
      }
    }
    
    return () => {
      const button = document.querySelector("[data-loading-button-regen]");
      if (button) {
        button.classList.remove("is-loading-regen");
      }
    };
  }, [isRegenerating]);

  // Function to handle regenerating vocabulary with the current tuning options
  const handleRegenerate = async () => {
    if (!lexigenInputValue.trim()) {
      toast.error('No topic available to regenerate vocabulary');
      return;
    }
    
    setIsRegenerating(true);
    const toastId = toast.loading(`Regenerating vocabulary for "${topicName}"...`);
    
    try {
      // Generate vocabulary based on the original topic with new tuning options
      const results = await generateVocabularyFromTopic(lexigenInputValue, tuningOptions);
      
      // Update the results in the app state
      setVocabularyResults(results.vocabulary, 'lexigen');
      setTopicResults(results.topics, 'lexigen');
      
      // Pass the topic name to the context state
      setShowResults(true, 'lexigen', results.topicName);
      
      // Show success toast
      toast.success(`Regenerated vocabulary for "${results.topicName || topicName}"`, {
        id: toastId,
        duration: 3000
      });
    } catch (error) {
      console.error("Error regenerating vocabulary:", error);
      toast.error("Failed to regenerate vocabulary", {
        id: toastId,
        duration: 3000
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  if (!isVisible || results.length === 0) return null;

  // Function to handle clicking on a topic and generating new vocabulary
  const handleGenerateVocabulary = async (topic: string) => {
    // Show a toast notification that we're generating vocabulary
    const toastId = toast.loading(`Generating vocabulary for "${topic}"...`);
    
    try {
      // Generate vocabulary based on the topic
      const results = await generateVocabularyFromTopic(topic);
      
      // Update the results in the app state
      setVocabularyResults(results.vocabulary, 'lexigen');
      setTopicResults(results.topics, 'lexigen');
      
      // Pass the topic name from API response
      setShowResults(true, results.topicName || topic);
      
      // Show success toast
      toast.success(`Generated vocabulary for "${topic}"`, {
        id: toastId,
        duration: 3000
      });
    } catch (error) {
      console.error('Error generating vocabulary from topic:', error);
      toast.error('Failed to generate vocabulary', {
        id: toastId,
        duration: 3000
      });
    }
  };

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
    // If definition is an object with examples property as string (new format)
    if (def && typeof def === 'object' && typeof def.examples === 'string') {
      return def.examples ? [def.examples] : [];
    }
    // If definition is an object with examples array (old format)
    if (def && typeof def === 'object' && Array.isArray(def.examples)) {
      return def.examples;
    }
    // No examples available
    return [];
  };

  // Function to render formatted definitions with {it} tags
  const renderFormattedDefinition = (definition: string) => {
    if (!definition) return null;

    // Process {it} tags
    const italicizedParts: {start: number, end: number, text: string}[] = [];
    const itRegex = /\{it\}(.*?)\{\/it\}/g;
    let processedText = definition;
    let itMatch;
    
    while ((itMatch = itRegex.exec(definition)) !== null) {
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
    
    // If no formatting needed, return the plain text
    if (italicizedParts.length === 0) {
      return definition;
    }
    
    // Build the elements
    const parts: JSX.Element[] = [];
    let lastPos = 0;
    
    italicizedParts.forEach((part, index) => {
      // Add regular text before this italicized part
      if (part.start > lastPos) {
        const textBefore = processedText.substring(lastPos, part.start);
        parts.push(<span key={`text-${lastPos}`}>{textBefore}</span>);
      }
      
      // Add the italicized text
      parts.push(
        <span key={`it-${part.start}`} className="font-bold text-[#6366f1] dark:text-[#a78bfa]">
          {part.text}
        </span>
      );
      
      lastPos = part.end;
    });
    
    // Add any remaining text after the last italicized part
    if (lastPos < processedText.length) {
      const textAfter = processedText.substring(lastPos).replace(/\{it\}|\{\/it\}/g, '');
      if (textAfter) {
        parts.push(<span key={`text-${lastPos}`}>{textAfter}</span>);
      }
    }
    
    return <>{parts}</>;
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
    if (!explanations.length) return [<span key={`plain-${Math.random()}`}>{text}</span>];
    
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
          <span key={`expl-${idx}`}>
            (<span className="italic text-gray-500">{expl.text}</span>)
          </span>
        );
        
        // Update the remaining text
        remainingText = segments.slice(1).join(expl.placeholder);
      }
    });
    
    // Add any remaining text
    if (remainingText) {
      parts.push(<span key={`remaining-${Math.random()}`}>{remainingText}</span>);
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
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Sliders className="h-4 w-4 mr-2 text-[#6366f1]" />
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tuning Options
                </h4>
              </div>
              <Button
                onClick={() => setShowTuningOptionsInResults(!showTuningOptionsInResults)}
                variant={showTuningOptionsInResults ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "text-gray-500 dark:text-gray-400",
                  "hover:bg-[#6366f1]/10 hover:text-[#6366f1]",
                  showTuningOptionsInResults && "bg-[#6366f1]/10 text-[#6366f1]"
                )}
              >
                {showTuningOptionsInResults ? "Hide Options" : "Show Options"}
              </Button>
            </div>
            
            {showTuningOptionsInResults && (
              <div className="animate-fade-in mb-4 border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* English Level */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Level</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'auto', label: 'Auto-detect', icon: <Gauge className="h-3.5 w-3.5 mr-1" />, color: 'blue' },
                        { id: 'beginner', label: 'Beginner', icon: <BadgePlus className="h-3.5 w-3.5 mr-1" />, color: 'green' },
                        { id: 'intermediate', label: 'Intermediate', icon: <BadgeCheck className="h-3.5 w-3.5 mr-1" />, color: 'amber' },
                        { id: 'advanced', label: 'Advanced', icon: <Award className="h-3.5 w-3.5 mr-1" />, color: 'purple' },
                        { id: 'all', label: 'All Levels', icon: <Layers className="h-3.5 w-3.5 mr-1" />, color: 'gray' }
                      ].map((level) => (
                        <Badge
                          key={level.id}
                          variant={tuningOptions.level === level.id ? "default" : "outline"}
                          className={cn(
                            "cursor-pointer transition-all flex items-center",
                            tuningOptions.level === level.id 
                              ? `bg-${level.color}-100 text-${level.color}-800 dark:bg-${level.color}-900 dark:text-${level.color}-200`
                              : "hover:bg-gray-100 dark:hover:bg-gray-700"
                          )}
                          onClick={() => setTuningOptions({...tuningOptions, level: level.id})}
                        >
                          {level.icon}
                          {level.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {/* Use Case */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Use Case</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'general', label: 'General', icon: <BookOpen className="h-3.5 w-3.5 mr-1" />, color: 'blue' },
                        { id: 'casual', label: 'Casual', icon: <MessageCircle className="h-3.5 w-3.5 mr-1" />, color: 'green' },
                        { id: 'professional', label: 'Professional', icon: <Briefcase className="h-3.5 w-3.5 mr-1" />, color: 'purple' },
                        { id: 'academic', label: 'Academic', icon: <GraduationCap className="h-3.5 w-3.5 mr-1" />, color: 'amber' },
                        { id: 'travel', label: 'Travel', icon: <Plane className="h-3.5 w-3.5 mr-1" />, color: 'cyan' },
                        { id: 'creative', label: 'Creative', icon: <Feather className="h-3.5 w-3.5 mr-1" />, color: 'rose' }
                      ].map((useCase) => (
                        <Badge
                          key={useCase.id}
                          variant={tuningOptions.useCase === useCase.id ? "default" : "outline"}
                          className={cn(
                            "cursor-pointer transition-all flex items-center",
                            tuningOptions.useCase === useCase.id 
                              ? `bg-${useCase.color}-100 text-${useCase.color}-800 dark:bg-${useCase.color}-900 dark:text-${useCase.color}-200`
                              : "hover:bg-gray-100 dark:hover:bg-gray-700"
                          )}
                          onClick={() => setTuningOptions({...tuningOptions, useCase: useCase.id})}
                        >
                          {useCase.icon}
                          {useCase.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  {/* Parts of Speech */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Parts of Speech</Label>
                    <div className="flex flex-wrap gap-2">
                      {partsOfSpeechOptions.map((part) => (
                        <Badge
                          key={part.id}
                          variant={tuningOptions.partsOfSpeech.includes(part.id) ? "default" : "outline"}
                          className={cn(
                            "cursor-pointer transition-all",
                            tuningOptions.partsOfSpeech.includes(part.id) 
                              ? getPartOfSpeechStyle(part.id)
                              : "hover:bg-gray-100 dark:hover:bg-gray-700"
                          )}
                          onClick={() => {
                            if (tuningOptions.partsOfSpeech.includes(part.id)) {
                              setTuningOptions({
                                ...tuningOptions, 
                                partsOfSpeech: tuningOptions.partsOfSpeech.filter(pos => pos !== part.id)
                              });
                            } else {
                              setTuningOptions({
                                ...tuningOptions, 
                                partsOfSpeech: [...tuningOptions.partsOfSpeech, part.id]
                              });
                            }
                          }}
                        >
                          {part.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between mt-4">
                  <Button
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setTuningOptions({
                        level: 'auto',
                        useCase: 'general',
                        partsOfSpeech: ['noun', 'verb', 'adjective', 'adverb'],
                      });
                    }}
                    className="text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Reset to Defaults
                  </Button>
                  
                  {/* Re-gen button */}
                  <Button
                    onClick={handleRegenerate}
                    disabled={isRegenerating}
                    className={cn(
                      `bg-gradient-to-r ${theme.gradient} hover:${theme.hoverGradient}`,
                      "text-white rounded-full px-6 py-2 text-sm font-medium h-auto flex items-center transition-all duration-200 shadow-sm hover:shadow-md",
                      isRegenerating ? "is-loading-regen" : ""
                    )}
                    data-loading-button-regen
                  >
                    <>
                      <Loader2 className="loading-indicator-regen mr-2 h-4 w-4 animate-spin" />
                      <RefreshCw className="normal-indicator-regen mr-2 h-4 w-4" />
                    </>
                    <span className="inline-block align-middle -mt-1">Re-<span className="font-['Pacifico'] text-lg">gen</span>!</span>
                  </Button>
                </div>
              </div>
            )}
            
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4"></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">
              <span className="text-[#6366f1] dark:text-[#a78bfa]">{topicName || 'Generated Vocabulary'}</span>
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
                  <button
                    key={index}
                    onClick={() => {
                      // Show a toast notification
                      toast.info(`Generating vocabulary for "${topic}"...`);
                      
                      // Generate vocabulary based on the topic
                      handleGenerateVocabulary(topic);
                    }}
                    className="px-3 py-1.5 text-sm bg-[#6366f1]/10 dark:bg-[#6366f1]/20
                            text-[#6366f1] dark:text-[#a78bfa] rounded-full
                            hover:bg-[#6366f1]/20 dark:hover:bg-[#6366f1]/30
                            transition-colors duration-200 cursor-pointer"
                  >
                    {topic}
                  </button>
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
                            {renderFormattedDefinition(getDefinitionText(item.definitions[0]))}
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
                              {renderFormattedDefinition(getDefinitionText(def))}
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