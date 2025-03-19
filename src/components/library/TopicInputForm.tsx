
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Sparkles } from 'lucide-react';

interface TopicInputFormProps {
  onSubmit: (prompt: string) => void;
}

const TopicInputForm: React.FC<TopicInputFormProps> = ({ onSubmit }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      onSubmit(prompt);
      setPrompt('');
      setIsLoading(false);
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <Input
          type="text"
          placeholder="Enter a topic (e.g., 'Medical terminology')"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={isLoading}
          className="w-full"
        />
        <div className="text-xs text-muted-foreground">
          AI will generate a curated vocabulary collection based on your topic
        </div>
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500"
        disabled={!prompt.trim() || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Vocabulary
          </>
        )}
      </Button>
    </form>
  );
};

export default TopicInputForm;
