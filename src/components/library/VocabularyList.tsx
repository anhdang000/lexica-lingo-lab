
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Play, Check, BookOpen, InfoIcon } from 'lucide-react';

// Mock vocabulary data
const mockVocabulary = [
  { id: '1', word: 'Acquisition', definition: 'The act of acquiring something', topicId: '1', lastReviewed: '2023-10-15', reviewCount: 5 },
  { id: '2', word: 'Diversification', definition: 'The action of making diverse', topicId: '1', lastReviewed: '2023-10-20', reviewCount: 3 },
  { id: '3', word: 'Algorithm', definition: 'A process or set of rules to be followed in calculations', topicId: '2', lastReviewed: '2023-10-18', reviewCount: 7 },
  { id: '4', word: 'Cryptocurrency', definition: 'A digital currency using encryption techniques', topicId: '2', lastReviewed: '2023-10-25', reviewCount: 2 },
  { id: '5', word: 'Diagnostic', definition: 'Relating to the identification of a condition', topicId: '3', lastReviewed: '2023-10-10', reviewCount: 6 },
  { id: '6', word: 'Itinerary', definition: 'A planned route of a journey', topicId: '4', lastReviewed: '2023-10-22', reviewCount: 4 },
  { id: '7', word: 'Thesis', definition: 'A statement or theory put forward to be maintained or proved', topicId: '5', lastReviewed: '2023-10-17', reviewCount: 1 },
];

interface VocabularyListProps {
  topicId: string | null;
  searchQuery: string;
  sortBy: string;
}

const VocabularyList: React.FC<VocabularyListProps> = ({ topicId, searchQuery, sortBy }) => {
  // Filter by topic if one is selected
  let filteredVocabulary = topicId 
    ? mockVocabulary.filter(v => v.topicId === topicId) 
    : mockVocabulary;
  
  // Apply search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredVocabulary = filteredVocabulary.filter(
      v => v.word.toLowerCase().includes(query) || v.definition.toLowerCase().includes(query)
    );
  }
  
  // Apply sorting
  switch (sortBy) {
    case 'date':
      filteredVocabulary = [...filteredVocabulary].sort((a, b) => 
        new Date(b.lastReviewed).getTime() - new Date(a.lastReviewed).getTime()
      );
      break;
    case 'most-reviewed':
      filteredVocabulary = [...filteredVocabulary].sort((a, b) => b.reviewCount - a.reviewCount);
      break;
    case 'least-reviewed':
      filteredVocabulary = [...filteredVocabulary].sort((a, b) => a.reviewCount - b.reviewCount);
      break;
    // For 'user' and 'ai' categories, we would typically fetch pre-categorized data
    // from the backend, but for this mock we'll just use the default sorting
  }
  
  if (filteredVocabulary.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No vocabulary found.</p>
        {searchQuery && (
          <p className="text-sm mt-2">Try a different search term or topic.</p>
        )}
      </div>
    );
  }
  
  return (
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
          {filteredVocabulary.map(vocab => (
            <TableRow key={vocab.id}>
              <TableCell className="font-medium">{vocab.word}</TableCell>
              <TableCell className="hidden sm:table-cell">{vocab.definition}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" title="View Details">
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
  );
};

export default VocabularyList;
