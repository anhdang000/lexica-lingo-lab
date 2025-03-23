import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Search,
  FileUp,
  Link as LinkIcon,
  Loader2,
  X,
  Type
} from 'lucide-react';

interface InputBoxProps {
  onAnalyze: (text: string) => Promise<void>;
  isAnalyzing: boolean;
}

const InputBox: React.FC<InputBoxProps> = ({ onAnalyze, isAnalyzing }) => {
  const [inputValue, setInputValue] = useState('');
  const [inputType, setInputType] = useState<'text' | 'url' | 'image'>('text');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(24); // Initial large font size
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const calculateFontSize = (text: string) => {
    const lines = text.split('\n').length;
    const length = text.length;

    if (lines >= 4) return 18; // Normal size after 4 lines
    if (length === 0) return 24; // Default large size
    if (length < 50) return 24;
    if (length < 100) return 20;
    if (length < 200) return 18;
    return 16;
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      const lines = inputValue.split('\n').length;
      textarea.style.height = 'auto';
      if (lines < 4) {
        textarea.style.height = Math.max(150, textarea.scrollHeight) + 'px';
      } else {
        textarea.style.height = '150px'; // Fixed height after 4 lines
      }
    }
  };

  useEffect(() => {
    const newFontSize = calculateFontSize(inputValue);
    setFontSize(newFontSize);
    adjustTextareaHeight();
  }, [inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
      setInputType('image');
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const clearImage = () => {
    setFileName(null);
    setInputType('text');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!inputValue && !fileName) return;

    if (inputType === 'text' && inputValue) {
      await onAnalyze(inputValue.trim());
    }
  };

  const selectInputType = (type: 'text' | 'url' | 'image') => {
    setInputType(type);
    if (type !== 'image' && fileName) {
      clearImage();
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

  return (
    <div className="w-full max-w-4xl mx-auto animate-slide-in-up">
      <div
        className={cn(
          "relative rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all focus-within:ring-1 focus-within:ring-[#cd4631] focus-within:border-[#cd4631]"
        )}
      >
        {/* Tabs */}
        <div className="flex p-3 gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-full text-sm px-4 transition-all",
              inputType === 'text'
                ? "bg-[#dea47e]/20 text-[#9e6240] hover:bg-[#dea47e]/30 dark:bg-[#dea47e]/10 dark:text-[#dea47e]"
                : ""
            )}
            onClick={() => selectInputType('text')}
          >
            <Type className="w-3.5 h-3.5 mr-1.5" />
            Text
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-full text-sm px-4 transition-all",
              inputType === 'image'
                ? "bg-[#f8f2dc]/60 text-[#9e6240] hover:bg-[#f8f2dc]/80 dark:bg-[#f8f2dc]/20 dark:text-[#dea47e]"
                : ""
            )}
            onClick={() => selectInputType('image')}
          >
            <FileUp className="w-3.5 h-3.5 mr-1.5" />
            Image
          </Button>
        </div>

        {/* Content */}
        <div className="px-4 pb-4">
          {inputType !== 'image' && (
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Paste text, URLs, or type vocabulary you want to learn..."
              className="min-h-[150px] bg-transparent border-none shadow-none p-2 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-200"
              style={{ fontSize: `${fontSize}px`, lineHeight: '1.5' }}
            />
          )}

          {inputType === 'image' && (
            <div
              className="min-h-[150px] flex flex-col items-center justify-center p-5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700 transition-all hover:border-[#cd4631] dark:hover:border-[#dea47e] cursor-pointer mt-3"
              onClick={triggerFileInput}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              {!fileName ? (
                <>
                  <FileUp className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-center text-sm">
                    Click to upload or drag and drop<br />
                    <span className="text-xs text-gray-400 dark:text-gray-500">Supports PNG, JPG, GIF files</span>
                  </p>
                </>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="flex items-center mb-2">
                    <span className="text-md font-medium text-[#9e6240] dark:text-[#dea47e]">{fileName}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="ml-2 h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearImage();
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Click to replace</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Analyze button */}
        <div className="flex justify-center pb-5">
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || (!inputValue && !fileName)}
            className="bg-gradient-to-r from-[#cd4631] to-[#dea47e] hover:from-[#cd4631]/90 hover:to-[#dea47e]/90 text-white rounded-full px-6 py-2 text-sm font-medium h-auto flex items-center transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {isAnalyzing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Search className="mr-2 h-4 w-4" />
            )}
            Analyze Vocabulary
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InputBox;
