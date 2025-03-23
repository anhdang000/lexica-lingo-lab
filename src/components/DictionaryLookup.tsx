import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, ChevronDown, Loader2, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { lookupWord, type WordDefinition } from '@/lib/utils';

const DictionaryLookup: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [wordData, setWordData] = useState<WordDefinition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const result = await lookupWord(searchTerm.trim());
      if (result) {
        setWordData(result);
      } else {
        setError('No definition found for this word');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = (audioUrl?: string) => {
    if (audioUrl) {
      new Audio(audioUrl).play().catch(console.error);
    }
  };

  const languages = ['English', 'Spanish', 'French', 'German', 'Japanese', 'Chinese'];

  return (
    <Card className="glass dark:glass-dark border-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-purple-50/30 dark:from-gray-900 dark:to-gray-800 -z-10" />
      <CardHeader className="pb-3">
        <CardTitle className="text-xl text-gray-800 dark:text-white flex items-center">
          <Search className="mr-2 h-5 w-5 text-purple-500" />
          Dictionary Lookup
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="flex space-x-2">
            <div className="relative grow">
              <Input
                type="text"
                placeholder="Search for a word..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 bg-white dark:bg-gray-900"
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                className="flex items-center min-w-[110px] bg-white dark:bg-gray-900 justify-between"
              >
                {selectedLanguage}
                <ChevronDown className="h-4 w-4" />
              </Button>
              {/* Language dropdown would go here */}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-purple-500 hover:bg-purple-600 text-white"
            disabled={isLoading || !searchTerm.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Look Up
              </>
            )}
          </Button>
        </form>
        
        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-md">
            {error}
          </div>
        )}

        {wordData && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {wordData.word}
                </h3>
                {wordData.pronunciation && (
                  <div className="flex items-center gap-2 mt-1 text-gray-600 dark:text-gray-400">
                    <span>/{wordData.pronunciation.text}/</span>
                    {wordData.pronunciation.audio && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => playAudio(wordData.pronunciation?.audio)}
                      >
                        <Volume2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <span className="text-purple-500 font-medium">
                {wordData.partOfSpeech}
              </span>
            </div>

            <div className="space-y-3">
              {wordData.definitions.map((def, index) => (
                <div key={index} className="space-y-2">
                  <p className="text-gray-900 dark:text-gray-100">
                    {index + 1}. {def.meaning}
                  </p>
                  {def.examples && def.examples.length > 0 && (
                    <ul className="list-disc list-inside pl-4 space-y-1">
                      {def.examples.map((example, exIndex) => (
                        <li key={exIndex} className="text-sm text-gray-600 dark:text-gray-400">
                          {example}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {wordData.stems && wordData.stems.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Related Forms
                </h4>
                <div className="flex flex-wrap gap-2">
                  {wordData.stems.map((stem, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-sm bg-purple-50 dark:bg-purple-900/20 
                               text-purple-600 dark:text-purple-400 rounded-md"
                    >
                      {stem}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!wordData && !error && (
          <div className="mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Looking up words is easy! Just type the word above and select your preferred language for translation.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DictionaryLookup;
