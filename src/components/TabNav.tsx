
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Library, Dumbbell, UserCircle, Home } from 'lucide-react';

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
        <TabsList className="grid grid-cols-4 h-12 rounded-xl bg-cream/80 dark:bg-brown-900/60 backdrop-blur-sm w-full">
          <TabsTrigger 
            value="/" 
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-brown-800 data-[state=active]:text-rust-500 dark:data-[state=active]:text-rust-400 gap-1.5"
          >
            <Home className="h-4 w-4" />
            Home
          </TabsTrigger>
          <TabsTrigger 
            value="/library" 
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-brown-800 data-[state=active]:text-sky-500 dark:data-[state=active]:text-sky-400 gap-1.5"
          >
            <Library className="h-4 w-4" />
            Library
          </TabsTrigger>
          <TabsTrigger 
            value="/practice" 
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-brown-800 data-[state=active]:text-tan-500 dark:data-[state=active]:text-tan-400 gap-1.5"
          >
            <Dumbbell className="h-4 w-4" />
            Practice
          </TabsTrigger>
          <TabsTrigger 
            value="/profile" 
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-brown-800 data-[state=active]:text-brown-600 dark:data-[state=active]:text-brown-400 gap-1.5"
          >
            <UserCircle className="h-4 w-4" />
            Profile
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default TabNav;
