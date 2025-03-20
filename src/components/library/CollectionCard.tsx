
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Book, Clock, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Collection {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryColor: string;
  wordCount: number;
  lastStudied: string;
  progress: number;
}

interface CollectionCardProps {
  collection: Collection;
  isSelected?: boolean;
  onSelect: () => void;
}

const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  isSelected = false,
  onSelect
}) => {
  const getCategoryColorClass = (color: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-sm";
    
    switch (color) {
      case 'primary':
        return `${baseClasses} bg-primary/20 text-primary`;
      case 'secondary':
        return `${baseClasses} bg-secondary/20 text-secondary`;
      case 'tertiary':
        return `${baseClasses} bg-tertiary/20 text-tertiary`;
      case 'quaternary':
        return `${baseClasses} bg-quaternary/20 text-tertiary`;
      default:
        return `${baseClasses} bg-gray-200 text-gray-700`;
    }
  };
  
  const getProgressColor = (progress: number) => {
    if (progress < 40) return 'bg-primary';
    if (progress < 70) return 'bg-secondary';
    return 'bg-primary';
  };
  
  return (
    <div 
      className={cn(
        "collection-card bg-white rounded-xl p-6 shadow-sm border cursor-pointer transition-all",
        isSelected ? "border-primary" : "border-gray-100",
        "hover:translate-y-[-4px] hover:shadow-md"
      )}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-4">
        <span className={getCategoryColorClass(collection.categoryColor)}>
          {collection.category.charAt(0).toUpperCase() + collection.category.slice(1)}
        </span>
        <div className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-pointer">
          <MoreHorizontal className="h-5 w-5" />
        </div>
      </div>
      
      <h3 className="text-xl font-bold mb-2">{collection.name}</h3>
      <p className="text-gray-600 text-sm mb-4">{collection.description}</p>
      
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Book className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-600">{collection.wordCount} words</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-400" />
          <span className="text-sm text-gray-600">Last studied: {collection.lastStudied}</span>
        </div>
      </div>
      
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getProgressColor(collection.progress)}`} 
          style={{ width: `${collection.progress}%` }}
        />
      </div>
    </div>
  );
};

export default CollectionCard;
