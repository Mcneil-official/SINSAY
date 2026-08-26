-- Allow authenticated users to insert their own tourists row
-- (needed for the defensive fallback in AuthContext when no row exists)
create policy "Users can insert own profile"
  on public.tourists for insert
  with check (auth.uid() = id);
