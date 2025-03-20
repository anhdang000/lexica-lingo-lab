
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog,
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose
} from '@/components/ui/dialog';

interface WordDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  word: string;
  definition: string;
}

const WordDetailModal: React.FC<WordDetailModalProps> = ({
  open,
  onOpenChange,
  word,
  definition
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{word}</DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">{definition}</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 mt-4">
          <Button variant="secondary" className="flex items-center gap-2">
            <i className="ri-volume-up-line"></i>
            Listen
          </Button>
          <Button className="flex items-center gap-2 bg-primary text-white">
            <i className="ri-add-line"></i>
            Add to Study List
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WordDetailModal;
