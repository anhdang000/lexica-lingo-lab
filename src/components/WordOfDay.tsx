
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Volume2, Plus, BookOpen } from 'lucide-react';

interface WordOfDayProps {
  word: string;
  pronunciation: string;
  partOfSpeech: string;
  definition: string;
  example: string;
}

const WordOfDay: React.FC<WordOfDayProps> = ({
  word,
  pronunciation,
  partOfSpeech,
  definition,
  example
}) => {
  return (
    <Card className="overflow-hidden glass dark:glass-dark border-0 animate-slide-in-up">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-amber-50 dark:from-gray-900 dark:to-gray-800 -z-10" />
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 mb-2">
              Word of the Day
            </div>
            <CardTitle className="text-2xl font-bold">{word}</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <span className="text-sm text-gray-500 dark:text-gray-400 italic mr-3">{pronunciation}</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">{partOfSpeech}</span>
              <Button variant="ghost" size="icon" className="ml-1 h-6 w-6">
                <Volume2 className="h-3 w-3" />
              </Button>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
          {definition}
        </p>
        <p className="text-sm italic text-gray-600 dark:text-gray-400 border-l-2 border-amber-300 pl-3 mb-4">
          "{example}"
        </p>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" className="h-8 px-3">
            <Plus className="mr-1 h-3 w-3" />
            Save
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-3">
            <BookOpen className="mr-1 h-3 w-3" />
            More details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default WordOfDay;
