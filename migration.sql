-- StudyOS Database Migration (Fixed for Supabase Permissions)
-- This script sets up the multi-tenant architecture with Row-Level Security (RLS).

-- 1. Create Courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- We default the tenant_id to the one in the user's JWT metadata
  tenant_id UUID NOT NULL DEFAULT (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid,
  name TEXT NOT NULL,
  code TEXT,
  color TEXT,
  lecturer TEXT,
  credits INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Schedule Slots table
CREATE TABLE public.schedule_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0 (Sunday) to 6 (Saturday)
  start_time TEXT NOT NULL, -- HH:mm
  end_time TEXT NOT NULL, -- HH:mm
  room TEXT,
  type TEXT, -- e.g., Lecture, Tutorial, Lab
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Assignments table
CREATE TABLE public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  grade TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create Resources table
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- e.g., pdf, html, link
  file_key TEXT,
  category TEXT,
  tags TEXT[],
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Enable Row-Level Security (RLS) on all tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- 6. Create Policies for Courses
CREATE POLICY "Users can only access their own courses" ON public.courses
  FOR ALL
  USING (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

-- 7. Create Policies for Schedule Slots
CREATE POLICY "Users can only access their own schedule" ON public.schedule_slots
  FOR ALL
  USING (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

-- 8. Create Policies for Assignments
CREATE POLICY "Users can only access their own assignments" ON public.assignments
  FOR ALL
  USING (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

-- 9. Create Policies for Resources
CREATE POLICY "Users can only access their own resources" ON public.resources
  FOR ALL
  USING (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

-- 10. Grant access to authenticated users
GRANT ALL ON public.courses TO authenticated;
GRANT ALL ON public.schedule_slots TO authenticated;
GRANT ALL ON public.assignments TO authenticated;
GRANT ALL ON public.resources TO authenticated;
