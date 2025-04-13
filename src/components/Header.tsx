import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Menu, X, LogOut, GripHorizontal, Sparkles } from 'lucide-react';
import { Library, Dumbbell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import 'remixicon/fonts/remixicon.css';

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const { user, signOut } = useAuth();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  // Updated navigation links with LexiGrab and LexiGen on top
  const navLinks = [
    { name: 'LexiGrab', path: '/lexigrab', icon: <GripHorizontal className="h-5 w-5" />, color: "text-[#cd4631]" },
    { name: 'LexiGen', path: '/lexigen', icon: <Sparkles className="h-5 w-5" />, color: "text-[#6366f1]" },
    // Separator is handled separately in the UI
    { name: 'Library', path: '/library', icon: <Library className="h-5 w-5" />, color: "text-gray-600" },
    { name: 'Practice', path: '/practice', icon: <Dumbbell className="h-5 w-5" />, color: "text-gray-600" },
  ];

  // Get user initials for avatar fallback from username instead of email
  const getUserInitials = () => {
    if (!user) return 'U';
    
    const username = user.user_metadata?.username;
    if (username) {
      // Get initials from username (up to 2 characters)
      const words = username.split(/\s+/);
      if (words.length > 1) {
        // If username has multiple words, use first letter of first and last word
        return (words[0][0] + words[words.length - 1][0]).toUpperCase();
      } else {
        // If username is a single word, use first two letters
        return username.substring(0, 2).toUpperCase();
      }
    }
    
    // Fallback to using email if no username
    const email = user.email || '';
    return email.substring(0, 2).toUpperCase();
  };

  // Get username from user metadata
  const getUserName = () => {
    if (!user || !user.user_metadata) return 'User';
    return user.user_metadata.username || user.email;
  };

  // Simplified version for mobile
  if (isMobile) {
    return (
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 fixed top-0 left-0 right-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center">
              <h1 className="text-primary text-3xl font-['Pacifico']">Lexica</h1>
            </Link>

            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile navigation menu */}
        {mobileMenuOpen && (
          <nav className="bg-white dark:bg-gray-800 shadow-lg">
            {/* First two links - LexiGrab and LexiGen */}
            {navLinks.slice(0, 2).map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={cn(
                  "flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700",
                  location.pathname === link.path 
                    ? `${link.color} dark:${link.color} bg-light dark:bg-gray-700` 
                    : "text-gray-600 dark:text-gray-200",
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  {link.icon}
                </div>
                <span className="ml-3">{link.name}</span>
              </Link>
            ))}
            
            {/* Separator */}
            <Separator className="my-2 bg-gray-200 dark:bg-gray-700" />
            
            {/* Remaining links */}
            {navLinks.slice(2).map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={cn(
                  "flex items-center px-4 py-3 text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700",
                  location.pathname === link.path && "text-primary dark:text-primary bg-light dark:bg-gray-700"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  {link.icon}
                </div>
                <span className="ml-3">{link.name}</span>
              </Link>
            ))}
            
            <div className="p-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Avatar>
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{getUserName()}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </nav>
        )}
      </header>
    );
  }

  // Desktop sidebar navigation
  return (
    <nav className="w-60 bg-white dark:bg-gray-800 h-screen fixed left-0 top-0 border-r border-gray-100 dark:border-gray-700 flex flex-col">
      <div className="p-6">
        <Link to="/">
          <h1 className="text-primary text-3xl font-['Pacifico']">Lexica</h1>
        </Link>
      </div>
      
      <div className="flex-1 px-4">
        {/* First two links - LexiGrab and LexiGen */}
        {navLinks.slice(0, 2).map((link) => (
          <Link
            key={link.name}
            to={link.path}
            className={cn(
              "flex items-center px-4 py-3 rounded-button mb-2 hover:bg-gray-50 dark:hover:bg-gray-700",
              location.pathname === link.path 
                ? `${link.color} dark:${link.color} bg-light dark:bg-gray-700` 
                : "text-gray-600 dark:text-gray-200"
            )}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              {link.icon}
            </div>
            <span className="ml-3 font-medium">{link.name}</span>
          </Link>
        ))}
        
        {/* Separator */}
        <Separator className="my-3 bg-gray-200 dark:bg-gray-700" />
        
        {/* Remaining links */}
        {navLinks.slice(2).map((link) => (
          <Link
            key={link.name}
            to={link.path}
            className={cn(
              "flex items-center px-4 py-3 text-gray-600 dark:text-gray-200 rounded-button mb-2 hover:bg-gray-50 dark:hover:bg-gray-700",
              location.pathname === link.path && "text-primary dark:text-primary bg-light dark:bg-gray-700"
            )}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              {link.icon}
            </div>
            <span className="ml-3">{link.name}</span>
          </Link>
        ))}
      </div>
      
      <div className="p-6 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Avatar>
              <AvatarImage 
                src=""
                alt="Profile"
              />
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium">{getUserName()}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign out">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Header;
