-- 1. Create the Security Definer Function to safely check roles
-- SECURITY DEFINER means this function runs with the privileges of the creator (admin),
-- bypassing RLS on the profiles table itself to avoid infinite recursion.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
DECLARE
  current_role text;
BEGIN
  SELECT role INTO current_role FROM public.profiles
  WHERE id = auth.uid();
  -- Return true if role is 'admin', false otherwise
  RETURN current_role = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing policies to replace them
DROP POLICY IF EXISTS "View Policy" ON public.profiles;
DROP POLICY IF EXISTS "Update Policy" ON public.profiles;
DROP POLICY IF EXISTS "Insert Policy" ON public.profiles;
DROP POLICY IF EXISTS "Delete Policy" ON public.profiles;
DROP POLICY IF EXISTS "Specific Admin Email can do everything" ON public.profiles;

-- 3. Re-create Policies using the new dynamic is_admin() check
-- SELECT: Users view own, Admin views all
CREATE POLICY "View Policy"
  ON public.profiles FOR SELECT
  USING ( auth.uid() = id OR public.is_admin() );

-- UPDATE: Users update own, Admin updates all
CREATE POLICY "Update Policy"
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id OR public.is_admin() );

-- INSERT: Users insert own (usually via trigger, but allowed), Admin inserts all
CREATE POLICY "Insert Policy"
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id OR public.is_admin() );

-- DELETE: Users delete own, Admin deletes all
CREATE POLICY "Delete Policy"
  ON public.profiles FOR DELETE
  USING ( auth.uid() = id OR public.is_admin() );
