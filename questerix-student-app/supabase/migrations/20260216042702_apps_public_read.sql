-- Allow anonymous access to read public app details (needed for landing pages / loading screen)
CREATE POLICY "apps_public_read_config"
ON public.apps
FOR SELECT
TO anon, authenticated
USING (true);
