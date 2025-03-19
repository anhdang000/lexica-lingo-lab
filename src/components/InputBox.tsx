
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
      <div className="relative p-1 rounded-3xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500">
        <div className="glass dark:glass-dark rounded-2xl p-6 md:p-8">
          <div className="flex gap-2 mb-4">
            <Button
              type="button"
              variant={inputType === 'text' ? 'default' : 'outline'}
              className={cn("rounded-full", 
                inputType === 'text' ? "bg-amber-500 text-white hover:bg-amber-600" : ""
              )}
              onClick={() => selectInputType('text')}
            >
              <Type className="w-4 h-4 mr-2" />
              Text
            </Button>
            <Button
              type="button"
              variant={inputType === 'url' ? 'default' : 'outline'}
              className={cn("rounded-full",
                inputType === 'url' ? "bg-cyan-500 text-white hover:bg-cyan-600" : ""
              )}
              onClick={() => selectInputType('url')}
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              URL
            </Button>
            <Button
              type="button"
              variant={inputType === 'image' ? 'default' : 'outline'}
              className={cn("rounded-full",
                inputType === 'image' ? "bg-purple-500 text-white hover:bg-purple-600" : ""
              )}
              onClick={() => selectInputType('image')}
            >
              <FileUp className="w-4 h-4 mr-2" />
              Image
            </Button>
          </div>
          
          <div className="relative">
            {inputType !== 'image' && (
              <Textarea
                value={inputValue}
                onChange={handleInputChange}
                placeholder={
                  inputType === 'text' 
                    ? "Paste text, or type vocabulary you want to learn..." 
                    : "Enter a URL to analyze content..."
                }
                className="min-h-[180px] text-lg p-6 bg-white dark:bg-gray-900 border-none rounded-xl shadow-sm focus:ring-2 focus:ring-amber-300 dark:focus:ring-amber-600 resize-none"
              />
            )}
            
            {inputType === 'image' && (
              <div 
                className="min-h-[180px] flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border-2 border-dashed border-gray-300 dark:border-gray-700 transition-all hover:border-amber-400 dark:hover:border-amber-500 cursor-pointer"
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
                    <FileUp className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-center">
                      Click to upload or drag and drop<br />
                      <span className="text-sm">Supports PNG, JPG, GIF files</span>
                    </p>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="flex items-center mb-2">
                      <span className="text-lg font-medium text-amber-600 dark:text-amber-400">
                        {fileName}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="ml-2 h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearImage();
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Click to replace
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-center">
            <Button
              onClick={handleAnalyze}
              disabled={isLoading || (!inputValue && !fileName)}
              className="bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 rounded-full px-8 py-6 text-lg font-medium h-auto flex items-center shadow-md hover:shadow-lg transition-all duration-300"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Search className="mr-2 h-5 w-5" />
              )}
              Analyze Vocabulary
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputBox;
