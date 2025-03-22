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
  streak_count int default 0,
  last_practice_at timestamp with time zone,
  words_learned int default 0,
  accuracy float default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Realtime enabled
alter table public.profiles replica identity full;

-- RLS Policies
alter table public.profiles enable row level security;
create policy "Users can view own profile" 
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" 
  on public.profiles for update using (auth.uid() = id);
```

### collections
Represents vocabulary collections/topics that users can create.
```sql
create table public.collections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  name text not null,
  description text,
  category text,
  is_ai_generated boolean default false,
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
Central table storing vocabulary words and their details.
```sql
create table public.words (
  id uuid default gen_random_uuid() primary key,
  word text not null,
  phonetic text,
  part_of_speech text,
  definition text not null,
  example text,
  audio_url text,
  created_at timestamp with time zone default now()
);

-- Indexes
create index words_word_idx on public.words(word);
create index words_part_of_speech_idx on public.words(part_of_speech);

-- RLS Policies
alter table public.words enable row level security;
create policy "Words are readable by all authenticated users"
  on public.words for select using (auth.role() = 'authenticated');
```

### collection_words
Junction table connecting collections with words, including user-specific learning progress.
```sql
create table public.collection_words (
  id uuid default gen_random_uuid() primary key,
  collection_id uuid references public.collections(id) on delete cascade,
  word_id uuid references public.words(id) on delete cascade,
  user_id uuid references auth.users(id),
  status text default 'new' check (status in ('new', 'learning', 'mastered')),
  last_reviewed_at timestamp with time zone,
  review_count int default 0,
  next_review_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(collection_id, word_id, user_id)
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
  collection_id uuid references public.collections(id),
  mode text not null check (mode in ('flashcard', 'quiz', 'findword')),
  total_words int not null,
  correct_answers int not null,
  duration interval,
  completed boolean default false,
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone
);

-- Indexes
create index practice_sessions_user_id_idx on public.practice_sessions(user_id);
create index practice_sessions_collection_id_idx on public.practice_sessions(collection_id);

-- RLS Policies
alter table public.practice_sessions enable row level security;
create policy "Users can manage their practice sessions"
  on public.practice_sessions for all using (auth.uid() = user_id);
```

### practice_session_words
Detailed records of words practiced in each session.
```sql
create table public.practice_session_words (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.practice_sessions(id) on delete cascade,
  word_id uuid references public.words(id),
  is_correct boolean,
  response text,
  time_taken interval,
  created_at timestamp with time zone default now()
);

-- Indexes
create index practice_session_words_session_id_idx on public.practice_session_words(session_id);

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
  setweight(to_tsvector('english', coalesce(word, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(definition, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(example, '')), 'C')
) stored;

create index words_search_idx on public.words using gin(search_vector);
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