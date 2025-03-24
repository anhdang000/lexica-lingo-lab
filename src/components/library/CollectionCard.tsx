import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Book, Clock } from 'lucide-react';

interface Collection {
  id: string;
  name: string;
  description: string;
  word_count: number;
  created_at: string;
  updated_at: string;
}

interface CollectionCardProps {
  collection: Collection;
  isSelected?: boolean;
  onSelect?: () => void;
}

// Helper function to capitalize collection title
const capitalizeTitle = (title: string) => {
  return title
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  isSelected = false,
  onSelect,
}) => {
  return (
    <Card
      className={cn(
        'p-4 cursor-pointer transition-all hover:border-primary/50',
        isSelected && 'border-primary bg-primary/5'
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded">
          <Book className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold line-clamp-1">{capitalizeTitle(collection.name)}</h4>
          <blockquote className="my-2 border-l-2 border-gray-200 pl-3 italic text-sm text-gray-600 line-clamp-2">
            {collection.description}
          </blockquote>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{collection.word_count} words</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Updated {formatDistanceToNow(new Date(collection.updated_at))} ago
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CollectionCard;
