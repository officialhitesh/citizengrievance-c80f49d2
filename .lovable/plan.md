## Goal

Build the Admin side with an AI classifier that auto-tags every complaint with **Department** and **Urgency** (Low/Medium/High/Critical), and lets admins view, search, filter and sort all complaints.

We'll use **Lovable AI (Gemini)** as the classifier — no Python hosting needed, no API key required.

## Departments

Sanitation, Roads, Water, Electricity, Public Safety, Health, Other.

## Database changes

Add to the `complaints` table:
- `department` (text, nullable) — one of the 7 departments
- `urgency` (text, nullable) — Low / Medium / High / Critical
- `classified_at` (timestamptz, nullable) — when AI classified it

No RLS changes (existing admin policies already cover SELECT/UPDATE).

## Backend — Edge Function `classify-complaint`

- Input: `{ complaintId }`
- Loads the complaint, sends `title + description + city/state` to Gemini (`google/gemini-3-flash-preview`) using **structured output** (Zod schema) to force a clean `{ department, urgency }` JSON response.
- Updates the complaint row with `department`, `urgency`, `classified_at`.
- Handles 429 (rate limit) and 402 (credits exhausted) with clear errors.
- `verify_jwt` left at default; the function uses the service role to update.

## Auto-classify on submission

In `src/pages/citizen/AddComplaint.tsx`, after a successful insert, fire-and-forget `supabase.functions.invoke('classify-complaint', { body: { complaintId } })`. Citizen flow is not blocked if classification fails — admin will still see the complaint, just unclassified.

A small "Re-classify" button on the admin row is included as a safety net (covers older complaints + failures) but the primary trigger is automatic.

## Admin Dashboard rebuild (`src/pages/AdminDashboard.tsx`)

Replace the current placeholder with a real dashboard:

**Stats row:** Total / Pending / In Progress / Resolved / Critical urgency count.

**Filters bar:**
- Search (title + description + city)
- Department dropdown (All + 7 options)
- Urgency dropdown (All + 4 levels)
- Status dropdown (All / Pending / In Progress / Resolved)
- Sort: Newest, Oldest, Urgency (Critical→Low)

**Complaints table/cards** (responsive: table on desktop, cards on mobile):
- Columns: Title, Citizen city, Department badge, Urgency badge (color-coded: Critical=red, High=orange, Medium=yellow, Low=green), Status, Date, Actions
- Click row → details drawer with full description, image, map coords, and the Re-classify button
- Pagination (20 per page)

**Realtime:** subscribe to `complaints` table so new submissions appear and badges update live once the Edge Function writes the classification back.

**Auth:** existing `ProtectedRoute requiredRole="admin"` already guards the route.

## Files

**New**
- `supabase/functions/classify-complaint/index.ts` — Lovable AI classifier
- `src/components/admin/ComplaintsTable.tsx`
- `src/components/admin/ComplaintFilters.tsx`
- `src/components/admin/ComplaintDetailsDrawer.tsx`
- `src/components/admin/DepartmentBadge.tsx`, `UrgencyBadge.tsx`
- `src/lib/complaintTaxonomy.ts` — department + urgency constants
- `supabase/migrations/<timestamp>_add_classification_to_complaints.sql`

**Edited**
- `src/pages/AdminDashboard.tsx` — full rebuild
- `src/pages/citizen/AddComplaint.tsx` — invoke classifier after insert
- `src/pages/citizen/EditComplaint.tsx` — re-invoke classifier when description changes
- `src/integrations/supabase/types.ts` — auto-regenerated after migration

## Out of scope (ask if you want them)

- Status update / assignment by admin
- Email notifications to citizen on status change
- Citizen-side display of department/urgency badges
- Backfill classification for existing complaints (can run one-off after deploy)
