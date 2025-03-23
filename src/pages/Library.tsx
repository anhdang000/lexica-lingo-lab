import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogClose,
  DialogFooter
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TabNav from '@/components/TabNav';
import { 
  Folder, 
  Search, 
  Plus, 
  Upload, 
  Tag, 
  Book, 
  Filter, 
  ArrowDownAZ, 
  Clock, 
  Play, 
  Pencil, 
  MoreHorizontal,
  X,
  Volume2,
  Star,
  Wand2
} from 'lucide-react';
import { toast } from 'sonner';
import CollectionCard from '@/components/library/CollectionCard';
import VocabularyItem from '@/components/library/VocabularyItem';
import CreateCollectionForm from '@/components/library/CreateCollectionForm';
import ImportWordsForm from '@/components/library/ImportWordsForm';

// Mock vocabulary data
const mockVocabulary = {
  business: [
    { 
      word: "Acquisition", 
      phonetic: "/ˌækwɪˈzɪʃən/", 
      partOfSpeech: "noun", 
      definition: "The purchase of one company by another", 
      example: "The tech giant announced the acquisition of a promising startup." 
    },
    { 
      word: "Revenue", 
      phonetic: "/ˈrevənuː/", 
      partOfSpeech: "noun", 
      definition: "Income generated from business activities", 
      example: "The company's quarterly revenue exceeded expectations." 
    },
    { 
      word: "Stakeholder", 
      phonetic: "/ˈsteɪkˌhoʊldər/", 
      partOfSpeech: "noun", 
      definition: "Person or entity with interest in a business", 
      example: "The stakeholders met to discuss the company's future." 
    }
  ],
  tech: [
    { 
      word: "Algorithm", 
      phonetic: "/ˈælɡəˌrɪðəm/", 
      partOfSpeech: "noun", 
      definition: "A step-by-step procedure for solving a problem", 
      example: "The search engine uses a complex algorithm to rank results." 
    },
    { 
      word: "API", 
      phonetic: "/ˌeɪ piː ˈaɪ/", 
      partOfSpeech: "noun", 
      definition: "Application Programming Interface", 
      example: "Developers use the API to integrate with our platform." 
    },
    { 
      word: "Backend", 
      phonetic: "/ˈbækˌend/", 
      partOfSpeech: "noun", 
      definition: "Server-side of an application", 
      example: "The backend processes all user requests." 
    }
  ],
  academic: [
    { 
      word: "Hypothesis", 
      phonetic: "/haɪˈpɒθəsɪs/", 
      partOfSpeech: "noun", 
      definition: "A proposed explanation for a phenomenon", 
      example: "The researchers developed a hypothesis about climate change." 
    },
    { 
      word: "Methodology", 
      phonetic: "/ˌmeθəˈdɒlədʒi/", 
      partOfSpeech: "noun", 
      definition: "System of methods used in research", 
      example: "The study's methodology was peer-reviewed." 
    },
    { 
      word: "Analysis", 
      phonetic: "/əˈnæləsɪs/", 
      partOfSpeech: "noun", 
      definition: "Detailed examination of elements", 
      example: "The data analysis revealed interesting patterns." 
    }
  ]
};

// Mock collections data
const mockCollections = [
  { 
    id: '123e4567-e89b-12d3-a456-426614174000', 
    name: 'Essential Business Terms', 
    description: 'Key vocabulary for professional communication and business meetings',
    word_count: 120,
    created_at: '2025-03-22T10:30:00Z',
    updated_at: '2025-03-23T08:15:00Z'
  },
  { 
    id: '987fcdeb-51d3-12d3-a456-426614174001', 
    name: 'Tech Industry Vocabulary', 
    description: 'Modern technology and software development terminology',
    word_count: 85,
    created_at: '2025-03-21T15:45:00Z',
    updated_at: '2025-03-23T09:20:00Z'
  },
  { 
    id: '456abc89-12d3-a456-426614174002', 
    name: 'Scientific Research Terms', 
    description: 'Advanced vocabulary for academic papers and research',
    word_count: 150,
    created_at: '2025-03-20T11:00:00Z',
    updated_at: '2025-03-22T16:30:00Z'
  }
];

const Library: React.FC = () => {
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  
  // Get the current collection's vocabulary
  const currentCollection = selectedCollection 
    ? mockCollections.find(c => c.id === selectedCollection) 
    : null;
  
  // Update the current collection check since we removed category
  const currentVocabulary = currentCollection 
    ? mockVocabulary.business // Temporarily using business vocabulary for demo
    : [];
  
  // Filter collections based on search
  const filteredCollections = mockCollections.filter(collection => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      collection.name.toLowerCase().includes(query) ||
      collection.description.toLowerCase().includes(query)
    );
  });
  
  return (
    <div className="container px-4 py-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold">My Library</h2>
        <p className="text-gray-600 mt-2">Easily manage your vocabulary, sorted into topics with AI-powered categorization.</p>
      </div>
      
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input 
                  type="text" 
                  placeholder="Search words or collections..." 
                  className="w-full pl-12"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
              >
                <ArrowDownAZ className="h-5 w-5" />
                Sort
              </Button>
            </div>
          </div>
          
          <div className="flex gap-6">
            {/* Left Panel - Create Topic + Collections */}
            <div className="w-[400px]">
              <Card className="bg-[#fdf8f3] mb-6 border-gray-100">
                <CardContent className="p-6">
                  <div className="flex flex-col h-full">
                    <h3 className="text-lg font-medium mb-3">Create Topic</h3>
                    <p className="text-sm text-gray-600 mb-4">Generate or manage your vocabulary topics</p>
                    <Input 
                      type="text" 
                      placeholder="Enter prompt for a collection" 
                      className="mb-4 border-gray-200"
                    />
                    <Button 
                      className="mt-auto w-full bg-primary hover:bg-primary/90"
                    >
                      <Wand2 className="mr-2 h-5 w-5" />
                      Generate Vocabulary
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <div className="space-y-4">
                {filteredCollections.map(collection => (
                  <CollectionCard 
                    key={collection.id}
                    collection={collection}
                    isSelected={selectedCollection === collection.id}
                    onSelect={() => setSelectedCollection(collection.id)}
                  />
                ))}
                
                {filteredCollections.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No collections found.</p>
                    {searchQuery && (
                      <p className="text-sm text-gray-400 mt-2">Try a different search term.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Panel - Vocabulary List */}
            {selectedCollection ? (
              <div className="flex-1 bg-white rounded-xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold">{currentCollection?.name}</h3>
                  <div className="flex gap-4">
                    <Button variant="outline" className="flex items-center gap-2">
                      <Pencil className="h-5 w-5" />
                      Edit
                    </Button>
                    <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90">
                      <Play className="h-5 w-5" />
                      Start Learning
                    </Button>
                  </div>
                </div>

                <blockquote className="mb-6 border-l-2 border-gray-200 pl-4 italic text-gray-600">
                  {currentCollection?.description}
                </blockquote>
                
                <div className="space-y-4">
                  {currentVocabulary.map((item, index) => (
                    <VocabularyItem key={index} item={item} />
                  ))}
                  
                  {currentVocabulary.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No vocabulary items found in this collection.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-white/50 rounded-xl border border-gray-100 border-dashed">
                <div className="text-center py-12 px-4">
                  <Book className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 mb-2">Select a collection</h3>
                  <p className="text-sm text-gray-400">Choose a collection from the left to view its vocabulary</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Library;
