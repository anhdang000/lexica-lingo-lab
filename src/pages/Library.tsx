
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Book, Search, Sparkles, BookOpen, Plus, Tag, Grid3X3, Layout } from 'lucide-react';
import { toast } from 'sonner';
import TabNav from '@/components/TabNav';
import TopicInputForm from '@/components/library/TopicInputForm';
import TopicList from '@/components/library/TopicList';
import RecommendedVocabulary from '@/components/library/RecommendedVocabulary';
import CollectionGallery from '@/components/library/CollectionGallery';

// Temporary mock data - in a real app would come from database
const mockTopics = [
  { id: '1', name: 'Business', count: 42, progress: 65 },
  { id: '2', name: 'Technology', count: 38, progress: 40 },
  { id: '3', name: 'Medicine', count: 56, progress: 25 },
  { id: '4', name: 'Travel', count: 24, progress: 80 },
  { id: '5', name: 'Academic', count: 31, progress: 10 },
];

// Mock collections for the gallery
const mockCollections = [
  { id: '1', name: 'Business Terms', wordCount: 42, lastStudied: '2023-10-15', type: 'ai', progress: 65, imageUrl: '/placeholder.svg' },
  { id: '2', name: 'Tech Vocabulary', wordCount: 38, lastStudied: '2023-10-20', type: 'ai', progress: 40, imageUrl: '/placeholder.svg' },
  { id: '3', name: 'Medical Terms', wordCount: 56, lastStudied: '2023-10-18', type: 'ai', progress: 25, imageUrl: '/placeholder.svg' },
  { id: '4', name: 'Travel Essentials', wordCount: 24, lastStudied: '2023-10-25', type: 'collection', progress: 80, imageUrl: '/placeholder.svg' },
  { id: '5', name: 'Academic Writing', wordCount: 31, lastStudied: '2023-10-17', type: 'collection', progress: 10, imageUrl: '/placeholder.svg' },
];

// Mock vocabulary data for the collection details
const mockVocabulary = [
  { id: '1', word: 'Acquisition', definition: 'The act of acquiring something', collectionId: '1', lastReviewed: '2023-10-15', reviewCount: 5 },
  { id: '2', word: 'Diversification', definition: 'The action of making diverse', collectionId: '1', lastReviewed: '2023-10-20', reviewCount: 3 },
  { id: '3', word: 'Algorithm', definition: 'A process or set of rules to be followed in calculations', collectionId: '2', lastReviewed: '2023-10-18', reviewCount: 7 },
  { id: '4', word: 'Cryptocurrency', definition: 'A digital currency using encryption techniques', collectionId: '2', lastReviewed: '2023-10-25', reviewCount: 2 },
  { id: '5', word: 'Diagnostic', definition: 'Relating to the identification of a condition', collectionId: '3', lastReviewed: '2023-10-10', reviewCount: 6 },
  { id: '6', word: 'Itinerary', definition: 'A planned route of a journey', collectionId: '4', lastReviewed: '2023-10-22', reviewCount: 4 },
  { id: '7', word: 'Thesis', definition: 'A statement or theory put forward to be maintained or proved', collectionId: '5', lastReviewed: '2023-10-17', reviewCount: 1 },
];

