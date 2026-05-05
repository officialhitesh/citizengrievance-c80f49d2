ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS address text;