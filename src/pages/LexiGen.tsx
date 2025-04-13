import React, { useState, useEffect } from 'react';
import LexiGenInputBox, { TuningOptions } from '@/components/lexigen/LexiGenInputBox';
import LexiGenResults from '@/components/lexigen/LexiGenResults';
import { useAppState } from '@/contexts/AppStateContext';
import { isSingleWordOrPhrases, generateVocabularyFromTopic } from '@/lib/utils';
import WordDetailModal from '@/components/WordDetailModal';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  History, 
  MessageSquare, 
  Info, 
  Brain, 
  CheckCircle2, 
  Sparkles, 
  PanelRight,
  Zap
} from 'lucide-react';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const LexiGen = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [topicName, setTopicName] = useState<string>('');
  const [activeTab, setActiveTab] = useState('input');
  const [showTuningOptions, setShowTuningOptions] = useState(false);
  const [activeTuningOptions, setActiveTuningOptions] = useState<TuningOptions | null>(null);
  const [popularTopics, setPopularTopics] = useState<string[]>([
    'Business & Marketing',
    'Medical Terminology',
    'Technology',
    'Travel',
    'Academic Writing',
    'Science'
  ]);
  const [recentTopics, setRecentTopics] = useState<{ name: string; date: string }[]>([
    { name: 'Artificial Intelligence', date: '3 hours ago' },
    { name: 'Japanese Culture', date: '2 days ago' },
    { name: 'Photography', date: '1 week ago' },
  ]);
  
  const {
    setVocabularyResults,
    setTopicResults,
    setShowResults,
    setCurrentWord,
    setCurrentTool,
    lexigenResults,
    currentWord
  } = useAppState();

  // Set current tool to lexigen when component mounts
  useEffect(() => {
    setCurrentTool('lexigen');
  }, [setCurrentTool]);

  // Use lexigenResults directly instead of getCurrentResults
  const { vocabularyResults, topicResults, showResults } = lexigenResults;

  const handleGenerateVocabulary = async (text: string, tuningOptions?: TuningOptions) => {
    setIsAnalyzing(true);
    
    // Save active tuning options
    if (tuningOptions) {
      setActiveTuningOptions(tuningOptions);
    }
    
    // Force a repaint to ensure the loading state is immediately visible
    await new Promise(resolve => requestAnimationFrame(() => {
      resolve(null);
    }));
    
    try {
      // Simulate a small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 100)); 
      
      // Generate vocabulary based on the topic
      const results = await generateVocabularyFromTopic(text, tuningOptions);
      setVocabularyResults(results.vocabulary, 'lexigen');
      setTopicResults(results.topics, 'lexigen');
      setTopicName(results.topicName || text);
      
      setShowResults(true, 'lexigen');
      
      // After successful generation, switch to results tab
      setActiveTab('results');
      
      // Add to recent topics (in a real app, this would be saved to persistent storage)
      const newTopic = {
        name: text,
        date: 'Just now'
      };
      setRecentTopics(prev => [newTopic, ...prev.slice(0, 4)]);
    } catch (error) {
      console.error("Error generating vocabulary:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCloseResults = () => {
    setShowResults(false, 'lexigen');
    setActiveTab('input');
  };
  
  const handleSelectPopularTopic = (topic: string) => {
    // Auto-fill the topic in the input box by simulating a submission
    handleGenerateVocabulary(topic);
  };

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Hero Section with animated gradient background */}
      <div className="relative text-center py-14 mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-950/30">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="relative z-10">
          <h2 className="text-4xl font-bold mb-4 animate-fade-in">
            Generate vocabulary from <span className="font-['Pacifico'] text-primary">any topic</span>
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto mb-6 animate-fade-in-up">
            Create customized vocabulary lists from any subject to enhance your language learning journey.
          </p>
          <div className="flex flex-wrap justify-center gap-4 animate-fade-in">
            <Badge variant="outline" className="py-2 px-4 bg-white/80 dark:bg-gray-800/80 dark:text-gray-200">
              <Brain className="h-4 w-4 mr-2" /> AI Generated
            </Badge>
            <Badge variant="outline" className="py-2 px-4 bg-white/80 dark:bg-gray-800/80 dark:text-gray-200">
              <Sparkles className="h-4 w-4 mr-2" /> Contextual
            </Badge>
            <Badge variant="outline" className="py-2 px-4 bg-white/80 dark:bg-gray-800/80 dark:text-gray-200">
              <MessageSquare className="h-4 w-4 mr-2" /> Examples Included
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
                <Info className="h-4 w-4 mr-2" /> About LexiGen
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                LexiGen creates customized vocabulary lists based on topics you're interested in, perfect for targeted language learning.
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
                          <span>AI-powered vocabulary generation</span>
                        </li>
                        <li className="flex items-start gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                          <span>Contextual examples for each word</span>
                        </li>
                        <li className="flex items-start gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                          <span>Save words to your personal library</span>
                        </li>
                        <li className="flex items-start gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                          <span>Perfect for specialized fields</span>
                        </li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              {/* Popular Topics section */}
              <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-3">
                <div className="font-medium mb-3 flex items-center text-gray-700 dark:text-gray-300">
                  <Zap className="h-4 w-4 mr-2 text-amber-500" /> Popular Topics
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {popularTopics.map((topic, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-xs"
                      onClick={() => handleSelectPopularTopic(topic)}
                    >
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Recent Topics section */}
              <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-3">
                <div className="font-medium mb-3 flex items-center text-gray-700 dark:text-gray-300">
                  <History className="h-4 w-4 mr-2" /> Recent Topics
                </div>
                {recentTopics.length > 0 ? (
                  <ul className="space-y-2">
                    {recentTopics.map((topic, idx) => (
                      <li 
                        key={idx} 
                        className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 p-1.5 rounded-md cursor-pointer transition-colors"
                        onClick={() => handleSelectPopularTopic(topic.name)}
                      >
                        <MessageSquare className="h-4 w-4 text-purple-500 mt-0.5" />
                        <div className="overflow-hidden">
                          <p className="truncate">{topic.name}</p>
                          <p className="text-xs text-gray-400">{topic.date}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No recent topics</p>
                )}
              </div>

              {/* Topic Ideas section */}
              <div className="border-t border-gray-100 dark:border-gray-700 mt-3 pt-3">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="ideas" className="border-none">
                    <AccordionTrigger className="py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      <div className="flex items-center">
                        <Sparkles className="h-4 w-4 mr-2 text-indigo-500" /> Topic Ideas
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                        <p className="font-medium text-gray-700 dark:text-gray-300">Try topics like:</p>
                        <ul className="space-y-1 ml-3 list-disc">
                          <li>Career-specific vocabulary</li>
                          <li>Hobbies or special interests</li>
                          <li>Academic subjects</li>
                          <li>Travel destinations</li>
                          <li>Social situations</li>
                        </ul>
                      </div>
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
                <MessageSquare className="h-4 w-4 mr-2" /> Input
              </TabsTrigger>
              <TabsTrigger value="results" className="flex-1 max-w-xs" disabled={!showResults}>
                <BookOpen className="h-4 w-4 mr-2" /> Results
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="input" className="mt-0">
              <LexiGenInputBox 
                onAnalyze={handleGenerateVocabulary}
                isAnalyzing={isAnalyzing}
                showTuningOptions={showTuningOptions}
                setShowTuningOptions={setShowTuningOptions}
                activeTuningOptions={activeTuningOptions}
                setActiveTuningOptions={setActiveTuningOptions}
              />
              
              {/* Mobile-only info panel */}
              <div className="md:hidden mt-8 animate-fade-in">
                <Card className="bg-white dark:bg-gray-800/50">
                  <CardContent className="p-4">
                    <div className="font-medium mb-3 flex items-center text-gray-700 dark:text-gray-300">
                      <Info className="h-4 w-4 mr-2" /> About LexiGen
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      LexiGen creates customized vocabulary lists based on topics you're interested in.
                    </p>
                    
                    <div className="font-medium mb-2 flex items-center text-gray-700 dark:text-gray-300">
                      <Zap className="h-4 w-4 mr-2 text-amber-500" /> Popular Topics
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {popularTopics.slice(0, 4).map((topic, idx) => (
                        <Badge 
                          key={idx} 
                          variant="secondary" 
                          className="cursor-pointer"
                          onClick={() => handleSelectPopularTopic(topic)}
                        >
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="results" className="mt-0">
              <LexiGenResults 
                results={vocabularyResults}
                topics={topicResults}
                isVisible={showResults}
                onClose={handleCloseResults}
                isSingleWordOrPhrases={vocabularyResults.length > 0 && isSingleWordOrPhrases(vocabularyResults[0].word)}
                topicName={topicName}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Word Detail Modal */}
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

export default LexiGen;