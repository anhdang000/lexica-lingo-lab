import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  File,
  Sliders,
  Settings,
  Check
} from 'lucide-react';
import { FileInput, fetchUrlContent, AnalysisResults, analyzeVocabulary } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Define the input source types
type InputSourceType = 'text' | 'file' | 'url';

// Define the tuning options structure
export interface TuningOptions {
  level: string;
  vocabularyFocus: string;
  frequency: string;
  partsOfSpeech: string[];
  sourceTypeHint: string;
}

// Define the structure for active files, mirroring AppStateContext
interface ActiveFile {
  id: string;
  preview: string;
  file: File;
  fileType: 'image' | 'document';
  fileExtension?: string;
  isUploading: boolean;
  uploadError?: string;
}

interface LexiGrabInputBoxProps {
  onAnalyze: (text: string, files: FileInput[], analysisResults?: AnalysisResults, tuningOptions?: TuningOptions) => Promise<void>;
  isAnalyzing: boolean;
  inputValue: string;
  setInputValue: (value: string) => void;
  activeFiles: ActiveFile[];
  setActiveFiles: (files: ActiveFile[] | ((prevFiles: ActiveFile[]) => ActiveFile[])) => void;
  recognizedUrls: string[];
  setRecognizedUrls: (urls: string[]) => void;
  activeTuningOptions?: TuningOptions | null; // Keep prop for initialization
  setActiveTuningOptions?: (options: TuningOptions | null) => void;
  showTuningOptions?: boolean;
  setShowTuningOptions?: (show: boolean) => void;
}

