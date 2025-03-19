
import React from 'react';
import InputBox from '@/components/InputBox';
import WordOfDay from '@/components/WordOfDay';
import RecentActivity from '@/components/RecentActivity';
import ProgressDashboard from '@/components/ProgressDashboard';
import DictionaryLookup from '@/components/DictionaryLookup';
import TabNav from '@/components/TabNav';
import Header from '@/components/Header';

const Index = () => {
  // Sample data for WordOfDay component
  const wordOfDayData = {
    word: "Serendipity",
    pronunciation: "/ˌser.ənˈdɪp.ə.ti/",
    partOfSpeech: "noun",
    definition: "The occurrence and development of events by chance in a happy or beneficial way.",
    example: "The scientists made the discovery by serendipity when they were looking for something else entirely."
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 to-white dark:from-gray-900 dark:to-gray-800">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-7xl mt-16">
        <TabNav />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-8 flex flex-col gap-6 order-2 lg:order-1">
            <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white">
              Expand your <span className="text-amber-500">lexicon</span> with AI
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
              Input text, upload images, or enter URLs. Lexica analyzes your content and creates personalized vocabulary lists to help you learn new words.
            </p>
            
            <InputBox />
            
            <div className="mt-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                Recent Activity
              </h2>
              <RecentActivity />
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-6 order-1 lg:order-2">
            <DictionaryLookup />
            <WordOfDay {...wordOfDayData} />
            <ProgressDashboard />
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-6 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              © 2023 Lexica - Vocabulary Learning App
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 text-sm">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 text-sm">
                Terms of Service
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-amber-500 dark:hover:text-amber-400 text-sm">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
