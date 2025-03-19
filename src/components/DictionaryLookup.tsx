
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const DictionaryLookup: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    
    // Simulate API call
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
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
        
        <div className="mt-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Looking up words is easy! Just type the word above and select your preferred language for translation.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default DictionaryLookup;
