import React, { useState, useRef, KeyboardEvent, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import {
  Search,
  FileUp,
  Link as LinkIcon,
  Loader2,
  X,
  Type,
  Sparkles,
  GripHorizontal
} from 'lucide-react';

interface InputBoxProps {
  onAnalyze: (text: string, tool: 'lexigrab' | 'lexigen') => Promise<void>;
  isAnalyzing: boolean;
}

const InputBox: React.FC<InputBoxProps> = ({ onAnalyze, isAnalyzing }) => {
  const [inputValue, setInputValue] = useState('');
  const [activeTool, setActiveTool] = useState<'lexigrab' | 'lexigen'>('lexigrab');
  const [fontSize, setFontSize] = useState(24);
  const [recognizedUrls, setRecognizedUrls] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [images, setImages] = useState<Array<{ id: string; preview: string }>>([]);

  const calculateFontSize = (text: string) => {
    const lines = text.split('\n').length;
    const length = text.length;

    if (lines >= 5) return 18; // Normal size after 4 lines
    if (lines === 4) return 20;
    if (lines === 3) return 24;
    if (lines === 2) return 28;
    if (lines === 1) return 30;
    if (lines === 0) return 30; // Default large size// Default large size
    return 16;
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Set a fixed height regardless of content length
      textarea.style.height = '150px';
    }
  };

  useEffect(() => {
    const newFontSize = calculateFontSize(inputValue);
    setFontSize(newFontSize);
    adjustTextareaHeight();
  }, [inputValue]);

  const extractUrls = (text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setRecognizedUrls(extractUrls(newValue));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(file => {
        if (file.type.startsWith('image/')) {
          handleFileSelection(file);
        }
      });
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAnalyze = async () => {
    if (!inputValue && images.length === 0) return;

    if (inputValue) {
      await onAnalyze(inputValue.trim(), activeTool);
    }
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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files) {
      Array.from(e.dataTransfer.files).forEach(file => {
        if (file.type.startsWith('image/')) {
          handleFileSelection(file);
        }
      });
    }
  };

  const handleFileSelection = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const newImage = {
        id: Math.random().toString(36).substring(7),
        preview: e.target?.result as string
      };
      setImages(prev => [...prev, newImage]);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (idToRemove: string) => {
    setImages(prev => prev.filter(img => img.id !== idToRemove));
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    items.forEach(item => {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) handleFileSelection(file);
      }
    });
  };

  const removeUrl = (urlToRemove: string) => {
    setRecognizedUrls(prev => prev.filter(url => url !== urlToRemove));
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-slide-in-up">
      {/* Tool Selection Tabs */}
      <div className="flex justify-center mb-4 relative z-[2]">
        <div className="inline-flex space-x-1 bg-white/10 backdrop-blur-sm p-1 rounded-lg">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant={activeTool === 'lexigrab' ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    "relative px-6 min-w-[140px] transition-all",
                    activeTool === 'lexigrab' 
                      ? "bg-gradient-to-r from-[#cd4631] to-[#dea47e] text-white shadow-md" 
                      : "hover:bg-white/10"
                  )}
                  onClick={() => setActiveTool('lexigrab')}
                >
                  <div className="flex items-center space-x-2">
                    <GripHorizontal className="w-4 h-4" />
                    <span className="font-medium">LexiGrab</span>
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[300px] p-4">
                <p>Instantly capture and save new vocabulary from any source 🚀</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant={activeTool === 'lexigen' ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    "relative px-6 min-w-[140px] transition-all",
                    activeTool === 'lexigen'
                      ? "bg-gradient-to-r from-[#cd4631] to-[#dea47e] text-white shadow-md"
                      : "hover:bg-white/10"
                  )}
                  onClick={() => setActiveTool('lexigen')}
                >
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-medium">LexiGen</span>
                  </div>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[300px] p-4">
                <p>Generate fresh vocabulary from any topic ✨</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div className="relative rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all focus-within:ring-1 focus-within:ring-[#cd4631] focus-within:border-[#cd4631] z-[1]">
        <div 
          className={cn(
            "p-4 relative",
            dragActive ? "bg-gray-50 dark:bg-gray-700/50" : ""
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {recognizedUrls.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 p-2 border-b border-gray-100 dark:border-gray-700">
              {recognizedUrls.map((url, index) => (
                <div
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700/50 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors group"
                >
                  <LinkIcon className="w-3 h-3 mr-2" />
                  <span className="truncate max-w-[200px]">{url}</span>
                  <button
                    onClick={() => removeUrl(url)}
                    className="ml-2 p-0.5 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    aria-label="Remove this source"
                    title="Remove this source"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTool === 'lexigrab' ? (
            <>
              <div className="flex flex-col gap-4">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder="Paste text, drop an image, or enter a URL to extract vocabulary..."
                  className="min-h-[150px] bg-transparent border-none shadow-none p-2 resize-none transition-all duration-200"
                  style={{ 
                    fontSize: `${fontSize}px`, 
                    lineHeight: '1.5',
                    outlineWidth: '0px',
                    outline: 'none',
                    boxShadow: 'none'
                  }}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                {images.length > 0 && (
                  <div className="relative mt-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex flex-wrap gap-4">
                      {images.map((img) => (
                        <div key={img.id} className="relative w-24 h-24 overflow-hidden rounded-lg">
                          <img 
                            src={img.preview} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1 right-1 bg-black/30 hover:bg-black/50 text-white rounded-full w-6 h-6 p-1"
                            onClick={() => removeImage(img.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {dragActive && (
                  <div className="absolute inset-0 bg-gray-100/80 dark:bg-gray-700/80 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <div className="text-center">
                      <FileUp className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">Drop your images here</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Enter a topic or theme to generate relevant vocabulary..."
              className="min-h-[150px] bg-transparent border-none shadow-none p-2 resize-none transition-all duration-200"
              style={{ 
                fontSize: `${fontSize}px`, 
                lineHeight: '1.5',
                outlineWidth: '0px',
                outline: 'none',
                boxShadow: 'none'
              }}
            />
          )}
        </div>

        {/* Bottom action bar */}
        <div className="flex justify-between items-center p-4">
          {/* Left side - Attach button */}
          <Button
            onClick={triggerFileInput}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <FileUp className="h-4 w-4 mr-2" />
            <span>Attach</span>
          </Button>

          {/* Right side - Analyze button */}
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || (!inputValue && images.length === 0)}
            className="bg-gradient-to-r from-[#cd4631] to-[#dea47e] hover:from-[#cd4631]/90 hover:to-[#dea47e]/90 text-white rounded-full px-6 py-2 text-sm font-medium h-auto flex items-center transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {isAnalyzing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            {activeTool === 'lexigrab' ? 'Extract Vocabulary' : 'Generate Vocabulary'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InputBox;
