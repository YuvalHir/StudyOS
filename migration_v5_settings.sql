-- Add a settings JSONB column for flexible user preferences
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{
  "default_tab": "dashboard",
  "language": "he",
  "theme": "system",
  "compact_mode": false
}'::jsonb;

-- Ensure the settings column is included in the RLS update policy (already covered by FOR UPDATE on profiles)
