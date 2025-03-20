
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageCircle, 
  BookOpen, 
  ChevronRight, 
  Volume2, 
  Bookmark, 
  MoreHorizontal, 
  PlusCircle, 
  CheckCircle, 
  Filter, 
  TextIcon,
  Link,
  Image,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link as RouterLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const Index = () => {
  // State for input type selection
  const [inputType, setInputType] = useState<'text' | 'url' | 'image'>('text');

  // Sample data for Word of the Day
  const wordOfDayData = {
    word: "Serendipity",
    pronunciation: "/ˌserənˈdipəti/",
    partOfSpeech: "noun",
    definition: "The occurrence and development of events by chance in a happy or beneficial way.",
    example: "The scientists made the discovery by serendipity when they were looking for something else entirely.",
    category: "Literature"
  };

  // Sample data for Study Progress
  const progressData = {
    wordsLearned: 248,
    completion: 85
  };

  // Sample recent activity
  const recentActivity = [
    {
      id: 1,
      icon: 'add',
      message: 'Added 12 new words',
      timestamp: '2 hours ago'
    },
    {
      id: 2,
      icon: 'check',
      message: 'Completed daily review',
      timestamp: '5 hours ago'
    }
  ];

  // Sample vocabulary words
  const vocabularyWords = [
    {
      id: 1,
      word: 'Paradigm',
      definition: 'A typical example or pattern of something',
      category: 'Business',
      reviewDate: 'Today',
      level: 'Advanced'
    },
    {
      id: 2,
      word: 'Algorithm',
      definition: 'A process or set of rules to be followed in calculations',
      category: 'Technology',
      reviewDate: 'Tomorrow',
      level: 'Intermediate'
    },
    {
      id: 3,
      word: 'Quantum',
      definition: 'The smallest amount of energy that can exist independently',
      category: 'Science',
      reviewDate: 'In 3 days',
      level: 'Advanced'
    }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Business':
        return 'bg-quaternary/20 text-tertiary';
      case 'Technology':
        return 'bg-secondary/20 text-secondary';
      case 'Science':
        return 'bg-primary/20 text-primary';
      case 'Literature':
        return 'bg-quaternary/20 text-tertiary';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Advanced':
        return 'text-primary';
      case 'Intermediate':
        return 'text-secondary';
      case 'Beginner':
        return 'text-tertiary';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">
          Expand your <span className="font-['Pacifico'] text-primary">lexicon</span> with AI
        </h2>
        <p className="text-gray-600">Enter text, paste a URL, or upload an image to discover new words</p>
      </div>

      {/* Input Box */}
      <Card className="bg-white shadow-sm mb-12 border-0">
        <CardContent className="p-6 sm:p-8">
          <div className="mb-6">
            <div className="relative h-64 mb-4">
              {/* Input type tabs */}
              <div className="absolute top-0 left-0 flex gap-4 p-4 text-gray-500 z-10">
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-full",
                    inputType === 'text' ? "bg-gray-100" : ""
                  )}
                  onClick={() => setInputType('text')}
                >
                  <TextIcon className="w-5 h-5" />
                  Text
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-full",
                    inputType === 'url' ? "bg-gray-100" : ""
                  )}
                  onClick={() => setInputType('url')}
                >
                  <Link className="w-5 h-5" />
                  URL
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-full",
                    inputType === 'image' ? "bg-gray-100" : ""
                  )}
                  onClick={() => setInputType('image')}
                >
                  <Image className="w-5 h-5" />
                  Image
                </Button>
              </div>
              
              {/* Text area */}
              <Textarea 
                className="w-full h-full px-8 pt-16 pb-20 bg-gray-50 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/20 text-lg shadow-sm resize-none border-none" 
                placeholder={
                  inputType === 'text' 
                    ? "Paste text, or type vocabulary you want to learn..." 
                    : inputType === 'url'
                      ? "Enter a URL to analyze content..."
                      : "Upload an image or paste an image URL..."
                }
              />
              
              {/* Analyze button */}
              <Button
                className="absolute bottom-4 right-4 px-8 py-6 h-auto bg-primary text-white font-medium rounded-lg hover:bg-primary/90"
              >
                Analyze Vocabulary
              </Button>
            </div>
          </div>

          {/* AI-powered note */}
          <div className="flex items-center justify-end text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              <span>AI-powered analysis</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12">
        {/* Word of the Day */}
        <Card className="md:col-span-7 bg-white shadow-sm border-0">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Word of the Day</h3>
            <div className="transition-transform hover:-translate-y-1 duration-200">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-2xl font-bold">{wordOfDayData.word}</p>
                <span className="text-gray-400 italic">{wordOfDayData.pronunciation}</span>
                <span className="text-primary text-sm">{wordOfDayData.partOfSpeech}</span>
              </div>
              <p className="text-gray-600 mb-3">{wordOfDayData.definition}</p>
              <div className="bg-gray-50 p-3 rounded-lg mb-3 italic text-gray-600 text-sm">
                "{wordOfDayData.example}"
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 ${getCategoryColor(wordOfDayData.category)} rounded-full text-sm`}>
                    {wordOfDayData.category}
                  </span>
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-primary">
                    <Volume2 className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded-full">
                    <Bookmark className="h-4 w-4" />
                    Save
                  </Button>
                  <Button variant="ghost" className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded-full">
                    <MoreHorizontal className="h-4 w-4" />
                    More
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Column */}
        <div className="md:col-span-5 grid grid-rows-2 gap-6">
          {/* Study Progress */}
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Study Progress</h3>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-3xl font-bold">{progressData.wordsLearned}</p>
                  <p className="text-gray-500">Words Learned</p>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-primary flex items-center justify-center">
                  <span className="text-lg font-bold">{progressData.completion}%</span>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full py-2 text-primary font-medium border border-primary rounded-lg hover:bg-primary/5"
              >
                View Details
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-white shadow-sm border-0">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {recentActivity.map(activity => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.icon === 'add' ? 'bg-secondary/20 text-secondary' : 'bg-primary/20 text-primary'
                    }`}>
                      {activity.icon === 'add' ? <PlusCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Vocabulary Section */}
      <Card className="bg-white shadow-sm border-0 mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Your Vocabulary</h3>
            <div className="flex items-center gap-4">
              <Button variant="ghost" className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg">
                <Filter className="w-5 h-5" />
                Filter
              </Button>
              <Button className="px-4 py-2 h-auto bg-primary text-white font-medium rounded-lg hover:bg-primary/90">
                Study Now
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {vocabularyWords.map(word => (
              <div 
                key={word.id} 
                className="transition-transform hover:-translate-y-1 duration-200 bg-gray-50 rounded-xl p-4 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 ${getCategoryColor(word.category)} rounded-full text-xs`}>
                    {word.category}
                  </span>
                  <Button variant="ghost" size="icon" className="w-6 h-6 flex items-center justify-center text-gray-400">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xl font-bold mb-1">{word.word}</p>
                <p className="text-gray-600 text-sm mb-3">{word.definition}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Next review: {word.reviewDate}</span>
                  <span className={`${getLevelColor(word.level)} font-medium`}>{word.level}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
