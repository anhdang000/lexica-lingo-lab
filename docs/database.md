# Lexica Database Schema Documentation

## Overview
This document outlines the database schema for the Lexica vocabulary learning platform using Supabase PostgreSQL database.

## Tables

### auth.users (managed by Supabase)
Built-in Supabase auth table handling user authentication.

### profiles
Extends the auth.users table with application-specific user data.
```sql
create table public.profiles (
  id uuid references auth.users(id) primary key,
  username text unique,
  avatar_url TEXT,
  streak_count int default 0,
  last_practice_at timestamp with time zone,
  words_learned int default 0,
  accuracy float default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function whenever a user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### collections
Represents vocabulary collections/topics that users can create.
```sql
create table public.collections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  name text not null,
  description text,
  word_count int default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Indexes
create index collections_user_id_idx on public.collections(user_id);

-- RLS Policies
alter table public.collections enable row level security;
create policy "Users can manage own collections"
  on public.collections for all using (auth.uid() = user_id);
```

### words
Central table storing unique vocabulary words.
```sql
create table public.words (
  id uuid default gen_random_uuid() primary key,
  word text not null,
  phonetic text,
  audio_url text,
  stems text[], -- Array of word variants/stems (e.g. ["run", "runs", "ran", "running"])
  created_at timestamp with time zone default now()
);

-- Indexes
create index words_word_idx on public.words(word);
create index words_stems_idx on public.words using gin(stems); -- GIN index for array operations

-- RLS Policies
alter table public.words enable row level security;
create policy "Words are readable by all authenticated users"
  on public.words for select using (auth.role() = 'authenticated');
```

### word_meanings
Stores multiple meanings/definitions for each word, along with its examples.
```sql
create table public.word_meanings (
  id uuid default gen_random_uuid() primary key,
  word_id uuid references public.words(id) on delete cascade,
  ordinal_index int not null,
  part_of_speech text,
  definition text not null,
  examples text[], -- Array of example sentences
  created_at timestamp with time zone default now(),
  -- Ensure ordinal_index is unique per word
  unique(word_id, ordinal_index)
);

-- Indexes
create index word_meanings_word_id_idx on public.word_meanings(word_id);
create index word_meanings_part_of_speech_idx on public.word_meanings(part_of_speech);
create index word_meanings_ordinal_idx on public.word_meanings(ordinal_index);
create index word_meanings_examples_idx on public.word_meanings using gin(examples); -- GIN index for array operations

-- RLS Policies
alter table public.word_meanings enable row level security;
create policy "Word meanings are readable by all authenticated users"
  on public.word_meanings for select using (auth.role() = 'authenticated');
```

### collection_words
Junction table connecting collections with words, including user-specific learning progress.
```sql
create table public.collection_words (
  id uuid default gen_random_uuid() primary key,
  collection_id uuid references public.collections(id) on delete cascade,
  word_id uuid references public.words(id) on delete cascade,
  meaning_id uuid references public.word_meanings(id) on delete cascade,
  user_id uuid references auth.users(id),
  status text default 'new' check (status in ('new', 'learning', 'mastered')),
  last_reviewed_at timestamp with time zone,
  review_count int default 0,
  next_review_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(collection_id, word_id, meaning_id, user_id)
);

-- Indexes
create index collection_words_collection_id_idx on public.collection_words(collection_id);
create index collection_words_user_id_idx on public.collection_words(user_id);
create index collection_words_status_idx on public.collection_words(status);

-- RLS Policies
alter table public.collection_words enable row level security;
create policy "Users can manage their collection words"
  on public.collection_words for all using (auth.uid() = user_id);
```

### practice_sessions
Records of user practice activities and performance.
```sql
create table public.practice_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  mode text not null check (mode in ('flashcard', 'quiz', 'findword')),
  total_words int not null,
  correct_answers int not null,
  completed boolean default false,
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone
);

-- Indexes
create index practice_sessions_user_id_idx on public.practice_sessions(user_id);

-- RLS Policies
alter table public.practice_sessions enable row level security;
create policy "Users can manage their practice sessions"
  on public.practice_sessions for all using (auth.uid() = user_id);
```

### practice_session_words
Records words practiced in each session, including which meaning was tested.
```sql
create table public.practice_session_words (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.practice_sessions(id) on delete cascade,
  word_id uuid references public.words(id),
  meaning_id uuid references public.word_meanings(id),
  collection_id uuid references public.collections(id),
  is_correct boolean,
  created_at timestamp with time zone default now()
);

