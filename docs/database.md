# Lexica Database Schema Documentation

## Overview

This document outlines the database schema for the Lexica vocabulary learning platform using Supabase PostgreSQL database. The schema has been updated to consolidate word and meaning data into a single `words` table, eliminating the previous separate `words` and `word_meanings` tables.

## Tables

### auth.users (managed by Supabase)

Built-in Supabase auth table handling user authentication.

### profiles

Extends the auth.users table with application-specific user data.

```sql
create table public.profiles (
  id uuid references auth.users(id) primary key,
  username text unique,
  streak_count int default 0,
  last_practice_at timestamp with time zone,
  words_learned int default 0,
  accuracy float default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger: handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
    VALUES (NEW.id,
            NEW.raw_user_meta_data->>'username');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  word_count int default 0,
  reviewed_word_count int default 0,
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

Stores each word along with its meaning(s), phonetics, audio, stems, definitions, and examples.

```sql
create table public.words (
  word_id uuid default gen_random_uuid(),          -- group identifier for word
  word text not null,
  word_variant_id uuid default gen_random_uuid() primary key,
  part_of_speech text,
  phonetics text,
  audio_url text,
  stems text[],
  definitions text[] not null,
  examples text[],
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(word_id, word_variant_id)
);

-- Indexes
create index words_word_idx on public.words(word);
create index words_stems_idx on public.words using gin(stems);

-- RLS Policies
alter table public.words enable row level security;
create policy "Words are readable by all authenticated users"
  on public.words for select using (auth.role() = 'authenticated');

create policy "Authenticated users can insert words"
  on public.words for insert with check (auth.role() = 'authenticated');
```

### collection_words

Junction table connecting collections with word variants, including user-specific learning progress.

```sql
create table public.collection_words (
  id uuid default gen_random_uuid() primary key,
  collection_id uuid references public.collections(id) on delete cascade,
  word_variant_id uuid references public.words(word_variant_id) on delete cascade,
  user_id uuid references auth.users(id),
  status text default 'new' check (status in ('new', 'learning', 'mastered')),
  last_reviewed_at timestamp with time zone,
  review_count int default 0,
  next_review_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(collection_id, word_variant_id, user_id)
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

Records words practiced in each session, including which variant was tested.

```sql
create table public.practice_session_words (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.practice_sessions(id) on delete cascade,
  user_id uuid references auth.users(id),
  word_variant_id uuid references public.words(word_variant_id),
  collection_id uuid references public.collections(id),
  is_correct boolean,
  created_at timestamp with time zone default now()
);

-- Indexes
create index practice_session_words_session_id_idx on public.practice_session_words(session_id);
create index practice_session_words_user_id_idx on public.practice_session_words(user_id);
create index practice_session_words_word_variant_id_idx on public.practice_session_words(word_variant_id);
create index practice_session_words_collection_id_idx on public.practice_session_words(collection_id);

-- RLS Policies
alter table public.practice_session_words enable row level security;
create policy "Users can manage their practice session words"
  on public.practice_session_words for all using (auth.uid() = user_id);
```

## Functions and Triggers

### Update Collection Word Count

```sql
create or replace function update_collection_word_count()
returns trigger as $$
begin
  update public.collections
  set 
    word_count = (
      select count(*)
      from public.collection_words
      where collection_id = new.collection_id
        and user_id = new.user_id
    ),
    updated_at = now()
  where id = new.collection_id;
  return new;
end;
$$ language plpgsql;

create trigger update_collection_word_count_trigger
  after insert or delete on public.collection_words
  for each row execute function update_collection_word_count();
```

### Update Collection Practice Stats

```sql
create or replace function update_collection_practice_stats()
returns trigger as $$
begin
  update public.collection_words
  set 
    review_count = review_count + 1,
    last_reviewed_at = now(),
    next_review_at = now() + interval '1 day' * 
      case 
        when status = 'new' then 1
        when status = 'learning' then 3
        when status = 'mastered' then 7
        else 1
      end,
    status = case
      when new.is_correct then
        case 
          when review_count >= 5 and status = 'learning' then 'mastered'
          when status = 'new' then 'learning'
          else status
        end
      else status
    end,
    updated_at = now()
  where collection_id = new.collection_id
    and word_variant_id = new.word_variant_id
    and user_id = new.user_id;

  update public.practice_sessions
  set 
    total_words = (
      select count(*)
      from public.practice_session_words
      where session_id = new.session_id
    ),
    correct_answers = (
      select count(*)
      from public.practice_session_words
      where session_id = new.session_id
        and is_correct = true
    )
  where id = new.session_id;

  update public.collections
  set 
    reviewed_word_count = (
      select count(distinct cw.word_variant_id)
      from public.collection_words cw
      where cw.collection_id = new.collection_id
        and cw.last_reviewed_at is not null
    ),
    updated_at = now()
  where id = new.collection_id;

  return new;
end;
$$ language plpgsql;

create trigger update_collection_practice_stats_trigger
  after insert on public.practice_session_words
  for each row execute function update_collection_practice_stats();
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
        else null
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

## Full-Text Search

```sql
-- Add search vectors to the consolidated words table
alter table public.words
add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(word, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(array_to_string(definitions, ' '), '')), 'B') ||
    setweight(to_tsvector('english', coalesce(array_to_string(examples, ' '), '')), 'C')
  ) stored;

create index words_search_idx on public.words using gin(search_vector);
```

## Automated Timestamp Updates

```sql
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_words_updated_at
  before update on public.words
  for each row execute function update_updated_at();

create trigger update_collection_words_updated_at
  before update on public.collection_words
  for each row execute function update_updated_at();
```

