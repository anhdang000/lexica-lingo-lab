
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Grid3X3, BookOpen, Calendar } from 'lucide-react';

interface Collection {
  id: string;
  name: string;
  wordCount: number;
  lastStudied: string;
  progress: number;
  type: string;
  imageUrl?: string;
}

interface CollectionGalleryProps {
  collections: Collection[];
  searchQuery: string;
  onCollectionSelect: (collectionId: string) => void;
}

const CollectionGallery: React.FC<CollectionGalleryProps> = ({ 
  collections, 
  searchQuery,
  onCollectionSelect
}) => {
  // Filter collections based on search
  const filteredCollections = collections.filter(
    collection => !searchQuery || collection.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filteredCollections.length === 0) {
    return (
      <div className="py-12 text-center">
        <Grid3X3 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
        <h3 className="text-lg font-medium text-muted-foreground">No collections found</h3>
        {searchQuery && (
          <p className="text-sm text-muted-foreground mt-2">
            Try a different search term or create a new collection
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredCollections.map(collection => (
        <Card 
          key={collection.id}
          className="border-cream overflow-hidden shadow-card hover:shadow-card-hover transition-all cursor-pointer"
          onClick={() => onCollectionSelect(collection.id)}
        >
          <div 
            className="h-32 bg-gradient-to-br from-rust-100 to-cream flex items-center justify-center"
          >
            {collection.imageUrl ? (
              <img 
                src={collection.imageUrl} 
                alt={collection.name} 
                className="h-20 w-20 object-contain"
              />
            ) : (
              <BookOpen className="h-16 w-16 text-rust-300" />
            )}
          </div>
          
          <CardContent className="pt-4">
            <h3 className="font-medium text-lg mb-1 line-clamp-1">{collection.name}</h3>
            <div className="flex justify-between items-center text-sm text-muted-foreground mb-2">
              <span>{collection.wordCount} words</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(collection.lastStudied).toLocaleDateString()}</span>
              </div>
            </div>
            <Progress 
              value={collection.progress} 
              className="h-2"
              style={{
                background: 'var(--cream)',
                '--progress-color': collection.progress < 30 ? 'var(--rust-500)' : 
                                    collection.progress < 70 ? 'var(--tan-500)' : 
                                    'var(--sky-500)',
              } as React.CSSProperties}
            />
          </CardContent>
          
          <CardFooter className="pt-0 pb-4">
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">{collection.progress}%</span> complete
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default CollectionGallery;