const Library: React.FC = () => {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [organizationType, setOrganizationType] = useState<'ai' | 'collection'>('ai');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [isCollectionDialogOpen, setIsCollectionDialogOpen] = useState(false);
  
  // Handle adding a vocabulary to library
  const handleAddToLibrary = (word: string) => {
    toast.success(`"${word}" added to your library!`);
  };

  // Simulated function to handle AI generating a topic
  const handleGenerateTopic = (prompt: string) => {
    // In a real implementation, this would call an API
    toast.success(`Topic "${prompt}" created successfully!`);
  };

  // Handle collection selection
  const handleCollectionSelect = (collectionId: string) => {
    setSelectedCollection(collectionId);
    setIsCollectionDialogOpen(true);
  };

  // Get the current collection's vocabulary
  const currentCollectionVocabulary = selectedCollection
    ? mockVocabulary.filter(item => item.collectionId === selectedCollection)
    : [];

  // Get the current collection details
  const currentCollection = selectedCollection
    ? mockCollections.find(collection => collection.id === selectedCollection)
    : null;

  return (
    <div className="container px-4 py-6 max-w-5xl mx-auto">
      <TabNav />
      
      <div className="mt-6 space-y-6">
        {/* Organization Options */}
        <Card className="border-cream shadow-card overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-r from-sky-100 to-cream border-b border-cream">
            <CardTitle className="text-xl flex items-center gap-2">
              <Layout className="h-5 w-5 text-sky-500" />
              Organization
            </CardTitle>
            <CardDescription>Choose how to view your vocabulary</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex gap-4 flex-wrap">
              <Button 
                variant={organizationType === 'ai' ? "default" : "outline"}
                className={`${organizationType === 'ai' ? 'bg-rust-500 hover:bg-rust-600' : 'border-rust-200'} flex gap-2 items-center`}
                onClick={() => setOrganizationType('ai')}
              >
                <Sparkles className="h-4 w-4" />
                Topics by AI
              </Button>
              <Button 
                variant={organizationType === 'collection' ? "default" : "outline"}
                className={`${organizationType === 'collection' ? 'bg-sky-500 hover:bg-sky-600' : 'border-sky-200'} flex gap-2 items-center`}
                onClick={() => setOrganizationType('collection')}
              >
                <Book className="h-4 w-4" />
                Created Collections
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Search Bar */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search vocabulary or collections..."
            className="w-full pl-10 border-cream focus-visible:ring-sky-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Collections Gallery */}
        <CollectionGallery 
          collections={mockCollections.filter(c => c.type === organizationType)}
          searchQuery={searchQuery}
          onCollectionSelect={handleCollectionSelect}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left column - Topics Input and Recommended Words */}
          <div className="md:col-span-1 space-y-6">
            <Card className="border-cream shadow-card overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-sky-100 to-cream border-b border-cream">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Book className="h-5 w-5 text-sky-500" />
                  Create Topic
                </CardTitle>
                <CardDescription>Generate or manage your vocabulary topics</CardDescription>
              </CardHeader>
              <CardContent className="pb-1 pt-4">
                <TopicInputForm onSubmit={handleGenerateTopic} />
              </CardContent>
              <CardFooter className="pt-0 pb-4 flex justify-end">
                <div className="text-sm text-muted-foreground">
                  {mockTopics.length} topics
                </div>
              </CardFooter>
            </Card>
            
            {/* Recommended Vocabulary */}
            <Card className="border-cream shadow-card overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-tan-100 to-cream border-b border-cream">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Plus className="h-4 w-4 text-rust-500" />
                  Recommended Words
                </CardTitle>
                <CardDescription>
                  Based on your current topics and learning progress
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <RecommendedVocabulary onAddToLibrary={handleAddToLibrary} />
              </CardContent>
            </Card>
          </div>
          
          {/* Right column - Topic List */}
          <div className="md:col-span-2">
            <Card className="border-cream shadow-card overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-sky-100 to-cream border-b border-cream">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="h-4 w-4 text-tan-500" />
                  Your Topics
                </CardTitle>
                <CardDescription>
                  Select a topic to filter your vocabulary
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <TopicList 
                  topics={mockTopics} 
                  selectedTopic={selectedTopic}
                  onSelectTopic={setSelectedTopic}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Collection Vocabulary Dialog */}
      <Dialog open={isCollectionDialogOpen} onOpenChange={setIsCollectionDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-rust-500" />
              {currentCollection?.name || 'Collection'}
            </DialogTitle>
            <DialogDescription>
              {currentCollection ? `${currentCollection.wordCount} words · ${currentCollection.progress}% complete` : ''}
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-cream/30">
                <tr>
                  <th className="text-left py-2 px-4 font-medium">Word</th>
                  <th className="text-left py-2 px-4 font-medium">Definition</th>
                  <th className="text-right py-2 px-4 font-medium">Last Reviewed</th>
                </tr>
              </thead>
              <tbody>
                {currentCollectionVocabulary.map(word => (
                  <tr key={word.id} className="border-b border-cream hover:bg-cream/20">
                    <td className="py-3 px-4 font-medium">{word.word}</td>
                    <td className="py-3 px-4">{word.definition}</td>
                    <td className="py-3 px-4 text-right text-muted-foreground">
                      {new Date(word.lastReviewed).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {currentCollectionVocabulary.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-muted-foreground">
                      No words found in this collection.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsCollectionDialogOpen(false)}>Close</Button>
            <Button className="bg-rust-500 hover:bg-rust-600">
              <BookOpen className="mr-2 h-4 w-4" />
              Study Collection
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Library;
