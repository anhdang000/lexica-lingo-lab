import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { BookOpen, Play, Settings } from 'lucide-react';

// Mock collection data
const mockCollections = [
  { id: '1', name: 'Business Terms', wordCount: 42, lastStudied: '2023-10-15', type: 'ai' },
  { id: '2', name: 'Tech Vocabulary', wordCount: 38, lastStudied: '2023-10-20', type: 'ai' },
  { id: '3', name: 'Medical Terms', wordCount: 56, lastStudied: '2023-10-18', type: 'ai' },
  { id: '4', name: 'Travel Essentials', wordCount: 24, lastStudied: '2023-10-25', type: 'collection' },
  { id: '5', name: 'Academic Writing', wordCount: 31, lastStudied: '2023-10-17', type: 'collection' },
];

interface CollectionListProps {
  searchQuery: string;
  sortBy: string;
}

const CollectionList: React.FC<CollectionListProps> = ({ searchQuery, sortBy }) => {
  // Filter collections based on search query and type
  let filteredCollections = mockCollections.filter(collection => 
    (sortBy === 'ai' ? collection.type === 'ai' : collection.type === 'collection') &&
    (!searchQuery || collection.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (filteredCollections.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No collections found.</p>
        {searchQuery && (
          <p className="text-sm mt-2">Try a different search term.</p>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Collection Name</TableHead>
            <TableHead className="hidden sm:table-cell">Words</TableHead>
            <TableHead className="hidden sm:table-cell">Last Studied</TableHead>
            <TableHead className="w-[100px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCollections.map(collection => (
            <TableRow key={collection.id}>
              <TableCell className="font-medium">{collection.name}</TableCell>
              <TableCell className="hidden sm:table-cell">{collection.wordCount} words</TableCell>
              <TableCell className="hidden sm:table-cell">{new Date(collection.lastStudied).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" title="Settings">
                    <Settings className="h-4 w-4 text-gray-500" />
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

export default CollectionList;