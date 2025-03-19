
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Topic {
  id: string;
  name: string;
  count: number;
  progress: number;
}

interface TopicListProps {
  topics: Topic[];
  selectedTopic: string | null;
  onSelectTopic: (topicId: string) => void;
}

const TopicList: React.FC<TopicListProps> = ({ 
  topics, 
  selectedTopic, 
  onSelectTopic 
}) => {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="space-y-2">
          {topics.map(topic => (
            <div 
              key={topic.id}
              onClick={() => onSelectTopic(topic.id)}
              className={cn(
                "p-3 rounded-md cursor-pointer transition-all",
                selectedTopic === topic.id 
                  ? "bg-cyan-50 border border-cyan-200 dark:bg-cyan-900/20 dark:border-cyan-800" 
                  : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
              )}
            >
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-medium text-sm">{topic.name}</h3>
                <span className="text-xs text-muted-foreground">{topic.count} words</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={topic.progress} className="h-2" />
                <span className="text-xs font-medium">{topic.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopicList;
