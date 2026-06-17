-- Migrações idempotentes para bancos já existentes (rodam a cada deploy).
-- Postgres aplica ADD COLUMN IF NOT EXISTS sem erro se a coluna já existir.

alter table public.quiz_sets
  add column if not exists answer_time smallint not null default 30;

alter table public.quiz_sets
  add column if not exists auto_advance boolean not null default false;
