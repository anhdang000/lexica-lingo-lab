import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Loader2, Sparkles, Sliders, Settings, Check, RefreshCw, BookOpen, MessageCircle, Briefcase, GraduationCap, Plane, Feather, Gauge, BadgePlus, BadgeCheck, Award, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useAppState } from '@/contexts/AppStateContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the tuning options structure
export interface TuningOptions {
  level: string;
  useCase: string;
  partsOfSpeech: string[];
}

interface LexiGenInputBoxProps {
  onAnalyze: (text: string, tuningOptions?: TuningOptions) => Promise<void>;
  isAnalyzing: boolean;
  activeTuningOptions?: TuningOptions | null;
  setActiveTuningOptions?: (options: TuningOptions | null) => void;
}

const LexiGenInputBox: React.FC<LexiGenInputBoxProps> = ({ 
  onAnalyze, 
  isAnalyzing,
  activeTuningOptions,
  setActiveTuningOptions
}) => {
  const { lexigenInputValue, setLexigenInputValue, showTuningOptions, setShowTuningOptions } = useAppState();
  const [fontSize, setFontSize] = useState(24);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [localIsAnalyzing, setLocalIsAnalyzing] = useState(false);

  // Combine both loading states
  const isLoadingState = isAnalyzing || localIsAnalyzing;

  // Theme specific to LexiGen
  const theme = {
    gradient: "from-[#6366f1] to-[#a855f7]",
    hoverGradient: "from-[#6366f1]/90 to-[#a855f7]/90",
    ring: "ring-[#6366f1] border-[#6366f1]",
    iconColor: "text-[#6366f1]",
    borderColor: "border-[#6366f1]"
  };

  const [tuningOptions, setTuningOptions] = useState<TuningOptions>(() => {
    return activeTuningOptions || {
      level: 'auto',
      useCase: 'general',
      partsOfSpeech: ['noun', 'verb', 'adjective', 'adverb'],
    };
  });

  const partsOfSpeechOptions = [
    { id: 'noun', label: 'noun' },
    { id: 'verb', label: 'verb' },
    { id: 'adjective', label: 'adjective' },
    { id: 'adverb', label: 'adverb' },
  ];

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

  const calculateFontSize = (text: string) => {
    const lines = text.split('\n').length;

    if (lines >= 2) return 28;
    if (lines === 1) return 30;
    if (lines === 0) return 30;
    return 20;
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = '90px'; // Reduced from 150px to 80px
    }
  };

  useEffect(() => {
    const newFontSize = calculateFontSize(lexigenInputValue);
    setFontSize(newFontSize);
    adjustTextareaHeight();
  }, [lexigenInputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setLexigenInputValue(newValue);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        return;
      }
      e.preventDefault();
      handleAnalyze();
    }
  };

  const handleAnalyze = async () => {
    if (!lexigenInputValue.trim()) {
      toast.error('Please enter a topic');
      return;
    }
    
    // Set local loading state immediately when the button is clicked
    setLocalIsAnalyzing(true);
    
    try {
      // Pass tuning options to parent component
      await onAnalyze(lexigenInputValue, tuningOptions);
    } catch (error) {
      console.error("Error in LexiGen analysis:", error);
      toast.error("Failed to generate vocabulary.");
    } finally {
      // Clear the local loading state
      setLocalIsAnalyzing(false);
    }
  };

  // Add effect to manage loading indicator styles
  useEffect(() => {
    // Create and append style element for loading indicators
    const style = document.createElement('style');
    style.textContent = `
      .loading-indicator {
        display: none !important;
      }
      
      .normal-indicator {
        display: inline-flex !important;
      }
      
      .is-loading .loading-indicator {
        display: inline-flex !important;
      }
      
      .is-loading .normal-indicator {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    // Cleanup function to remove the style when component unmounts
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Add effect to manage loading state
  useEffect(() => {
    const button = document.querySelector("[data-loading-button]");
    if (button) {
      if (isLoadingState) {
        button.classList.add("is-loading");
      } else {
        button.classList.remove("is-loading");
      }
    }
    
    // Cleanup function to ensure loading state is removed when component unmounts
    return () => {
      const button = document.querySelector("[data-loading-button]");
      if (button) {
        button.classList.remove("is-loading");
      }
    };
  }, [isLoadingState]);

  return (
    <div className="w-full max-w-4xl mx-auto animate-slide-in-up">
      <div className={cn(
        "relative rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 z-[1]",
        `focus-within:ring-1 focus-within:ring-opacity-100 focus-within:${theme.ring}`
      )}>
        {/* Mode indicator - top bar (subtle) */}
        <div className={cn(
          "absolute top-0 left-0 right-0 h-[3px] opacity-75 z-10",
          `bg-gradient-to-r ${theme.gradient}`
        )} />
        <div className="p-4 relative">
          <Textarea
            ref={textareaRef}
            value={lexigenInputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter a topic or theme to generate relevant vocabulary..."
            className={cn(
              "min-h-[80px] bg-transparent border-none shadow-none p-2 resize-none transition-all duration-200", // Changed min-h-[150px] to min-h-[80px]
              `placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:placeholder:${theme.iconColor}`,
              "placeholder:transition-opacity placeholder:duration-300"
            )}
            style={{ 
              fontSize: `${fontSize}px`, 
              lineHeight: '1.5',
              outlineWidth: '0px',
              outline: 'none',
              boxShadow: 'none'
            }}
          />
        </div>

        {/* Bottom action bar */}
        <div className="flex justify-between items-center p-4">
          {/* Left side - Tuning options button */}
          <div>
            <Button
              onClick={() => setShowTuningOptions?.(!(showTuningOptions || false))}
              variant={showTuningOptions ? "default" : "ghost"}
              size="sm"
              className={cn(
                "text-gray-500 dark:text-gray-400",
                "hover:bg-[#81ADC8] hover:text-white dark:hover:bg-[#81ADC8] dark:hover:text-white",
                showTuningOptions && `bg-gradient-to-r from-blue-500 to-purple-500 text-white`
              )}
              disabled={isLoadingState}
            >
              <Sliders className="h-4 w-4 mr-2" />
              <span>Tuning Options</span>
            </Button>
          </div>

          {/* Right side - Generate button */}
          <Button
            onClick={handleAnalyze}
            disabled={isLoadingState || !lexigenInputValue.trim()}
            className={cn(
              `bg-gradient-to-r ${theme.gradient} hover:${theme.hoverGradient}`,
              "text-white rounded-full px-6 py-2 text-sm font-medium h-auto flex items-center transition-all duration-200 shadow-sm hover:shadow-md",
              isLoadingState ? "is-loading" : ""
            )}
            data-loading-button
          >
            <>
              <Loader2 className="loading-indicator mr-2 h-4 w-4 animate-spin" />
              <Sparkles className="normal-indicator mr-2 h-4 w-4" />
            </>
            <span className="inline-block align-middle -mt-1">Let's <span className="font-['Pacifico'] text-lg">gen</span>!</span>
          </Button>
        </div>
        
        {/* Tuning Options Panel */}
        {showTuningOptions && (
          <div className="border-t border-gray-100 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50 animate-slide-down">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <Settings className="h-4 w-4 mr-2 text-[#6366f1]" />
                Vocabulary Generation Preferences
              </h3>
              <Badge variant="outline" className="px-2 py-1 bg-[#6366f1]/10 dark:bg-[#6366f1]/20 text-[#6366f1] dark:text-[#a855f7] border-[#6366f1]/20 dark:border-[#6366f1]/30">
                <Check className="h-3 w-3 mr-1" /> Custom tuning
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* English Level */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Level</Label>
                <Select 
                  value={tuningOptions.level} 
                  onValueChange={(value) => setTuningOptions({...tuningOptions, level: value})}
                >
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">
                      <div className="flex items-center">
                        <Gauge className="h-4 w-4 mr-2 text-blue-500" />
                        <span>Auto-detect</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="beginner">
                      <div className="flex items-center">
                        <BadgePlus className="h-4 w-4 mr-2 text-green-500" />
                        <span>Beginner (A1-A2)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="intermediate">
                      <div className="flex items-center">
                        <BadgeCheck className="h-4 w-4 mr-2 text-amber-500" />
                        <span>Intermediate (B1-B2)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="advanced">
                      <div className="flex items-center">
                        <Award className="h-4 w-4 mr-2 text-purple-500" />
                        <span>Advanced (C1-C2)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="all">
                      <div className="flex items-center">
                        <Layers className="h-4 w-4 mr-2 text-gray-500" />
                        <span>All Levels</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 dark:text-gray-400">Generate vocabulary suitable for this proficiency level</p>
              </div>
              
              {/* Use Case */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Use Case</Label>
                <Select 
                  value={tuningOptions.useCase} 
                  onValueChange={(value) => setTuningOptions({...tuningOptions, useCase: value})}
                >
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder="Select use case" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-2 text-blue-500" />
                        <span>General Vocabulary</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="casual">
                      <div className="flex items-center">
                        <MessageCircle className="h-4 w-4 mr-2 text-green-500" />
                        <span>Casual Conversation</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="professional">
                      <div className="flex items-center">
                        <Briefcase className="h-4 w-4 mr-2 text-purple-500" />
                        <span>Professional & Business</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="academic">
                      <div className="flex items-center">
                        <GraduationCap className="h-4 w-4 mr-2 text-amber-500" />
                        <span>Academic & Educational</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="creative">
                      <div className="flex items-center">
                        <Feather className="h-4 w-4 mr-2 text-rose-500" />
                        <span>Creative Writing</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 dark:text-gray-400">Vocabulary tailored to specific contexts</p>
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
                <p className="text-xs text-gray-500 dark:text-gray-400">Select parts of speech to focus on when generating vocabulary</p>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
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
                className="text-xs mr-2"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Reset to Defaults
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LexiGenInputBox;