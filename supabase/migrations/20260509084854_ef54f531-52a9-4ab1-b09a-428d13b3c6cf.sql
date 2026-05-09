
ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS tracking_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS priority text,
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS mobile text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS pincode text,
  ADD COLUMN IF NOT EXISTS location_text text;

CREATE OR REPLACE FUNCTION public.generate_tracking_id()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_id text;
  done boolean := false;
BEGIN
  WHILE NOT done LOOP
    new_id := 'CG-' || upper(substring(replace(gen_random_uuid()::text,'-',''), 1, 8));
    PERFORM 1 FROM public.complaints WHERE tracking_id = new_id;
    IF NOT FOUND THEN done := true; END IF;
  END LOOP;
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_complaint_tracking_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.tracking_id IS NULL OR NEW.tracking_id = '' THEN
    NEW.tracking_id := public.generate_tracking_id();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_complaints_tracking_id ON public.complaints;
CREATE TRIGGER trg_complaints_tracking_id
BEFORE INSERT ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.set_complaint_tracking_id();

-- Backfill existing rows
UPDATE public.complaints SET tracking_id = public.generate_tracking_id() WHERE tracking_id IS NULL;