-- Indexes
create index practice_session_words_session_id_idx on public.practice_session_words(session_id);
create index practice_session_words_word_id_idx on public.practice_session_words(word_id);
create index practice_session_words_collection_id_idx on public.practice_session_words(collection_id);

-- RLS Policies
alter table public.practice_session_words enable row level security;
create policy "Users can view their practice session words"
  on public.practice_session_words for select
  using (exists (
    select 1 from public.practice_sessions
    where id = practice_session_words.session_id
    and user_id = auth.uid()
  ));
```

## Functions and Triggers

### Update Collection Word Count
```sql
create or replace function update_collection_word_count()
returns trigger as $$
begin
  update public.collections
  set word_count = (
    select count(*)
    from public.collection_words
    where collection_id = new.collection_id
  )
  where id = new.collection_id;
  return new;
end;
$$ language plpgsql;

create trigger update_collection_word_count_trigger
after insert or delete on public.collection_words
for each row execute function update_collection_word_count();
```

### Update User Stats
```sql
create or replace function update_user_stats()
returns trigger as $$
begin
  update public.profiles
  set 
    words_learned = (
      select count(*)
      from public.collection_words
      where user_id = new.user_id
      and status = 'mastered'
    ),
    accuracy = (
      select avg(
        case when completed then
          (correct_answers::float / total_words) * 100
        else
          null
        end
      )
      from public.practice_sessions
      where user_id = new.user_id
      and completed = true
    )
  where id = new.user_id;
  return new;
end;
$$ language plpgsql;

create trigger update_user_stats_trigger
after insert or update on public.practice_sessions
for each row execute function update_user_stats();
```

### Update Collection Practice Stats
```sql
-- Function to update collection practice stats when a word is practiced
create or replace function update_collection_practice_stats()
returns trigger as $$
begin
  -- Update the word practice count in collection_words
  update public.collection_words
  set review_count = review_count + 1,
      last_reviewed_at = now(),
      status = case
        when new.is_correct then
          case 
            when review_count >= 5 and status = 'learning' then 'mastered'
            when status = 'new' then 'learning'
            else status
          end
        else status
      end
  where collection_id = new.collection_id
    and word_id = new.word_id;

  return new;
end;
$$ language plpgsql;

create trigger update_collection_practice_stats_trigger
after insert on public.practice_session_words
for each row execute function update_collection_practice_stats();

-- Update user stats function
create or replace function update_user_practice_stats()
returns trigger as $$
begin
  -- Only update stats when session is completed
  if new.completed and not old.completed then
    update public.profiles
    set 
      words_learned = (
        select count(distinct cw.word_id)
        from public.collection_words cw
        where cw.user_id = new.user_id
        and cw.status = 'mastered'
      ),
      accuracy = (
        select 
          avg((ps.correct_answers::float / ps.total_words) * 100)
        from public.practice_sessions ps
        where ps.user_id = new.user_id
        and ps.completed = true
      ),
      last_practice_at = new.completed_at
    where id = new.user_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger update_user_practice_stats_trigger
after update on public.practice_sessions
for each row execute function update_user_practice_stats();
```

## Database Indexes
Additional indexes are created on frequently queried columns to optimize performance:
- User IDs for quick user-related queries
- Collection and word relationships
- Status and timestamp fields for progress tracking
- Text fields used in search functionality

## Row Level Security (RLS)
All tables have RLS enabled to ensure data security:
- Users can only access their own data
- Public words table is readable by all authenticated users
- Practice session data is protected per user
- Collection management is restricted to owners

## Database Utilities

### Full-Text Search
The words table utilizes PostgreSQL's full-text search capabilities:
```sql
alter table public.words
add column search_vector tsvector
generated always as (
  setweight(to_tsvector('english', coalesce(word, '')), 'A')
) stored;

alter table public.word_meanings
add column search_vector tsvector
generated always as (
  setweight(to_tsvector('english', coalesce(definition, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(array_to_string(examples, ' '), '')), 'C')
) stored;

create index words_search_idx on public.words using gin(search_vector);
create index word_meanings_search_idx on public.word_meanings using gin(search_vector);
create index meaning_examples_search_idx on public.meaning_examples using gin(search_vector);
```

### Automated Timestamp Updates
```sql
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply to relevant tables
create trigger update_collections_updated_at
  before update on public.collections
  for each row execute function update_updated_at();

create trigger update_collection_words_updated_at
  before update on public.collection_words
  for each row execute function update_updated_at();
```
