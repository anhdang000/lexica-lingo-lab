import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';
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
  GripHorizontal,
  RefreshCw,
  FileText,
  File
} from 'lucide-react';
import { FileInput, fetchUrlContent, AnalysisResults, analyzeVocabulary } from '@/lib/utils';
import { toast } from 'sonner';

interface LexiGrabInputBoxProps {
  onAnalyze: (text: string, files: FileInput[], analysisResults?: AnalysisResults) => Promise<void>;
  isAnalyzing: boolean;
}

const LexiGrabInputBox: React.FC<LexiGrabInputBoxProps> = ({ onAnalyze, isAnalyzing }) => {
  const [inputValue, setInputValue] = useState('');
  const [fontSize, setFontSize] = useState(24);
  const [recognizedUrls, setRecognizedUrls] = useState<string[]>([]);
  const [isUrlFetching, setIsUrlFetching] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<Array<{ 
    id: string; 
    preview: string;
    file: File;
    fileType: 'image' | 'document';
    fileExtension?: string;
    isUploading: boolean;
    uploadError?: string;
  }>>([]);

  // Add local loading state
  const [localIsAnalyzing, setLocalIsAnalyzing] = useState(false);

  // Combine both loading states
  const isLoadingState = isAnalyzing || localIsAnalyzing || isUrlFetching;

  // Theme specific to LexiGrab
  const theme = {
    gradient: "from-[#cd4631] to-[#dea47e]",
    hoverGradient: "from-[#cd4631]/90 to-[#dea47e]/90",
    ring: "ring-[#cd4631] border-[#cd4631]",
    iconColor: "text-[#cd4631]",
    borderColor: "border-[#cd4631]"
  };

  // Acceptable file types
  const acceptableDocTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'text/html',
    'application/rtf',
    'application/vnd.oasis.opendocument.text'
  ];

  const isAcceptableFileType = (file: File): boolean => {
    return file.type.startsWith('image/') || acceptableDocTypes.includes(file.type);
  };

  const getFileType = (file: File): 'image' | 'document' => {
    return file.type.startsWith('image/') ? 'image' : 'document';
  };
  
  const getFileExtension = (file: File): string => {
    const nameParts = file.name.split('.');
    return nameParts.length > 1 ? nameParts[nameParts.length - 1].toLowerCase() : '';
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

  const extractUrls = (text: string): string[] => {
    const urlRegex = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/gi;
    
    const matches = text.match(urlRegex) || [];
    
    return matches.map(url => {
      if (url.startsWith('www.')) {
        return 'https://' + url;
      }
      return url;
    }).filter((url, index, self) => {
      return self.indexOf(url) === index;
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setRecognizedUrls(extractUrls(newValue));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      Array.from(e.target.files).forEach(file => {
        if (isAcceptableFileType(file)) {
          handleFileSelection(file);
        } else {
          toast.error(`File type not supported: ${file.name}`);
        }
      });
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelection = async (file: File) => {
    const reader = new FileReader();
    const id = Math.random().toString(36).substring(7);
    const fileType = getFileType(file);
    const fileExtension = getFileExtension(file);
    
    reader.onload = (e) => {
      setFiles(prev => [...prev, {
        id,
        preview: fileType === 'image' ? (e.target?.result as string) : '',
        file,
        fileType,
        fileExtension,
        isUploading: false
      }]);
    };

    if (fileType === 'image') {
      reader.readAsDataURL(file);
    } else {
      // For non-image files, we don't need a preview data URL
      // Just trigger the onload event manually
      setTimeout(() => {
        const mockEvent = { target: { result: '' } } as unknown as ProgressEvent<FileReader>;
        reader.onload?.(mockEvent);
      }, 0);
    }
  };

  const handleAnalyze = async () => {
    if (!inputValue && files.length === 0 && recognizedUrls.length === 0) return;
    
    // Set local loading state immediately when the button is clicked
    setLocalIsAnalyzing(true);
    
    try {
      // First set loading state for files
      setFiles(prev => prev.map(file => ({
        ...file,
        isUploading: true,
        uploadError: undefined
      })));
      
      // Create FileInput objects from the files
      const fileInputs: FileInput[] = files.map(fileObj => ({
        file: fileObj.file,
        mimeType: fileObj.file.type
      }));
      
      // Variable to store aggregated text
      let aggregatedText = inputValue.trim();
      let urlContentSuccess = false;
      
      // Process URLs if present
      if (recognizedUrls.length > 0) {
        try {
          // Show loading state for URL processing
          setIsUrlFetching(true);
          toast.loading(`Fetching content from ${recognizedUrls.length} URLs...`, { id: 'url-fetching' });
          
          const urlContents = await Promise.allSettled(
            recognizedUrls.map(url => 
              fetchUrlContent(url, { render: 'html' })
                .then(content => ({ url, content, success: true }))
                .catch(error => {
                  console.error(`Error fetching content from ${url}:`, error);
                  return { url, content: '', success: false };
                })
            )
          );
          
          // Process results
          const successfulFetches = urlContents.filter(
            result => result.status === 'fulfilled' && result.value.success
          ) as PromiseFulfilledResult<{ url: string; content: string; success: boolean }>[];
          
          // Check if we're using metadata or direct content
          const usingMetadataOnly = successfulFetches.every(result => 
            result.value.content.includes('Direct content extraction failed due to CORS restrictions')
          );
          
          // Build the aggregated text
          if (successfulFetches.length > 0) {
            urlContentSuccess = true;
            const contentTexts = successfulFetches.map(result => {
              // Limit content size to prevent overwhelming the API
              let content = result.value.content;
              const maxContentLength = 5000; // Reasonable limit to prevent overwhelming the API
              if (content.length > maxContentLength) {
                content = content.slice(0, maxContentLength) + 
                  `... [Content truncated, original length: ${content.length} characters]`;
              }
              return `\n\nContent from ${result.value.url}:\n${content}`;
            });
            aggregatedText += '\n\n' + contentTexts.join('\n\n');
          }
          
          // Show appropriate feedback
          toast.dismiss('url-fetching');
          if (successfulFetches.length > 0) {
            const containsDirectContent = successfulFetches.some(result => 
              !result.value.content.includes('Direct content extraction failed due to CORS restrictions')
            );
            
            if (containsDirectContent) {
              toast.success(`Fetched content from ${successfulFetches.length} of ${recognizedUrls.length} URLs`);
            } else {
              toast.success(`Processed ${successfulFetches.length} URLs (metadata only)`);
            }
          } else if (recognizedUrls.length > 0) {
            toast.error('Could not extract content from any URLs');
          }
          
          // Update URL display to indicate metadata-only mode
          if (usingMetadataOnly && successfulFetches.length > 0) {
            toast.info('Using URL metadata only due to browser security restrictions', { duration: 5000 });
          }
          
          // List failed URLs
          const failedUrls = urlContents
            .filter(result => result.status !== 'fulfilled' || !result.value.success)
            .map(result => result.status === 'fulfilled' ? result.value.url : 'unknown');
          
          if (failedUrls.length > 0 && failedUrls.length < recognizedUrls.length) {
            toast.error(`Failed to fetch: ${failedUrls.join(', ')}`, { duration: 5000 });
          }
        } catch (error) {
          console.error('Error processing URLs:', error);
          toast.dismiss('url-fetching');
          toast.error('Failed to process URLs');
        } finally {
          setIsUrlFetching(false);
        }
      }
      
      // Mark file uploads as successful
      setFiles(prev => prev.map(file => ({
        ...file,
        isUploading: false
      })));
      
      // If no input text, no successful URL fetches, and no files, stop here
      if (!aggregatedText && !urlContentSuccess && files.length === 0) {
        toast.error('No content to analyze');
        setLocalIsAnalyzing(false);
        return;
      }
      
      try {
        // Only analyze in the component if we need the pre-analysis
        const analysisResults = await analyzeVocabulary(aggregatedText, fileInputs);
        
        // Call the parent's analyze function, which will handle the loading state
        await onAnalyze(aggregatedText, fileInputs, analysisResults);
      } catch (error) {
        console.error("Error in LexiGrabInputBox analysis:", error);
        toast.error("Failed to analyze vocabulary.");
        throw error; // Re-throw to be caught by outer catch
      }
    } catch (error) {
      console.error('Error during analysis:', error);
      
      // Mark all as failed
      setFiles(prev => prev.map(file => ({
        ...file,
        isUploading: false,
        uploadError: 'Failed to process'
      })));
      
      toast.error('Failed to process content for analysis');
    } finally {
      // Clear the local loading state
      setLocalIsAnalyzing(false);
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
        if (isAcceptableFileType(file)) {
          handleFileSelection(file);
        } else {
          toast.error(`File type not supported: ${file.name}`);
        }
      });
    }
  };

  const removeFile = (idToRemove: string) => {
    setFiles(prev => prev.filter(file => file.id !== idToRemove));
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    items.forEach(item => {
      const file = item.getAsFile();
      if (file && isAcceptableFileType(file)) {
        handleFileSelection(file);
      }
    });
  };

  const removeUrl = (urlToRemove: string) => {
    setRecognizedUrls(prev => prev.filter(url => url !== urlToRemove));
  };

  // Get appropriate file icon based on extension
  const getFileIcon = (fileExtension: string = '') => {
    switch(fileExtension.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-6 w-6 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-6 w-6 text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileText className="h-6 w-6 text-green-500" />;
      case 'ppt':
      case 'pptx':
        return <FileText className="h-6 w-6 text-orange-500" />;
      case 'txt':
        return <FileText className="h-6 w-6 text-gray-500" />;
      default:
        return <File className="h-6 w-6 text-gray-500" />;
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
              {isUrlFetching && (
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-sm text-blue-700 dark:text-blue-300">
                  <RefreshCw className="w-3 h-3 mr-2 animate-spin" />
                  <span>Fetching URLs...</span>
                </div>
              )}
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
                    disabled={isUrlFetching || isAnalyzing}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-4">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="Paste text, drop files (images, PDF, docx), or enter a URL to extract vocabulary..."
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
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.csv,.html"
              multiple
              className="hidden"
            />
            {files.length > 0 && (
              <div className="relative mt-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex flex-wrap gap-4">
                  {files.map((file) => (
                    <div key={file.id} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                      {file.fileType === 'image' ? (
                        <img 
                          src={file.preview} 
                          alt="Preview" 
                          className={cn(
                            "w-full h-full object-cover",
                            file.isUploading && "opacity-50"
                          )}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 p-2">
                          {getFileIcon(file.fileExtension)}
                          <span className="text-xs mt-1 text-center truncate w-full">
                            {file.file.name.length > 15 ? 
                              file.file.name.substring(0, 12) + '...' : 
                              file.file.name}
                          </span>
                        </div>
                      )}
                      {file.isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                          <Loader2 className="h-6 w-6 animate-spin text-white" />
                        </div>
                      )}
                      {file.uploadError && (
                        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="text-red-500 bg-white rounded-full p-1">
                                <X className="h-4 w-4" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{file.uploadError}</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 bg-black/30 hover:bg-black/50 text-white rounded-full w-6 h-6 p-1"
                        onClick={() => removeFile(file.id)}
                        disabled={file.isUploading}
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
                  <p className="mt-2 text-sm text-gray-500">Drop your files here</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="flex justify-between items-center p-4">
          {/* Left side - Attach button */}
          <Button
            onClick={triggerFileInput}
            variant="ghost"
            size="sm"
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            disabled={isAnalyzing || isUrlFetching}
          >
            <FileUp className="h-4 w-4 mr-2" />
            <span>Attach</span>
          </Button>

          {/* Right side - Analyze button */}
          <Button
            onClick={handleAnalyze}
            disabled={
              isLoadingState ||
              (!inputValue && files.length === 0 && recognizedUrls.length === 0) ||
              files.some(file => file.isUploading)
            }
            className={cn(
              `bg-gradient-to-r ${theme.gradient} hover:${theme.hoverGradient}`,
              "text-white rounded-full px-6 py-2 text-sm font-medium h-auto flex items-center transition-all duration-200 shadow-sm hover:shadow-md",
              isLoadingState ? "is-loading" : ""
            )}
            data-loading-button
          >
            <>
              <Loader2 className="loading-indicator mr-2 h-4 w-4 animate-spin" />
              <GripHorizontal className="normal-indicator mr-2 h-4 w-4" />
            </>
            <span>Let's <span className="font-['Pacifico'] text-lg">grab</span>!</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LexiGrabInputBox;