
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { DialogFooter } from '@/components/ui/dialog';

interface ImportWordsFormProps {
  onSubmit: (data: any) => void;
}

const ImportWordsForm: React.FC<ImportWordsFormProps> = ({ onSubmit }) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      onSubmit({ file });
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div 
        className={`border-2 border-dashed ${dragActive ? 'border-primary' : 'border-gray-200'} rounded-xl p-8 text-center mb-6`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <p className="text-gray-600 mb-2">
          {file ? `File selected: ${file.name}` : 'Drag and drop your word list file here'}
        </p>
        <p className="text-sm text-gray-500 mb-4">Supports .txt, .csv, .xlsx formats</p>
        <label className="inline-block">
          <input
            type="file"
            accept=".txt,.csv,.xlsx"
            className="hidden"
            onChange={handleChange}
          />
          <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-button hover:bg-gray-200 cursor-pointer">
            Browse Files
          </span>
        </label>
      </div>
      
      <DialogFooter>
        <Button 
          type="submit" 
          className="w-full bg-primary hover:bg-primary/90"
          disabled={!file}
        >
          Import Words
        </Button>
      </DialogFooter>
    </form>
  );
};

export default ImportWordsForm;
