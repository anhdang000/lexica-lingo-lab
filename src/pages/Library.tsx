import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Book, Plus, Tag, Clock, Dumbbell, BookOpen, Search } from 'lucide-react';
import TabNav from '@/components/TabNav';
import TopicInputForm from '@/components/library/TopicInputForm';
import TopicList from '@/components/library/TopicList';
import VocabularyList from '@/components/library/VocabularyList';
import RecommendedVocabulary from '@/components/library/RecommendedVocabulary';
import { toast } from 'sonner';

// Temporary mock data - in a real app would come from database
const mockTopics = [
  { id: '1', name: 'Business', count: 42, progress: 65 },
  { id: '2', name: 'Technology', count: 38, progress: 40 },
  { id: '3', name: 'Medicine', count: 56, progress: 25 },
  { id: '4', name: 'Travel', count: 24, progress: 80 },
  { id: '5', name: 'Academic', count: 31, progress: 10 },
];

// Organization/sorting options
const sortOptions = [
  { id: 'user', label: 'User Topics', icon: <Tag className="h-4 w-4" /> },
  { id: 'ai', label: 'AI Categories', icon: <Book className="h-4 w-4" /> },
  { id: 'date', label: 'Add Date', icon: <Clock className="h-4 w-4" /> },
  { id: 'most-reviewed', label: 'Most Reviewed', icon: <Dumbbell className="h-4 w-4" /> },
  { id: 'least-reviewed', label: 'Least Reviewed', icon: <BookOpen className="h-4 w-4" /> },
];

const Library: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('user');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Simulated function to handle AI generating a topic
  const handleGenerateTopic = (prompt: string) => {
    // In a real implementation, this would call an API
    toast.success(`Topic "${prompt}" created successfully!`);
  };

  // Handle adding a vocabulary to library
  const handleAddToLibrary = (word: string) => {
    toast.success(`"${word}" added to your library!`);
  };

  return (
    <div className="container px-4 py-6 max-w-5xl mx-auto">
      <TabNav />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Left column - Topics */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl flex items-center gap-2">
                <Book className="h-5 w-5 text-cyan-500" />
                Topics
              </CardTitle>
              <CardDescription>Generate or manage your vocabulary topics</CardDescription>
            </CardHeader>
            <CardContent className="pb-1">
              <TopicInputForm onSubmit={handleGenerateTopic} />
            </CardContent>
            <CardFooter className="pt-0 pb-4 flex justify-end">
              <div className="text-sm text-muted-foreground">
                {mockTopics.length} topics
              </div>
            </CardFooter>
          </Card>
          
          <TopicList 
            topics={mockTopics} 
            selectedTopic={selectedTopic}
            onSelectTopic={setSelectedTopic}
          />
        </div>
        
        {/* Right column - Vocabulary content */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <CardTitle className="text-xl">
                    {selectedTopic ? 
                      mockTopics.find(t => t.id === selectedTopic)?.name || 'Vocabulary' : 
                      'All Vocabulary'}
                  </CardTitle>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search vocabulary..."
                      className="w-full pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Organized as</div>
                  <div className="flex flex-wrap gap-2">
                    {sortOptions.map(option => (
                      <Button 
                        key={option.id}
                        variant={sortBy === option.id ? "default" : "secondary"}
                        size="sm"
                        className={`${sortBy === option.id ? 'bg-cyan-500 hover:bg-cyan-600' : ''}`}
                        onClick={() => setSortBy(option.id)}
                      >
                        {option.icon}
                        <span className="ml-2">{option.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <VocabularyList 
                topicId={selectedTopic} 
                searchQuery={searchQuery}
                sortBy={sortBy}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="h-4 w-4 text-green-500" />
                Recommended Vocabulary
              </CardTitle>
              <CardDescription>
                Based on your current topics and learning progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecommendedVocabulary onAddToLibrary={handleAddToLibrary} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Library;
