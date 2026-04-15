-- Security Fix: Prevent User-Controlled Tenant ID during Signup
-- This migration updates the handle_new_user trigger to ignore tenant_id from 
-- client-provided metadata and always generate a new UUID on the server.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, tenant_id, full_name)
  VALUES (
    NEW.id, 
    gen_random_uuid(), -- ALWAYS generate a new UUID on the server
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-apply trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Optional: Clean up any existing profiles that might have been compromised (manual review recommended)
-- SELECT * FROM public.profiles WHERE tenant_id IN (SELECT tenant_id FROM public.profiles GROUP BY tenant_id HAVING COUNT(*) > 1);
