import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Home, Folder, Keyboard, Menu, X, User } from 'lucide-react';
import 'remixicon/fonts/remixicon.css';

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const navLinks = [
    { name: 'Home', path: '/', icon: <Home className="h-5 w-5" /> },
    { name: 'Library', path: '/library', icon: <Folder className="h-5 w-5" /> },
    { name: 'Practice', path: '/progress', icon: <Keyboard className="h-5 w-5" /> },
  ];

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
            {navLinks.map((link) => (
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
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  <User className="h-6 w-6 text-gray-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">Emily Parker</p>
                  <p className="text-xs text-gray-500">Premium Member</p>
                </div>
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
        {navLinks.map((link) => (
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
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            <img 
              src="https://public.readdy.ai/ai/img_res/26aca20a0c7223efb936303b6c05acfa.jpg" 
              alt="Profile"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '';
                e.currentTarget.classList.add('flex', 'items-center', 'justify-center');
                e.currentTarget.appendChild(document.createElement('span')).textContent = 'EP';
              }}
            />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">Emily Parker</p>
            <p className="text-xs text-gray-500">Premium Member</p>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
