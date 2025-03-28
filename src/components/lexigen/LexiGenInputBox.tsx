import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface LexiGenInputBoxProps {
  onAnalyze: (text: string) => Promise<void>;
  isAnalyzing: boolean;
}

const LexiGenInputBox: React.FC<LexiGenInputBoxProps> = ({ onAnalyze, isAnalyzing }) => {
  const [inputValue, setInputValue] = useState('');
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

  const calculateFontSize = (text: string) => {
    const lines = text.split('\n').length;
    const length = text.length;

    if (lines >= 5) return 18; 
    if (lines === 4) return 20;
    if (lines === 3) return 24;
    if (lines === 2) return 28;
    if (lines === 1) return 30;
    if (lines === 0) return 30;
    return 16;
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = '150px';
    }
  };

  useEffect(() => {
    const newFontSize = calculateFontSize(inputValue);
    setFontSize(newFontSize);
    adjustTextareaHeight();
  }, [inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
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
    if (!inputValue.trim()) {
      toast.error('Please enter a topic');
      return;
    }
    
    // Set local loading state immediately when the button is clicked
    setLocalIsAnalyzing(true);
    
    try {
      await onAnalyze(inputValue);
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
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Enter a topic or theme to generate relevant vocabulary..."
            className={cn(
              "min-h-[150px] bg-transparent border-none shadow-none p-2 resize-none transition-all duration-200",
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
        <div className="flex justify-end items-center p-4">
          {/* Right side - Generate button */}
          <Button
            onClick={handleAnalyze}
            disabled={isLoadingState || !inputValue.trim()}
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
            <span>Let's <span className="font-['Pacifico'] text-lg">gen</span>!</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LexiGenInputBox;