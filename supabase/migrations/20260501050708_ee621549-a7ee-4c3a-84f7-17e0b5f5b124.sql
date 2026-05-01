-- =========================
-- MEMORIES
-- =========================
create table public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  trip_id uuid,
  image_url text not null,
  caption text,
  story text,
  like_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.memories enable row level security;

create policy "Memories viewable by everyone"
  on public.memories for select using (true);

create policy "Users create their own memories"
  on public.memories for insert with check (auth.uid() = user_id);

create policy "Users update their own memories"
  on public.memories for update using (auth.uid() = user_id);

create policy "Users delete their own memories"
  on public.memories for delete using (auth.uid() = user_id);

create trigger memories_set_updated_at
  before update on public.memories
  for each row execute function public.set_updated_at();

create index memories_created_at_idx on public.memories (created_at desc);
create index memories_user_id_idx on public.memories (user_id);

-- =========================
-- MEMORY LIKES
-- =========================
create table public.memory_likes (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories(id) on delete cascade,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  unique (memory_id, user_id)
);

alter table public.memory_likes enable row level security;

create policy "Likes viewable by everyone"
  on public.memory_likes for select using (true);

create policy "Users like as themselves"
  on public.memory_likes for insert with check (auth.uid() = user_id);

create policy "Users unlike their own"
  on public.memory_likes for delete using (auth.uid() = user_id);

create index memory_likes_memory_idx on public.memory_likes (memory_id);
create index memory_likes_user_idx on public.memory_likes (user_id);

-- =========================
-- NOTIFICATIONS
-- =========================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null,
  actor_id uuid,
  type text not null,
  entity_type text,
  entity_id uuid,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "Users view own notifications"
  on public.notifications for select using (auth.uid() = recipient_id);

create policy "Users update own notifications"
  on public.notifications for update using (auth.uid() = recipient_id);

create policy "Users delete own notifications"
  on public.notifications for delete using (auth.uid() = recipient_id);

create index notifications_recipient_idx on public.notifications (recipient_id, created_at desc);

-- =========================
-- LIKE -> NOTIFICATION + COUNT TRIGGER
-- =========================
create or replace function public.handle_memory_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
begin
  if (tg_op = 'INSERT') then
    update public.memories set like_count = like_count + 1 where id = new.memory_id
      returning user_id into owner_id;
    if owner_id is not null and owner_id <> new.user_id then
      insert into public.notifications (recipient_id, actor_id, type, entity_type, entity_id)
      values (owner_id, new.user_id, 'memory_like', 'memory', new.memory_id);
    end if;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.memories set like_count = greatest(like_count - 1, 0) where id = old.memory_id
      returning user_id into owner_id;
    delete from public.notifications
      where type = 'memory_like'
        and entity_id = old.memory_id
        and actor_id = old.user_id
        and recipient_id = owner_id;
    return old;
  end if;
  return null;
end;
$$;

create trigger memory_likes_after_insert
  after insert on public.memory_likes
  for each row execute function public.handle_memory_like();

create trigger memory_likes_after_delete
  after delete on public.memory_likes
  for each row execute function public.handle_memory_like();

-- =========================
-- STORAGE BUCKET FOR MEMORIES
-- =========================
insert into storage.buckets (id, name, public)
values ('memories', 'memories', true)
on conflict (id) do nothing;

create policy "Memory images public read"
  on storage.objects for select
  using (bucket_id = 'memories');

create policy "Users upload to own memory folder"
  on storage.objects for insert
  with check (
    bucket_id = 'memories'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users update own memory files"
  on storage.objects for update
  using (
    bucket_id = 'memories'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users delete own memory files"
  on storage.objects for delete
  using (
    bucket_id = 'memories'
    and auth.uid()::text = (storage.foldername(name))[1]
  );