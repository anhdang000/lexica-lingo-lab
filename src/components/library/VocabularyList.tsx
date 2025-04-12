import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Play, Check, BookOpen, InfoIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import WordDetailModal from '@/components/WordDetailModal';

interface VocabularyWord {
  id: string;
  word: string;
  word_variant_id: string;
  phonetics: string | null;
  part_of_speech: string | null;
  definitions: string[];
  examples: string[] | null;
  status: string;
  last_reviewed_at: string | null;
  review_count: number;
}

interface VocabularyListProps {
  collectionId: string | null;
  searchQuery: string;
  sortBy: string;
}

const VocabularyList: React.FC<VocabularyListProps> = ({ collectionId, searchQuery, sortBy }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([]);
  const [selectedWord, setSelectedWord] = useState<VocabularyWord | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  
  useEffect(() => {
    const fetchVocabulary = async () => {
      if (!user) return;
      
      setLoading(true);
      
      try {
        let query = supabase
          .from('collection_words')
          .select(`
            id,
            status,
            last_reviewed_at,
            review_count,
            words:word_variant_id (
              word_id,
              word_variant_id,
              word,
              phonetics,
              part_of_speech,
              definitions,
              examples
            )
          `)
          .eq('user_id', user.id);
        
        if (collectionId) {
          query = query.eq('collection_id', collectionId);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error fetching vocabulary:', error);
          return;
        }
        
        // Transform and flatten the nested data
        const transformedData = data.map(item => ({
          id: item.id,
          word_variant_id: item.words.word_variant_id,
          word: item.words.word,
          phonetics: item.words.phonetics,
          part_of_speech: item.words.part_of_speech,
          definitions: item.words.definitions,
          examples: item.words.examples,
          status: item.status,
          last_reviewed_at: item.last_reviewed_at,
          review_count: item.review_count || 0
        }));
        
        // Apply search filter
        let filteredVocabulary = transformedData;
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filteredVocabulary = filteredVocabulary.filter(v => 
            v.word.toLowerCase().includes(query) || 
            v.definitions.some(def => def.toLowerCase().includes(query))
          );
        }
        
        // Apply sorting
        switch (sortBy) {
          case 'date':
            filteredVocabulary = [...filteredVocabulary].sort((a, b) => 
              new Date(b.last_reviewed_at || '1970-01-01').getTime() - 
              new Date(a.last_reviewed_at || '1970-01-01').getTime()
            );
            break;
          case 'most-reviewed':
            filteredVocabulary = [...filteredVocabulary].sort((a, b) => 
              b.review_count - a.review_count
            );
            break;
          case 'least-reviewed':
            filteredVocabulary = [...filteredVocabulary].sort((a, b) => 
              a.review_count - b.review_count
            );
            break;
          default:
            // Default sorting by word
            filteredVocabulary = [...filteredVocabulary].sort((a, b) => 
              a.word.localeCompare(b.word)
            );
        }
        
        setVocabulary(filteredVocabulary);
      } catch (error) {
        console.error('Exception fetching vocabulary:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVocabulary();
  }, [user, collectionId, searchQuery, sortBy]);
  
  const handleOpenDetails = (word: VocabularyWord) => {
    setSelectedWord(word);
    setDetailModalOpen(true);
  };
  
  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }
  
  if (vocabulary.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No vocabulary found.</p>
        {searchQuery && (
          <p className="text-sm mt-2">Try a different search term or collection.</p>
        )}
      </div>
    );
  }
  
  return (
    <>
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Word</TableHead>
              <TableHead className="hidden sm:table-cell">Definition</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vocabulary.map(vocab => (
              <TableRow key={vocab.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {vocab.word}
                    {vocab.part_of_speech && (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-800">
                        {vocab.part_of_speech}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {vocab.definitions?.[0] ? vocab.definitions[0] : 'No definition available'}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" title="View Details" onClick={() => handleOpenDetails(vocab)}>
                      <InfoIcon className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Study">
                      <BookOpen className="h-4 w-4 text-amber-500" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Practice">
                      <Play className="h-4 w-4 text-green-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {selectedWord && (
        <WordDetailModal 
          open={detailModalOpen} 
          onOpenChange={setDetailModalOpen}
          word={{
            word: selectedWord.word,
            phonetics: selectedWord.phonetics || undefined,
            part_of_speech: selectedWord.part_of_speech || undefined,
            definitions: selectedWord.definitions,
            examples: selectedWord.examples || undefined,
          }}
        />
      )}
    </>
  );
};

export default VocabularyList;
