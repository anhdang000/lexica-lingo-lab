
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Library, Dumbbell, UserCircle } from 'lucide-react';

const TabNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  // Handle tab change
  const handleTabChange = (value: string) => {
    navigate(value);
  };

  // Determine active tab based on current path
  const determineActiveTab = () => {
    if (currentPath === '/library') return '/library';
    if (currentPath === '/practice') return '/practice';
    if (currentPath === '/profile') return '/profile';
    return '/'; // Default to home
  };

  return (
    <div className="w-full flex justify-center mb-6 mt-4">
      <Tabs value={determineActiveTab()} onValueChange={handleTabChange} className="w-full max-w-md">
        <TabsList className="grid grid-cols-4 h-12 rounded-xl bg-amber-50/80 dark:bg-gray-800/60 backdrop-blur-sm w-full">
          <TabsTrigger 
            value="/" 
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400"
          >
            Home
          </TabsTrigger>
          <TabsTrigger 
            value="/library" 
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-cyan-600 dark:data-[state=active]:text-cyan-400"
          >
            <Library className="h-4 w-4 mr-2" />
            Library
          </TabsTrigger>
          <TabsTrigger 
            value="/practice" 
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400"
          >
            <Dumbbell className="h-4 w-4 mr-2" />
            Practice
          </TabsTrigger>
          <TabsTrigger 
            value="/profile" 
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400"
          >
            <UserCircle className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default TabNav;
