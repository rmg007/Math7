-- Allow anonymous access to public app/curriculum structure for Landing Pages
-- Previously only 'authenticated' users could read, blocking the public website.

ALTER POLICY "apps_read_active" ON "public"."apps" TO public;
ALTER POLICY "subjects_read_published" ON "public"."subjects" TO public;

-- Ensure grants are in place
GRANT SELECT ON "public"."apps" TO anon;
GRANT SELECT ON "public"."subjects" TO anon;
