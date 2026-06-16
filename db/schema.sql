-- Schema do kahoot-alternative em Postgres puro.
-- Adaptado das migrations do Supabase, removendo dependências de:
--   * auth.users / auth.uid()  -> identidade vem de um UUID gerado no cliente
--   * Row Level Security        -> acesso é feito por uma única conexão de app
--   * publication supabase_realtime -> realtime agora é via SSE na aplicação

create extension if not exists "pgcrypto"; -- gen_random_uuid()

create table if not exists public.quiz_sets (
    id uuid default gen_random_uuid() not null primary key,
    created_at timestamp with time zone default now() not null,
    name text not null,
    description text
);

create table if not exists public.questions (
    id uuid default gen_random_uuid() not null primary key,
    created_at timestamp with time zone default now() not null,
    body text not null,
    image_url text,
    "order" smallint not null,
    quiz_set_id uuid not null references quiz_sets(id) on delete cascade on update cascade
);

create table if not exists public.choices (
    id uuid default gen_random_uuid() not null primary key,
    created_at timestamp with time zone default now() not null,
    question_id uuid not null references questions(id) on delete cascade on update cascade,
    body text not null,
    is_correct boolean default false not null
);

create table if not exists public.games (
    id uuid default gen_random_uuid() not null primary key,
    created_at timestamp with time zone default now() not null,
    current_question_sequence smallint default 0 not null,
    is_answer_revealed boolean default false not null,
    phase text default 'lobby' not null,
    host_user_id uuid,
    quiz_set_id uuid not null references quiz_sets(id) on delete cascade on update cascade,
    constraint check_game_phase check (phase in ('lobby', 'quiz', 'result'))
);

create table if not exists public.participants (
    id uuid default gen_random_uuid() not null primary key,
    created_at timestamp with time zone default now() not null,
    nickname text not null,
    game_id uuid not null references games(id) on delete cascade on update cascade,
    user_id uuid not null,
    unique (game_id, user_id)
);

create table if not exists public.answers (
    id uuid default gen_random_uuid() not null primary key,
    created_at timestamp with time zone default now() not null,
    participant_id uuid not null references public.participants(id) on delete cascade on update cascade,
    question_id uuid not null references public.questions(id) on delete cascade on update cascade,
    choice_id uuid references public.choices(id) on delete set null on update cascade,
    score smallint not null,
    unique (participant_id, question_id)
);

create or replace view public.game_results as
    select
        participants.id as participant_id,
        participants.nickname,
        sum(answers.score) as total_score,
        games.id as game_id
    from games
    inner join quiz_sets on games.quiz_set_id = quiz_sets.id
    inner join questions on quiz_sets.id = questions.quiz_set_id
    inner join answers on questions.id = answers.question_id
    inner join participants on answers.participant_id = participants.id and games.id = participants.game_id
    group by games.id, participants.id;

-- Helper usado pelo seed para inserir uma pergunta junto com suas alternativas.
create or replace function add_question (
  quiz_set_id uuid,
  body text,
  "order" int,
  choices json[] -- ex.: [{"body": "Postgres", "is_correct": true}, ...]
) returns void language plpgsql as $$
declare
  question_id uuid;
  choice json;
begin
  insert into questions(body, "order", quiz_set_id)
  values (add_question.body, add_question."order", add_question.quiz_set_id)
  returning id into question_id;

  foreach choice in array choices
  loop
    insert into public.choices
        (question_id, body, is_correct)
        values (question_id, choice->>'body', (choice->>'is_correct')::boolean);
  end loop;
end;
$$;