const LexiGrabInputBox: React.FC<LexiGrabInputBoxProps> = ({
  onAnalyze,
  isAnalyzing,
  inputValue,
  setInputValue,
  activeFiles,
  setActiveFiles,
  recognizedUrls,
  setRecognizedUrls,
  activeTuningOptions, // Use for initial state only
  setActiveTuningOptions,
  showTuningOptions,
  setShowTuningOptions
}) => {
  const [fontSize, setFontSize] = useState(24);
  const [isUrlFetching, setIsUrlFetching] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const [activeInputSource, setActiveInputSource] = useState<InputSourceType>('text');
  const [activeUrl, setActiveUrl] = useState<string>('');

  const [localIsAnalyzing, setLocalIsAnalyzing] = useState(false);

  const isLoadingState = isAnalyzing || localIsAnalyzing || isUrlFetching;

  const isAnyFileUploading = activeFiles.some(file => file.isUploading);

  const theme = {
    gradient: "from-[#cd4631] to-[#dea47e]",
    hoverGradient: "from-[#cd4631]/90 to-[#dea47e]/90",
    ring: "ring-[#cd4631] border-[#cd4631]",
    iconColor: "text-[#cd4631]",
    borderColor: "border-[#cd4631]"
  };

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

    if (newValue.trim() === '') {
      setRecognizedUrls([]);
    } else {
      const urls = extractUrls(newValue);
      setRecognizedUrls(urls);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setInputValue('');
      setRecognizedUrls([]);

      const filesArray = Array.from(e.target.files);
      filesArray.forEach(file => {
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
      setActiveFiles(prevFiles => [
        ...prevFiles,
        {
          id,
          preview: fileType === 'image' ? (e.target?.result as string) : '',
          file,
          fileType,
          fileExtension,
          isUploading: false
        }
      ]);
    };

    if (fileType === 'image') {
      reader.readAsDataURL(file);
    } else {
      setTimeout(() => {
        const mockEvent = { target: { result: '' } } as unknown as ProgressEvent<FileReader>;
        reader.onload?.(mockEvent);
      }, 0);
    }
  };

  const handleAnalyze = async () => {
    if (!inputValue && activeFiles.length === 0 && recognizedUrls.length === 0) return;

    setLocalIsAnalyzing(true);

    try {
      if (activeFiles.length > 0) {
        setActiveFiles(prevFiles =>
          prevFiles.map(file => ({
            ...file,
            isUploading: true,
            uploadError: undefined
          }))
        );
      }

      const fileInputs: FileInput[] = activeFiles.map(activeFile => ({
        file: activeFile.file,
        mimeType: activeFile.file.type
      }));

      let aggregatedText = inputValue.trim();
      let urlContentSuccess = false;

      if (recognizedUrls.length > 0) {
        try {
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

          const successfulFetches = urlContents.filter(
            result => result.status === 'fulfilled' && result.value.success
          ) as PromiseFulfilledResult<{ url: string; content: string; success: boolean }>[];

          const usingMetadataOnly = successfulFetches.every(result =>
            result.value.content.includes('Direct content extraction failed due to CORS restrictions')
          );

          if (successfulFetches.length > 0) {
            urlContentSuccess = true;
            const contentTexts = successfulFetches.map(result => {
              let content = result.value.content;
              const maxContentLength = 5000;
              if (content.length > maxContentLength) {
                content = content.slice(0, maxContentLength) +
                  `... [Content truncated, original length: ${content.length} characters]`;
              }
              return `\n\nContent from ${result.value.url}:\n${content}`;
            });
            aggregatedText += '\n\n' + contentTexts.join('\n\n');
          }

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

          if (usingMetadataOnly && successfulFetches.length > 0) {
            toast.info('Using URL metadata only due to browser security restrictions', { duration: 5000 });
          }

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

      if (activeFiles.length > 0) {
        setActiveFiles(prevFiles =>
          prevFiles.map(file => ({
            ...file,
            isUploading: false
          }))
        );
      }

      if (!aggregatedText && !urlContentSuccess && activeFiles.length === 0) {
        toast.error('No content to analyze');
        setLocalIsAnalyzing(false);
        return;
      }

      try {
        const currentTuningOptions = tuningOptions;
        const analysisResults = await analyzeVocabulary(aggregatedText, fileInputs, currentTuningOptions);

        // Pass tuning options to parent component for processing
        await onAnalyze(aggregatedText, fileInputs, analysisResults, currentTuningOptions);
      } catch (error) {
        console.error("Error in LexiGrabInputBox analysis:", error);
        toast.error("Failed to analyze vocabulary.");
        throw error;
      }
    } catch (error) {
      console.error('Error during analysis:', error);

      if (activeFiles.length > 0) {
        setActiveFiles(prevFiles =>
          prevFiles.map(file => ({
            ...file,
            isUploading: false,
            uploadError: 'Failed to process'
          }))
        );
      }

      toast.error('Failed to process content for analysis');
    } finally {
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
    if (e.type === "dragenter" || e.type === "dragleave" || e.type === "dragover") {
      setDragActive(e.type === "dragenter" || e.type === "dragover");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setInputValue('');
      setRecognizedUrls([]);

      const filesArray = Array.from(e.dataTransfer.files);
      filesArray.forEach(file => {
        if (isAcceptableFileType(file)) {
          handleFileSelection(file);
        } else {
          toast.error(`File type not supported: ${file.name}`);
        }
      });
    }
  };

  const removeFile = (idToRemove: string) => {
    setActiveFiles(prevFiles => prevFiles.filter(file => file.id !== idToRemove));
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    let fileFound = false;

    for (const item of items) {
      const file = item.getAsFile();
      if (file && isAcceptableFileType(file)) {
        if (!fileFound) {
          e.preventDefault();
          setInputValue('');
          setRecognizedUrls([]);
          fileFound = true;
        }
        handleFileSelection(file);
      }
    }
  };

  const removeUrl = (urlToRemove: string) => {
    setRecognizedUrls(recognizedUrls.filter(url => url !== urlToRemove));
  };

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

  useEffect(() => {
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

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    const button = document.querySelector("[data-loading-button]");
    if (button) {
      if (isLoadingState) {
        button.classList.add("is-loading");
      } else {
        button.classList.remove("is-loading");
      }
    }

    return () => {
      const button = document.querySelector("[data-loading-button]");
      if (button) {
        button.classList.remove("is-loading");
      }
    };
  }, [isLoadingState]);

  const [tuningOptions, setTuningOptions] = useState<TuningOptions>(() => {
    return activeTuningOptions || {
      level: 'auto',
      vocabularyFocus: 'general',
      frequency: 'medium',
      partsOfSpeech: ['noun', 'verb', 'adjective', 'adverb'],
      sourceTypeHint: 'auto',
    };
  });

  const partsOfSpeechOptions = [
    { id: 'noun', label: 'Nouns' },
    { id: 'verb', label: 'Verbs' },
    { id: 'adjective', label: 'Adjectives' },
    { id: 'adverb', label: 'Adverbs' },
    { id: 'pronoun', label: 'Pronouns' },
    { id: 'preposition', label: 'Prepositions' },
    { id: 'conjunction', label: 'Conjunctions' },
    { id: 'interjection', label: 'Interjections' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto animate-slide-in-up">
      <div className={cn(
        "relative rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 z-[1]",
        `focus-within:ring-1 focus-within:ring-opacity-100 focus-within:${theme.ring}`
      )}>
        <div className={cn(
          "absolute top-0 left-0 right-0 h-[3px] opacity-75 z-10",
          `bg-gradient-to-r ${theme.gradient}`
        )} />
        <div
          className={cn(
            "p-4 relative min-h-[180px]",
            dragActive ? "bg-gray-50 dark:bg-gray-700/50" : ""
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {activeFiles.length > 0 && (
            <div className="w-full h-full">
              <div className={cn(
                "flex flex-wrap gap-4 justify-center",
                activeFiles.length > 6 && "max-h-[400px] overflow-y-auto p-2"
              )}>
                {activeFiles.map(file => (
                  <div key={file.id} className="relative mb-2">
                    {file.fileType === 'image' ? (
                      <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm w-48 h-48">
                        <img
                          src={file.preview}
                          alt="Preview"
                          className={cn(
                            "w-full h-full object-cover",
                            file.isUploading && "opacity-50"
                          )}
                        />
                        {file.isUploading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <Loader2 className="h-8 w-8 animate-spin text-white" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-48 h-48 flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        {getFileIcon(file.fileExtension)}
                        <span className="text-xs mt-2 text-center font-medium text-gray-700 dark:text-gray-300 line-clamp-2 overflow-hidden">
                          {file.file.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {(file.file.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    )}

                    <Button
                      size="icon"
                      className="absolute -top-3 -right-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full shadow-md w-6 h-6 border border-gray-200 dark:border-gray-600 transition-all duration-200 hover:scale-110"
                      onClick={() => removeFile(file.id)}
                      disabled={file.isUploading || isLoadingState}
                    >
                      <X className="h-3 w-3 text-gray-700 dark:text-gray-300" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {activeFiles.length === 1
                    ? "1 file selected for vocabulary extraction"
                    : `${activeFiles.length} files selected for vocabulary extraction`
                  }
                </p>

                {activeFiles.length > 1 && (
                  <Button
                    onClick={() => setActiveFiles([])}
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 dark:text-gray-400 hover:text-red-500"
                    disabled={isLoadingState || isAnyFileUploading}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Remove all
                  </Button>
                )}
              </div>
            </div>
          )}

          {activeFiles.length === 0 && recognizedUrls.length > 0 && (
            <div className="w-full pt-2 pb-4">
              <div className="flex flex-wrap gap-2 mb-3">
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
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {recognizedUrls.length > 1
                  ? `${recognizedUrls.length} URLs detected for content extraction`
                  : "URL detected for content extraction"
                }
              </div>
            </div>
          )}

          {activeFiles.length === 0 && (
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
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.rtf,.csv,.html"
            className="hidden"
            multiple
          />

          {dragActive && (
            <div className="absolute inset-0 bg-gray-100/80 dark:bg-gray-700/80 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 z-20">
              <div className="text-center">
                <FileUp className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">Drop your file here</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center p-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={triggerFileInput}
                    variant={activeFiles.length > 0 ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300",
                      activeFiles.length > 0 && `bg-gradient-to-r ${theme.gradient} text-white`
                    )}
                    disabled={isLoadingState}
                  >
                    <FileUp className="h-4 w-4 mr-2" />
                    <span>Files</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Upload images or documents</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {(activeFiles.length > 0 || inputValue.trim() !== '' || recognizedUrls.length > 0) && (
              <Button
                onClick={() => {
                  setActiveFiles([]);
                  setInputValue('');
                  setRecognizedUrls([]);
                }}
                variant="ghost"
                size="sm"
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:bg-gray-300"
                disabled={isLoadingState}
              >
                <X className="h-4 w-4 mr-2" />
                <span>Clear</span>
              </Button>
            )}
            
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

          <Button
            onClick={handleAnalyze}
            disabled={
              isLoadingState ||
              (!inputValue && activeFiles.length === 0 && recognizedUrls.length === 0) ||
              isAnyFileUploading
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
        
        {/* Tuning Options Panel */}
        {showTuningOptions && (
          <div className="border-t border-gray-100 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50 animate-slide-down">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                <Settings className="h-4 w-4 mr-2 text-blue-500" />
                Vocabulary Extraction Preferences
              </h3>
              <Badge variant="outline" className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                <Check className="h-3 w-3 mr-1" /> Custom tuning
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* English Level */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">English Level</Label>
                <Select 
                  value={tuningOptions.level} 
                  onValueChange={(value) => setTuningOptions({...tuningOptions, level: value})}
                >
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-detect</SelectItem>
                    <SelectItem value="beginner">Beginner (A1-A2)</SelectItem>
                    <SelectItem value="intermediate">Intermediate (B1-B2)</SelectItem>
                    <SelectItem value="advanced">Advanced (C1-C2)</SelectItem>
                    <SelectItem value="all">All Levels</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 dark:text-gray-400">Target vocabulary suitable for this proficiency level</p>
              </div>
              
              {/* Vocabulary Focus */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Objective</Label>
                <Select 
                  value={tuningOptions.vocabularyFocus} 
                  onValueChange={(value) => setTuningOptions({...tuningOptions, vocabularyFocus: value})}
                >
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder="Select focus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Vocabulary</SelectItem>
                    <SelectItem value="academic">Academic</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="technical">Technical Terminology</SelectItem>
                    <SelectItem value="spoken">Conversational</SelectItem>
                    <SelectItem value="idioms">Idioms & Expressions</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 dark:text-gray-400">Prioritize specific types of vocabulary</p>
              </div>
              
              {/* Frequency */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Word Frequency</Label>
                <RadioGroup 
                  value={tuningOptions.frequency}
                  onValueChange={(value) => setTuningOptions({...tuningOptions, frequency: value})}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="frequency-low" />
                    <Label htmlFor="frequency-low" className="text-sm">Low</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="frequency-medium" />
                    <Label htmlFor="frequency-medium" className="text-sm">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="frequency-high" />
                    <Label htmlFor="frequency-high" className="text-sm">High</Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-gray-500 dark:text-gray-400">Extract words based on their frequency in the text</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Parts of Speech */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Parts of Speech</Label>
                <div className="grid grid-cols-2 gap-2">
                  {partsOfSpeechOptions.map((part) => (
                    <div className="flex items-center space-x-2" key={part.id}>
                      <Checkbox 
                        id={`pos-${part.id}`} 
                        checked={tuningOptions.partsOfSpeech.includes(part.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setTuningOptions({
                              ...tuningOptions, 
                              partsOfSpeech: [...tuningOptions.partsOfSpeech, part.id]
                            });
                          } else {
                            setTuningOptions({
                              ...tuningOptions, 
                              partsOfSpeech: tuningOptions.partsOfSpeech.filter(pos => pos !== part.id)
                            });
                          }
                        }}
                      />
                      <Label htmlFor={`pos-${part.id}`} className="text-sm">{part.label}</Label>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Select parts of speech to extract</p>
              </div>
              
              {/* Source Type Hint */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">Source Type Hint</Label>
                <Select 
                  value={tuningOptions.sourceTypeHint} 
                  onValueChange={(value) => setTuningOptions({...tuningOptions, sourceTypeHint: value})}
                >
                  <SelectTrigger className="w-full text-sm">
                    <SelectValue placeholder="Source type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-detect</SelectItem>
                    <SelectItem value="news">News Article</SelectItem>
                    <SelectItem value="academic">Academic Paper</SelectItem>
                    <SelectItem value="fiction">Fiction Novel</SelectItem>
                    <SelectItem value="nonfiction">Non-fiction Book</SelectItem>
                    <SelectItem value="conversation">Casual Conversation</SelectItem>
                    <SelectItem value="social">Social Media</SelectItem>
                    <SelectItem value="technical">Technical Documentation</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 dark:text-gray-400">Provide context about the source material</p>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button
                variant="outline" 
                size="sm"
                onClick={() => {
                  setTuningOptions({
                    level: 'auto',
                    vocabularyFocus: 'general',
                    frequency: 'medium',
                    partsOfSpeech: ['noun', 'verb', 'adjective', 'adverb'],
                    sourceTypeHint: 'auto',
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

export default LexiGrabInputBox;