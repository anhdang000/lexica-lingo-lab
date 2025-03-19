
import React, { useState, useRef } from 'react';
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

const InputBox: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [inputType, setInputType] = useState<'text' | 'url' | 'image'>('text');
  const [fileName, setFileName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

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

  const handleAnalyze = () => {
    if (!inputValue && !fileName) return;
    
    setIsLoading(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      navigate('/analysis');
      setIsLoading(false);
    }, 1500);
  };

  const selectInputType = (type: 'text' | 'url' | 'image') => {
    setInputType(type);
    if (type !== 'image' && fileName) {
      clearImage();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-slide-in-up">
      <div className="relative rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Tabs for input type */}
        <div className="flex p-3 gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-full text-sm px-4 transition-all",
              inputType === 'text' ? "bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300" : ""
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
              inputType === 'url' ? "bg-cyan-50 text-cyan-600 hover:bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-300" : ""
            )}
            onClick={() => selectInputType('url')}
          >
            <LinkIcon className="w-3.5 h-3.5 mr-1.5" />
            URL
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              "rounded-full text-sm px-4 transition-all",
              inputType === 'image' ? "bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300" : ""
            )}
            onClick={() => selectInputType('image')}
          >
            <FileUp className="w-3.5 h-3.5 mr-1.5" />
            Image
          </Button>
        </div>
        
        {/* Content area */}
        <div className="px-4 pb-4">
          {inputType !== 'image' && (
            <Textarea
              value={inputValue}
              onChange={handleInputChange}
              placeholder={
                inputType === 'text' 
                  ? "Paste text, or type vocabulary you want to learn..." 
                  : "Enter a URL to analyze content..."
              }
              className="min-h-[150px] text-md bg-transparent border-none shadow-none p-2 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          )}
          
          {inputType === 'image' && (
            <div 
              className="min-h-[150px] flex flex-col items-center justify-center p-5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700 transition-all hover:border-amber-300 dark:hover:border-amber-500 cursor-pointer mt-3"
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
                    <span className="text-md font-medium text-amber-600 dark:text-amber-400">
                      {fileName}
                    </span>
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
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Click to replace
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Analyze button */}
        <div className="flex justify-center pb-5">
          <Button
            onClick={handleAnalyze}
            disabled={isLoading || (!inputValue && !fileName)}
            className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white rounded-full px-6 py-2 text-sm font-medium h-auto flex items-center transition-all duration-200 shadow-sm hover:shadow-md"
          >
            {isLoading ? (
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
