import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useVocabulary } from './VocabularyProvider';

const wordSchema = z.object({
  word: z.string().min(1, 'Word is required'),
  definition: z.string().min(1, 'Definition is required'),
  partOfSpeech: z.string().optional(),
  example: z.string().optional(),
  phonetic: z.string().optional(),
});

type WordFormData = z.infer<typeof wordSchema>;

interface AddWordFormProps {
  collectionId: string;
  onSuccess?: () => void;
  onCancel: () => void;
}

const AddWordForm: React.FC<AddWordFormProps> = ({ collectionId, onSuccess, onCancel }) => {
  const { user } = useAuth();
  const { refreshCollections } = useVocabulary();
  
  const form = useForm<WordFormData>({
    resolver: zodResolver(wordSchema),
    defaultValues: {
      word: '',
      definition: '',
      partOfSpeech: '',
      example: '',
      phonetic: '',
    },
  });
  
  const onSubmit = async (data: WordFormData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add words",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Insert the word with all its data in a single operation
      // The definitions and examples are now arrays in the words table
      const definitions = [data.definition];
      const examples = data.example ? [data.example] : [];
      
      const { data: wordData, error: wordError } = await supabase
        .from('words')
        .insert({
          word: data.word,
          phonetics: data.phonetic || null,
          part_of_speech: data.partOfSpeech || null,
          definitions: definitions,
          examples: examples,
        })
        .select()
        .single();
        
      if (wordError) {
        console.error('Error creating word:', wordError);
        toast({
          title: "Error",
          description: "Failed to add word. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      // Add the word to the collection
      const { error: collectionWordError } = await supabase
        .from('collection_words')
        .insert({
          collection_id: collectionId,
          word_variant_id: wordData.word_variant_id,
          user_id: user.id,
          status: 'new',
        });
        
      if (collectionWordError) {
        console.error('Error adding word to collection:', collectionWordError);
        toast({
          title: "Error",
          description: "Failed to add word to collection. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Success",
        description: "Word added to collection!",
      });
      
      form.reset();
      refreshCollections();
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error('Exception adding word:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="word"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Word</FormLabel>
              <FormControl>
                <Input placeholder="Enter the word" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="phonetic"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phonetic (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., /ˈsɪmpəl/" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="partOfSpeech"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Part of Speech (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., noun, verb, adjective" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="definition"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Definition</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter the definition"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="example"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Example (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter an example sentence"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            Add Word
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddWordForm;
