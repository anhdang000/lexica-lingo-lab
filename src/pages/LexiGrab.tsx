import React, { useState, useEffect } from 'react';
import LexiGrabInputBox from '@/components/lexigrab/LexiGrabInputBox';
import LexiGrabResults from '@/components/lexigrab/LexiGrabResults';
import { useAppState } from '@/contexts/AppStateContext';
import { isSingleWordOrPhrases, FileInput, AnalysisResults } from '@/lib/utils';
import WordDetailModal from '@/components/WordDetailModal';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen,
  History,
  FileText,
  Info,
  Link,
  CheckCircle2,
  FileUp,
  PanelRight,
  Lightbulb,
  X
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const LexiGrab = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('input');
  const [recentSources, setRecentSources] = useState<{ type: string; name: string; date: string; content?: string; files?: FileInput[]; urls?: string[] }[]>([]);

  const {
    setVocabularyResults,
    setTopicResults,
    setShowResults,
    setCurrentWord,
    setCurrentTool,
    lexigrabResults,
    currentWord,
    lexigrabInputValue,
    setLexigrabInputValue,
    lexigrabActiveFiles,
    setLexigrabActiveFiles,
    lexigrabRecognizedUrls,
    setLexigrabRecognizedUrls,
    lexigrabSummaryContent,
    setLexigrabSummaryContent,
  } = useAppState();

  useEffect(() => {
    setCurrentTool('lexigrab');
  }, [setCurrentTool]);

  useEffect(() => {
    // Load recent sources from localStorage when component mounts
    const savedSources = localStorage.getItem('lexigrab-recent-sources');
    if (savedSources) {
      try {
        const sources = JSON.parse(savedSources);
        
        // Filter out invalid sources
        const validSources = sources.filter(source => {
          // Check if files are valid
          if (source.files) {
            const hasValidFiles = source.files.some(fileInput => {
              if (!fileInput?.file) return false;
              if (!fileInput.file.name) return false;
              return true;
            });
            if (!hasValidFiles && source.files.length > 0) return false;
          }
          
          // Check if URLs are valid
          if (source.urls) {
            if (!Array.isArray(source.urls) || source.urls.length === 0) return false;
          }
          
          // Check if content is valid for text type
          if (source.type === 'text' && (!source.content || typeof source.content !== 'string')) {
            return false;
          }
          
          return true;
        });

        // Only update localStorage if we filtered out some invalid sources
        if (validSources.length !== sources.length) {
          localStorage.setItem('lexigrab-recent-sources', JSON.stringify(validSources));
        }
        
        setRecentSources(validSources);
      } catch (error) {
        console.error('Error loading recent sources:', error);
        // If there's an error parsing, clear the invalid data
        localStorage.removeItem('lexigrab-recent-sources');
        setRecentSources([]);
      }
    }
  }, []);

  const { vocabularyResults, topicResults, showResults } = lexigrabResults;

  const addRecentSource = (type: string, name: string, data?: { content?: string; files?: FileInput[]; urls?: string[] }) => {
    const newSource = { 
      type, 
      name, 
      date: 'Just now',
      content: data?.content,
      files: data?.files,
      urls: data?.urls
    };
    
    // Remove any existing source with the same content/files/urls
    const existingSourceIndex = recentSources.findIndex(source => {
      // Check if content matches
      if (data?.content && source.content === data.content) return true;
      
      // Check if files match (by name)
      if (data?.files && source.files && 
          data.files[0].file.name === source.files[0].file.name) return true;
      
      // Check if urls match
      if (data?.urls && source.urls && 
          data.urls[0] === source.urls[0]) return true;
      
      return false;
    });

    let updatedSources;
    if (existingSourceIndex !== -1) {
      // Remove the existing source and add the new one at the top
      updatedSources = [
        newSource,
        ...recentSources.slice(0, existingSourceIndex),
        ...recentSources.slice(existingSourceIndex + 1)
      ].slice(0, 5); // Keep max 5 items
    } else {
      // Add new source at the top
      updatedSources = [newSource, ...recentSources].slice(0, 5); // Keep max 5 items
    }
    
    setRecentSources(updatedSources);
    
    // Save to localStorage
    try {
      localStorage.setItem('lexigrab-recent-sources', JSON.stringify(updatedSources));
    } catch (error) {
      console.error('Error saving recent sources:', error);
    }
  };

  const removeRecentSource = (index: number) => {
    const updatedSources = recentSources.filter((_, i) => i !== index);
    setRecentSources(updatedSources);
    localStorage.setItem('lexigrab-recent-sources', JSON.stringify(updatedSources));
  };

  const clearRecentSources = () => {
    setRecentSources([]);
    localStorage.removeItem('lexigrab-recent-sources');
  };

  const handleSourceClick = (source: typeof recentSources[0]) => {
    // First reset all input states
    setLexigrabInputValue('');
    setLexigrabActiveFiles([]);
    setLexigrabRecognizedUrls([]);
    
    let isValidSource = true;

    // Restore the state based on source type
    if (source.content) {
      setLexigrabInputValue(source.content);
    }
    
    if (source.files) {
      // Validate files before processing
      const validFiles = source.files.filter(fileInput => {
        if (!fileInput?.file) return false;
        if (!fileInput.file.name) return false;
        return true;
      });

      // If no valid files, mark source as invalid
      if (validFiles.length === 0 && source.files.length > 0) {
        isValidSource = false;
      } else if (validFiles.length > 0) {
        setLexigrabActiveFiles(validFiles.map(fileInput => {
          const fileType = fileInput.file.type?.startsWith('image/') ? 'image' : 'document';
          const fileName = fileInput.file.name;
          const fileExtension = fileName?.includes('.') ? fileName.split('.').pop() || '' : '';
          
          // Create a unique ID for this file instance
          const id = Math.random().toString(36).substring(7);
          
          // For image files, read and set the preview
          if (fileType === 'image') {
            const reader = new FileReader();
            reader.onload = (e) => {
              setLexigrabActiveFiles(prevFiles => 
                prevFiles.map(prevFile => 
                  prevFile?.id === id 
                    ? { ...prevFile, preview: e.target?.result as string } 
                    : prevFile
                ).filter(Boolean) as typeof prevFiles
              );
            };
            reader.readAsDataURL(fileInput.file);
          }
          
          return {
            id,
            preview: '', // Initially empty, will be updated by reader for images
            file: fileInput.file,
            fileType,
            fileExtension,
            isUploading: false
          };
        }));
      }
    }
    
    if (source.urls) {
      if (Array.isArray(source.urls) && source.urls.length > 0) {
        setLexigrabRecognizedUrls(source.urls);
      } else {
        isValidSource = false;
      }
    }

    // If source is invalid, remove it from recent sources
    if (!isValidSource) {
      const sourceIndex = recentSources.findIndex(s => s === source);
      if (sourceIndex !== -1) {
        const updatedSources = [...recentSources];
        updatedSources.splice(sourceIndex, 1);
        setRecentSources(updatedSources);
        localStorage.setItem('lexigrab-recent-sources', JSON.stringify(updatedSources));
      }
      return;
    }
    
    setActiveTab('input');
  };

  const handleAnalyzeVocabulary = async (
    text: string,
    files: FileInput[],
    analysisResults?: AnalysisResults
  ) => {
    setIsAnalyzing(true);

    await new Promise(resolve => requestAnimationFrame(() => {
      resolve(null);
    }));

    try {
      await new Promise(resolve => setTimeout(resolve, 100));

      if (analysisResults) {
        setVocabularyResults(analysisResults.vocabulary, 'lexigrab');
        setTopicResults(analysisResults.topics, 'lexigrab');
        setLexigrabSummaryContent(analysisResults.content || "");
      }

      setShowResults(true, 'lexigrab');
      setActiveTab('results');  // Explicitly set tab to results after analysis

      // Add to recent sources with full context
      if (text.trim() || files.length > 0 || lexigrabRecognizedUrls.length > 0) {
        const sourceData = {
          content: text.trim(),
          files: files.length > 0 ? files : undefined,
          urls: lexigrabRecognizedUrls.length > 0 ? lexigrabRecognizedUrls : undefined
        };

        let sourceName = '';
        let sourceType = 'text';
        
        if (text.trim()) {
          sourceName = text.length > 30 ? text.substring(0, 30) + '...' : text;
          sourceType = 'text';
        } else if (files.length > 0) {
          sourceName = files[0].file.name;
          sourceType = 'file';
        } else if (lexigrabRecognizedUrls.length > 0) {
          sourceName = lexigrabRecognizedUrls[0];
          sourceType = 'url';
        }

        addRecentSource(sourceType, sourceName, sourceData);
      }
    } catch (error) {
      console.error("Error analyzing vocabulary:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCloseResults = () => {
    setShowResults(false, 'lexigrab');
    setLexigrabSummaryContent("");
  };

  const renderSourceIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'url':
        return <Link className="h-4 w-4 text-green-500" />;
      case 'file':
        return <FileUp className="h-4 w-4 text-orange-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="relative text-center py-14 mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-rose-100 to-orange-50 dark:from-rose-900/30 dark:to-orange-950/30">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="relative z-10">
          <h2 className="text-4xl font-bold mb-4 animate-fade-in">
            Grab vocabulary from <span className="font-['Pacifico'] text-primary">any sources</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto mb-6 animate-fade-in-up">
            Easily extract and learn vocabulary from texts, websites, and documents in seconds.
          </p>
          <div className="flex flex-wrap justify-center gap-4 animate-fade-in">
            <Badge variant="outline" className="py-2 px-4 bg-white/80 dark:bg-gray-800/80 dark:text-gray-200">
              <FileText className="h-4 w-4 mr-2" /> Text
            </Badge>
            <Badge variant="outline" className="py-2 px-4 bg-white/80 dark:bg-gray-800/80 dark:text-gray-200">
              <Link className="h-4 w-4 mr-2" /> URLs
            </Badge>
            <Badge variant="outline" className="py-2 px-4 bg-white/80 dark:bg-gray-800/80 dark:text-gray-200">
              <FileUp className="h-4 w-4 mr-2" /> Documents & PDFs
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="hidden md:block w-72 shrink-0 animate-slide-in-left">
          <Card className="bg-white dark:bg-gray-800/50">
            <CardContent className="p-4">
              <div className="font-medium mb-3 flex items-center text-gray-700 dark:text-gray-300">
                <Info className="h-4 w-4 mr-2" /> About LexiGrab
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                LexiGrab helps you extract vocabulary from any source, including text, websites, images, and documents.
              </p>
              
              <div className="border-t border-gray-100 dark:border-gray-700 mt-3 pt-3 mb-4">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="features" className="border-none">
                    <AccordionTrigger className="py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <div className="flex items-center">
                        <PanelRight className="h-4 w-4 mr-2" /> Features
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                        <li className="flex items-start gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                          <span>Extract vocabulary from multiple sources</span>
                        </li>
                        <li className="flex items-start gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                          <span>Automatic meaning detection</span>
                        </li>
                        <li className="flex items-start gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                          <span>Save words to your library</span>
                        </li>
                        <li className="flex items-start gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                          <span>Image and document processing</span>
                        </li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-3">
                <div className="font-medium mb-3 flex items-center text-gray-700 dark:text-gray-300">
                  <History className="h-4 w-4 mr-2" /> Recent Sources
                </div>
                {recentSources.length > 0 ? (
                  <ul className="space-y-2">
                    {recentSources.map((source, idx) => (
                      <li 
                        key={idx} 
                        className="group flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 p-1.5 rounded-md cursor-pointer transition-colors"
                        onClick={() => handleSourceClick(source)}
                      >
                        <div className="flex-shrink-0">{renderSourceIcon(source.type)}</div>
                        <div className="flex-grow overflow-hidden">
                          <p className="truncate">{source.name}</p>
                          <p className="text-xs text-gray-400">{source.date}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecentSource(idx);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No recent sources</p>
                )}
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 mt-3 pt-3">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="tips" className="border-none">
                    <AccordionTrigger className="py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <div className="flex items-center">
                        <Lightbulb className="h-4 w-4 mr-2 text-amber-500" /> Tips & Tricks
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                        <li className="flex items-start gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                          <span>Paste URLs to automatically extract vocabulary</span>
                        </li>
                        <li className="flex items-start gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                          <span>Drag & drop files for easy analysis</span>
                        </li>
                        <li className="flex items-start gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                          <span>Use images with text for quick vocabulary extraction</span>
                        </li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex-1">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full animate-fade-in"
          >
            <TabsList className="w-full flex justify-center mb-6">
              <TabsTrigger value="input" className="flex-1 max-w-xs">
                <FileText className="h-4 w-4 mr-2" /> Input
              </TabsTrigger>
              <TabsTrigger value="results" className="flex-1 max-w-xs" disabled={!showResults}>
                <BookOpen className="h-4 w-4 mr-2" /> Results
              </TabsTrigger>
            </TabsList>

            <TabsContent value="input" className="mt-0">
              <LexiGrabInputBox
                onAnalyze={handleAnalyzeVocabulary}
                isAnalyzing={isAnalyzing}
                inputValue={lexigrabInputValue}
                setInputValue={setLexigrabInputValue}
                activeFiles={lexigrabActiveFiles}
                setActiveFiles={setLexigrabActiveFiles}
                recognizedUrls={lexigrabRecognizedUrls}
                setRecognizedUrls={setLexigrabRecognizedUrls}
              />

              <div className="md:hidden mt-8 animate-fade-in">
                <Card className="bg-white dark:bg-gray-800/50">
                  <CardContent className="p-4">
                    <div className="font-medium mb-3 flex items-center text-gray-700 dark:text-gray-300">
                      <Info className="h-4 w-4 mr-2" /> About LexiGrab
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      LexiGrab helps you extract vocabulary from any source, including text, websites, images, and documents.
                    </p>
                    
                    <div className="flex gap-2 overflow-x-auto pb-2 mt-4">
                      {recentSources.slice(0, 3).map((source, idx) => (
                        <div key={idx} className="flex-shrink-0 w-40 rounded-md border border-gray-100 dark:border-gray-700 p-2">
                          <div className="flex items-center gap-2 mb-1">
                            {renderSourceIcon(source.type)}
                            <span className="text-xs text-gray-500">{source.date}</span>
                          </div>
                          <p className="text-sm truncate">{source.name}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="results" className="mt-0">
              <LexiGrabResults
                results={vocabularyResults}
                topics={topicResults}
                isVisible={showResults}
                onClose={handleCloseResults}
                isSingleWordOrPhrases={vocabularyResults.length > 0 && isSingleWordOrPhrases(vocabularyResults[0].word)}
                content={lexigrabSummaryContent}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <WordDetailModal
        open={currentWord !== null}
        onOpenChange={(open) => !open && setCurrentWord(null)}
        word={currentWord ? {
          ...currentWord,
          definitions: currentWord.definitions.map(def => def.meaning)
        } : null}
      />
    </div>
  );
};

export default LexiGrab;