import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { GripHorizontal, Sparkles, Library, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

// Animation variants for staggered animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12
    }
  }
};

const Index = () => {
  const navigate = useNavigate();

  // Main tools with their routes, icons, colors, and descriptions
  const tools = [
    {
      name: 'LexiGrab',
      path: '/lexigrab',
      icon: <GripHorizontal className="h-8 w-8" />,
      color: 'bg-[#cd4631]/10',
      textColor: 'text-[#cd4631]',
      description: 'Extract vocabulary from text, websites, images, and documents.',
      buttonBg: 'bg-[#cd4631] hover:bg-[#cd4631]/90'
    },
    {
      name: 'LexiGen',
      path: '/lexigen',
      icon: <Sparkles className="h-8 w-8" />,
      color: 'bg-[#6366f1]/10',
      textColor: 'text-[#6366f1]',
      description: 'Generate customized vocabulary based on topics you\'re interested in.',
      buttonBg: 'bg-[#6366f1] hover:bg-[#6366f1]/90'
    }
  ];

  // Secondary tools
  const secondaryTools = [
    {
      name: 'Library',
      path: '/library',
      icon: <Library className="h-6 w-6" />,
      color: 'bg-gray-100',
      textColor: 'text-gray-700',
      description: 'Organize your vocabulary into collections.'
    },
    {
      name: 'Practice',
      path: '/practice',
      icon: <Dumbbell className="h-6 w-6" />,
      color: 'bg-gray-100',
      textColor: 'text-gray-700',
      description: 'Learn with flashcards and quizzes.'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-14 mt-4"
      >
        <h1 className="text-5xl font-['Pacifico'] text-primary mb-4">Welcome to Lexica</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Your personalized vocabulary learning assistant with AI-powered tools to help you expand your language skills.
        </p>
      </motion.div>

      {/* Main Tools Section */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-14"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {tools.map((tool, index) => (
          <motion.div key={tool.name} variants={itemVariants} className="flex">
            <Card className="h-full w-full transition-all duration-300 hover:shadow-lg border border-gray-100 overflow-hidden flex flex-col">
              <CardContent className="p-8 flex flex-col items-center text-center h-full">
                <div className={`${tool.color} p-4 rounded-full mb-6`}>
                  <div className={`${tool.textColor}`}>
                    {tool.icon}
                  </div>
                </div>
                <h2 className={`text-3xl font-bold mb-3 ${tool.textColor}`}>{tool.name}</h2>
                <p className="text-gray-600 mb-8 flex-grow">{tool.description}</p>
                <Button 
                  className={`w-3/4 ${tool.buttonBg} text-white py-6`}
                  onClick={() => navigate(tool.path)}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Secondary Tools Section */}
      <motion.h2 
        className="text-2xl font-bold mb-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        Learn and manage your vocabulary
      </motion.h2>
      
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.5 }}
      >
        {secondaryTools.map((tool) => (
          <motion.div key={tool.name} variants={itemVariants}>
            <Card 
              className="transition-all duration-300 hover:shadow-md border border-gray-100 cursor-pointer"
              onClick={() => navigate(tool.path)}
            >
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className={`${tool.color} p-3 rounded-full mr-4`}>
                    <div className={`${tool.textColor}`}>
                      {tool.icon}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium mb-1">{tool.name}</h3>
                    <p className="text-gray-500 text-sm">{tool.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Call to Action */}
      <motion.div 
        className="text-center mt-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <p className="text-lg text-gray-600 mb-4">
          Start expanding your vocabulary today with our powerful tools.
        </p>
      </motion.div>
    </div>
  );
};

export default Index;