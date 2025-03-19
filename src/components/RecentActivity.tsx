
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Link as LinkIcon, Image, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data for recent activity
const mockActivities = [
  {
    id: 1,
    type: 'text',
    title: 'Business Article Analysis',
    words: 15,
    timestamp: '2 hours ago',
  },
  {
    id: 2,
    type: 'url',
    title: 'https://news-article.com/tech-innovation',
    words: 23,
    timestamp: '1 day ago',
  },
  {
    id: 3,
    type: 'image',
    title: 'Conference Slide Deck',
    words: 8,
    timestamp: '3 days ago',
  },
];

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'text':
      return <FileText className="w-4 h-4 text-amber-500" />;
    case 'url':
      return <LinkIcon className="w-4 h-4 text-cyan-500" />;
    case 'image':
      return <Image className="w-4 h-4 text-purple-500" />;
    default:
      return <FileText className="w-4 h-4 text-amber-500" />;
  }
};

const RecentActivity: React.FC = () => {
  return (
    <Card className="glass dark:glass-dark border-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 -z-10" />
      <CardContent className="p-6">
        <div className="space-y-4">
          {mockActivities.map((activity) => (
            <div 
              key={activity.id} 
              className="flex items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                activity.type === 'text' ? "bg-amber-100 dark:bg-amber-900/30" : "",
                activity.type === 'url' ? "bg-cyan-100 dark:bg-cyan-900/30" : "",
                activity.type === 'image' ? "bg-purple-100 dark:bg-purple-900/30" : ""
              )}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="ml-4 flex-grow">
                <h3 className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                  {activity.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {activity.words} new words extracted
                </p>
              </div>
              <div className="flex items-center text-xs text-gray-400">
                <Clock className="w-3 h-3 mr-1" />
                {activity.timestamp}
              </div>
            </div>
          ))}
          
          {mockActivities.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
