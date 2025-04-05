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
  Lightbulb
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
  const [recentSources, setRecentSources] = useState<{ type: string; name: string; date: string }[]>([
    { type: 'text', name: 'Intro to Psychology', date: '2 hours ago' },
    { type: 'url', name: 'https://en.wikipedia.org/wiki/Linguistics', date: '1 day ago' },
    { type: 'file', name: 'marketing-plan.pdf', date: '3 days ago' },
  ]);
  
  const {
    setVocabularyResults,
    setTopicResults,
    setShowResults,
    setCurrentWord,
    setCurrentTool,
    lexigrabResults,
    currentWord
  } = useAppState();

  // State to store content from analysis results
  const [summaryContent, setSummaryContent] = useState<string>("");

  // Set current tool to lexigrab when component mounts
  useEffect(() => {
    setCurrentTool('lexigrab');
  }, [setCurrentTool]);

  // Use lexigrabResults directly instead of getCurrentResults
  const { vocabularyResults, topicResults, showResults } = lexigrabResults;

  const handleAnalyzeVocabulary = async (
    text: string, 
    files: FileInput[],
    analysisResults?: AnalysisResults
  ) => {
    setIsAnalyzing(true);
    
    // Force a repaint to ensure the loading state is immediately visible
    await new Promise(resolve => requestAnimationFrame(() => {
      resolve(null);
    }));
    
    try {
      // Simulate a small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 100)); 
      
      // For lexigrab, use pre-analyzed results if provided
      if (analysisResults) {
        setVocabularyResults(analysisResults.vocabulary, 'lexigrab');
        setTopicResults(analysisResults.topics, 'lexigrab');
        // Store content from analysis results
        setSummaryContent(analysisResults.content || "");
      }
      
      setShowResults(true, 'lexigrab');
      
      // After successful analysis, switch to results tab
      setActiveTab('results');
      
      // Add to recent sources (in a real app, this would be saved to persistent storage)
      // Just demonstrating the concept here
      if (text.trim()) {
        const newSource = {
          type: 'text',
          name: text.length > 30 ? text.substring(0, 30) + '...' : text,
          date: 'Just now'
        };
        setRecentSources(prev => [newSource, ...prev.slice(0, 4)]);
      } else if (files.length > 0) {
        const newSource = {
          type: 'file',
          name: files[0].file.name,
          date: 'Just now'
        };
        setRecentSources(prev => [newSource, ...prev.slice(0, 4)]);
      }
    } catch (error) {
      console.error("Error analyzing vocabulary:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCloseResults = () => {
    setShowResults(false, 'lexigrab');
    setActiveTab('input');
    setSummaryContent("");
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
      {/* Hero Section with animated gradient background */}
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

      {/* Main Content */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left sidebar - more compact */}
        <div className="hidden md:block w-72 shrink-0 animate-slide-in-left">
          <Card className="bg-white dark:bg-gray-800/50">
            <CardContent className="p-4">
              {/* About section - moved from right sidebar */}
              <div className="font-medium mb-3 flex items-center text-gray-700 dark:text-gray-300">
                <Info className="h-4 w-4 mr-2" /> About LexiGrab
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                LexiGrab helps you extract vocabulary from any source, including text, websites, images, and documents.
              </p>
              
              {/* Features - moved from right sidebar */}
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

              {/* Recent Sources section */}
              <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-3">
                <div className="font-medium mb-3 flex items-center text-gray-700 dark:text-gray-300">
                  <History className="h-4 w-4 mr-2" /> Recent Sources
                </div>
                {recentSources.length > 0 ? (
                  <ul className="space-y-2">
                    {recentSources.map((source, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 p-1.5 rounded-md cursor-pointer transition-colors">
                        {renderSourceIcon(source.type)}
                        <div className="overflow-hidden">
                          <p className="truncate">{source.name}</p>
                          <p className="text-xs text-gray-400">{source.date}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No recent sources</p>
                )}
              </div>

              {/* Tips section */}
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

        {/* Main content area */}
        <div className="flex-1">
          <Tabs 
            defaultValue="input" 
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
              />
              
              {/* Mobile-only info panel */}
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
                content={summaryContent}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Word Detail Modal */}
      <WordDetailModal
        open={currentWord !== null}
        onOpenChange={(open) => !open && setCurrentWord(null)}
        wordDetails={currentWord}
      />
    </div>
  );
};

export default LexiGrab;