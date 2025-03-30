import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Book, Clock, GraduationCap, Sparkles } from 'lucide-react';
import { useVocabulary } from './VocabularyProvider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Collection {
  id: string;
  name: string;
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
  const { collectionPracticeStats } = useVocabulary();
  const stats = collectionPracticeStats.get(collection.id);
  const progressPercentage = stats?.percentage || 0;
  const practicedWords = stats?.practicedWords || 0;
  const totalWords = stats?.totalWords || collection.word_count || 0;
  
  // Determine card gradient based on progress
  const getProgressGradient = () => {
    if (progressPercentage >= 80) return 'from-emerald-50 to-emerald-100/50';
    if (progressPercentage >= 50) return 'from-blue-50 to-blue-100/50';
    if (progressPercentage >= 20) return 'from-amber-50 to-amber-100/50';
    return 'from-white to-white';
  };
  
  // Determine progress bar color based on progress
  const getProgressColor = () => {
    if (progressPercentage >= 80) return 'bg-emerald-500';
    if (progressPercentage >= 50) return 'bg-blue-500';
    if (progressPercentage >= 20) return 'bg-amber-500';
    return 'bg-primary';
  };
  
  // Badge label for progress state
  const getProgressBadge = () => {
    if (progressPercentage >= 90) return { icon: <Sparkles className="h-3 w-3 mr-1" />, text: 'Mastered', class: 'bg-emerald-100 text-emerald-700' };
    if (progressPercentage >= 70) return { icon: <GraduationCap className="h-3 w-3 mr-1" />, text: 'Advanced', class: 'bg-blue-100 text-blue-700' };
    if (progressPercentage >= 10) return { icon: null, text: 'In Progress', class: 'bg-amber-100 text-amber-700' };
    return { icon: null, text: 'Just Started', class: 'bg-gray-100 text-gray-700' };
  };
  
  const progressBadge = getProgressBadge();
  
  return (
    <Card
      className={cn(
        'overflow-hidden transition-all duration-300 hover:shadow-md',
        'border hover:border-primary/70',
        isSelected ? 'border-primary shadow-md' : 'border-gray-200',
        progressPercentage > 0 ? `bg-gradient-to-br ${getProgressGradient()}` : ''
      )}
      onClick={onSelect}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={cn(
            "p-2 rounded-lg",
            isSelected ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
          )}>
            <Book className="h-5 w-5" />
          </div>
          
          {progressPercentage > 0 && (
            <div className={cn(
              "text-xs px-2 py-1 rounded-full flex items-center",
              progressBadge.class
            )}>
              {progressBadge.icon}
              {progressBadge.text}
            </div>
          )}
        </div>
        
        <h4 className="font-bold text-lg mb-1 line-clamp-1">{capitalizeTitle(collection.name)}</h4>
        
        {/* Progress Line with tooltip */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="my-3 w-full">
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500 ease-in-out",
                      getProgressColor()
                    )}
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Learning Progress: {Math.round(progressPercentage)}%</p>
              <p className="text-xs text-gray-500">Practiced {practicedWords} of {totalWords} words</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-2">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-primary rounded-full mr-1.5"></div>
            <span>{totalWords} words</span>
          </div>
          
          <div className="flex items-center">
            <Clock className="h-3.5 w-3.5 mr-1 text-gray-400" />
            <span>{formatDistanceToNow(new Date(collection.updated_at))} ago</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CollectionCard;
