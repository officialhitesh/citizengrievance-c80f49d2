
-- Complaints table
CREATE TABLE public.complaints (
  complaint_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  image_url text,
  latitude double precision,
  longitude double precision,
  status text NOT NULL DEFAULT 'Pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Status validation via trigger (avoid CHECK constraint rigidity)
CREATE OR REPLACE FUNCTION public.validate_complaint_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('Pending', 'In Progress', 'Resolved') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER complaints_validate_status
BEFORE INSERT OR UPDATE ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.validate_complaint_status();

CREATE INDEX idx_complaints_user_id ON public.complaints(user_id);
CREATE INDEX idx_complaints_created_at ON public.complaints(created_at DESC);

ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- Citizen policies (own rows)
CREATE POLICY "Users view own complaints"
ON public.complaints FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own complaints"
ON public.complaints FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own complaints"
ON public.complaints FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users delete own complaints"
ON public.complaints FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Admin policies (all rows)
CREATE POLICY "Admins view all complaints"
ON public.complaints FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update all complaints"
ON public.complaints FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete all complaints"
ON public.complaints FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('complaint-images', 'complaint-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read complaint images"
ON storage.objects FOR SELECT
USING (bucket_id = 'complaint-images');

CREATE POLICY "Authenticated upload complaint images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'complaint-images');

CREATE POLICY "Users update own complaint images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'complaint-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own complaint images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'complaint-images' AND auth.uid()::text = (storage.foldername(name))[1]);
