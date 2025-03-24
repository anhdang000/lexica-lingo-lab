import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  ArrowDownAZ, 
  Play, 
  Pencil, 
  Volume2,
  Star,
  Plus,
  Check,
  Wand2,
  Book
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import CollectionCard from '@/components/library/CollectionCard';
import { useVocabulary } from '@/components/library/VocabularyProvider';
import { useAuth } from '@/contexts/AuthContext';

const Library: React.FC = () => {
  const { user } = useAuth();
  const { 
    collections, 
    isLoading, 
    selectedCollectionId,
    setSelectedCollectionId,
    collectionWords,
    isLoadingWords 
  } = useVocabulary();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedWords, setExpandedWords] = useState<Set<string>>(new Set());
  
  // Group words by word_id to avoid duplicates
  const groupedWords = useMemo(() => {
    if (!collectionWords.length) return [];
    
    // Create a map of word_id to word entries
    const wordMap = new Map();
    
    collectionWords.forEach(item => {
      if (!wordMap.has(item.word_id)) {
        // Create a new entry for this word with its first meaning
        wordMap.set(item.word_id, {
          ...item,
          // Use the all_meanings array if available, otherwise create one
          all_meanings: item.all_meanings || [item.meanings]
        });
      } else if (!wordMap.get(item.word_id).all_meanings?.some(m => m.id === item.meanings.id)) {
        // Add this meaning to the existing word if it doesn't already exist
        const existingEntry = wordMap.get(item.word_id);
        if (existingEntry.all_meanings) {
          existingEntry.all_meanings.push(item.meanings);
        } else {
          existingEntry.all_meanings = [existingEntry.meanings, item.meanings];
        }
      }
    });
    
    // Convert the map to an array
    return Array.from(wordMap.values());
  }, [collectionWords]);

  // Filter collections based on search
  const filteredCollections = collections.filter(collection => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      collection.name.toLowerCase().includes(query) ||
      (collection.description?.toLowerCase() || '').includes(query)
    );
  });

  const handleWordDetailClick = (wordId: string) => {
    setExpandedWords((prev) => {
      const next = new Set(prev);
      if (next.has(wordId)) {
        next.delete(wordId);
      } else {
        next.add(wordId);
      }
      return next;
    });
  };

  const playAudio = (audioUrl?: string) => {
    if (audioUrl) {
      new Audio(audioUrl).play().catch((error) => {
        console.error('Error playing audio:', error);
        toast.error('Failed to play pronunciation');
      });
    }
  };

  const getPartOfSpeechStyle = (pos: string) => {
    switch (pos?.toLowerCase()) {
      case 'noun':
        return 'bg-primary/10 text-primary';
      case 'verb':
        return 'bg-secondary/10 text-secondary';
      case 'adjective':
        return 'bg-[#dea47e]/20 text-[#9e6240]';
      case 'adverb':
        return 'bg-[#81adc8]/20 text-[#81adc8]';
      case 'pronoun':
        return 'bg-[#f8f2dc]/40 text-[#9e6240]';
      case 'preposition':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'conjunction':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'interjection':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const capitalize = (str: string) => {
    return str.replace(/\b\w/g, char => char.toUpperCase());
  };
  
  // Helper function to capitalize the title
  const capitalizeTitle = (title: string) => {
    return title
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

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
            {/* Left Panel - Collections */}
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
                {isLoading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Loading collections...</p>
                  </div>
                ) : (
                  <>
                    {filteredCollections.map(collection => (
                      <CollectionCard 
                        key={collection.id}
                        collection={collection}
                        isSelected={selectedCollectionId === collection.id}
                        onSelect={() => setSelectedCollectionId(collection.id)}
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
                  </>
                )}
              </div>
            </div>
            
            {/* Right Panel - Vocabulary List */}
            {selectedCollectionId ? (
              <div className="flex-1 bg-white rounded-xl p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold">
                    {collections.find(c => c.id === selectedCollectionId)?.name && 
                     capitalizeTitle(collections.find(c => c.id === selectedCollectionId)?.name || '')}
                  </h3>
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
                  {collections.find(c => c.id === selectedCollectionId)?.description}
                </blockquote>
                
                {isLoadingWords ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Loading words...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {groupedWords.map((item) => {
                      const isExpanded = expandedWords.has(item.word_id);
                      const hasAudio = item.words.audio_url;
                      // Default to first meaning if no specific meaning structure
                      const primaryMeaning = item.meanings || (item.all_meanings && item.all_meanings[0]);

                      return (
                        <div
                          key={item.word_id}
                          className={cn(
                            'collection-card relative group rounded-xl p-4',
                            'border',
                            isExpanded 
                              ? 'border-[#cd4631]/90 shadow-xl' 
                              : 'border-gray-200 dark:border-gray-700',
                            'backdrop-blur-sm bg-white/30 dark:bg-gray-800/30',
                            'cursor-pointer',
                            'transition-all duration-300 ease-in-out'
                          )}
                          onClick={() => handleWordDetailClick(item.word_id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h4 
                                className="text-xl font-bold text-[#cd4631] dark:text-[#de6950]"
                              >
                                {item.words.word}
                              </h4>
                              {item.words.phonetic && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                    /{item.words.phonetic}/
                                  </span>
                                  {hasAudio && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 hover:text-[#cd4631] hover:bg-[#cd4631]/10"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        playAudio(item.words.audio_url);
                                      }}
                                    >
                                      <Volume2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              )}
                              {primaryMeaning.part_of_speech && (
                                <span className={cn(
                                  'text-[11px] px-2 py-0.5 rounded-full font-medium transition-colors',
                                  getPartOfSpeechStyle(primaryMeaning.part_of_speech)
                                )}>
                                  {primaryMeaning.part_of_speech}
                                </span>
                              )}
                            </div>
                            <button 
                              className="text-[#cd4631] transition-transform duration-300 ease-in-out"
                              aria-label={isExpanded ? "Collapse" : "Expand"}
                            >
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                width="24" 
                                height="24" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                                className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}
                              >
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                            </button>
                          </div>

                          {/* First meaning - always visible */}
                          <div className="group/def space-y-2">
                            <p className="text-gray-800 dark:text-gray-200 text-base">
                              {isExpanded && item.all_meanings && item.all_meanings.length > 1 ? "1. " : ""}
                              {primaryMeaning.definition}
                            </p>
                            {primaryMeaning.examples && primaryMeaning.examples.length > 0 && (
                              <div
                                className="pl-6 border-l-2 border-[#cd4631]/30 group-hover/def:border-[#cd4631]
                                          transition-colors duration-300"
                              >
                                <p className="text-gray-600 dark:text-gray-400 italic text-sm">
                                  {primaryMeaning.examples[0]}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Show indication of more definitions in compact mode */}
                          {!isExpanded && item.all_meanings && item.all_meanings.length > 1 && (
                            <p className="text-xs text-gray-500 mt-3 pl-4 border-l-2 border-gray-200">
                              + {item.all_meanings.length - 1} more definition
                              {item.all_meanings.length > 2 ? 's' : ''}
                            </p>
                          )}

                          {/* Additional meanings - with smooth animation */}
                          <div
                            className={cn(
                              'mt-4 space-y-4',
                              'overflow-hidden transition-all duration-500 ease-in-out',
                              isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                            )}
                          >
                            {item.all_meanings && item.all_meanings.length > 1 && (
                              <div className="space-y-4">
                                {item.all_meanings.slice(1).map((meaning, idx) => (
                                  <div key={idx} className="group/def space-y-2">
                                    <p className="text-gray-800 dark:text-gray-200 text-base">
                                      {idx + 2}. {meaning.definition}
                                    </p>
                                    {meaning.examples && meaning.examples.length > 0 && (
                                      <div
                                        className="pl-6 border-l-2 border-[#cd4631]/30 group-hover/def:border-[#cd4631]
                                                  transition-colors duration-300"
                                      >
                                        <p className="text-gray-600 dark:text-gray-400 italic text-sm">
                                          {meaning.examples[0]}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Word Forms & Phrases section - with smooth animation */}
                          <div
                            className={cn(
                              'mt-6 pt-4 border-t border-gray-200/50 dark:border-gray-700/50',
                              'overflow-hidden transition-all duration-500 ease-in-out',
                              isExpanded ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0 border-t-0'
                            )}
                          >
                            {item.words.stems && item.words.stems.length > 0 && (
                              <>
                                <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">
                                  Word Forms & Phrases:
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                  {item.words.stems.map((stem, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2.5 py-1 text-xs bg-[#f8f2dc] dark:bg-[#cd4631]/10
                                               text-[#9e6240] dark:text-[#dea47e] rounded-full
                                               hover:bg-[#f8f2dc]/70 dark:hover:bg-[#cd4631]/20
                                               transition-colors duration-200"
                                    >
                                      {stem}
                                    </span>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {groupedWords.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-gray-500">No vocabulary items found in this collection.</p>
                      </div>
                    )}
                  </div>
                )}
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

      {/* Hover and click effect styles */}
      <style>{`
        .collection-card {
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.3s;
        }
        .collection-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 12px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
};

export default Library;
