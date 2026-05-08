ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS urgency text,
  ADD COLUMN IF NOT EXISTS classified_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_complaints_department ON public.complaints(department);
CREATE INDEX IF NOT EXISTS idx_complaints_urgency ON public.complaints(urgency);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);