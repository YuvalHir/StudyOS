-- Security Enhancement: Robust Multi-Tenancy
-- This migration moves tenant_id management from user_metadata (client-mutable) 
-- to a secure profiles table and updates RLS policies.

-- 1. Create a secure profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  full_name TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- 2. Backfill profiles from existing auth.users metadata
-- This handles existing users who have tenant_id in their metadata
INSERT INTO public.profiles (id, tenant_id, full_name)
SELECT 
  id, 
  (raw_user_meta_data->>'tenant_id')::uuid,
  raw_user_meta_data->>'full_name'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 3. Create a helper function to get the current user's tenant_id
-- This function is more secure than reading directly from the JWT
CREATE OR REPLACE FUNCTION public.get_auth_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 4. Update RLS Policies for all tables to use the secure function

-- Courses
DROP POLICY IF EXISTS "Users can only access their own courses" ON public.courses;
CREATE POLICY "Users can only access their own courses" ON public.courses
  FOR ALL USING (tenant_id = public.get_auth_tenant_id())
  WITH CHECK (tenant_id = public.get_auth_tenant_id());

-- Schedule Slots
DROP POLICY IF EXISTS "Users can only access their own schedule" ON public.schedule_slots;
CREATE POLICY "Users can only access their own schedule" ON public.schedule_slots
  FOR ALL USING (tenant_id = public.get_auth_tenant_id())
  WITH CHECK (tenant_id = public.get_auth_tenant_id());

-- Assignments
DROP POLICY IF EXISTS "Users can only access their own assignments" ON public.assignments;
CREATE POLICY "Users can only access their own assignments" ON public.assignments
  FOR ALL USING (tenant_id = public.get_auth_tenant_id())
  WITH CHECK (tenant_id = public.get_auth_tenant_id());

-- Resources
DROP POLICY IF EXISTS "Users can only access their own resources" ON public.resources;
CREATE POLICY "Users can only access their own resources" ON public.resources
  FOR ALL USING (tenant_id = public.get_auth_tenant_id())
  WITH CHECK (tenant_id = public.get_auth_tenant_id());

-- 5. Automation: Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, tenant_id, full_name)
  VALUES (
    NEW.id, 
    COALESCE((NEW.raw_user_meta_data->>'tenant_id')::uuid, gen_random_uuid()),
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
