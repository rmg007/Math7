-- Enable pg_net to allow outgoing HTTP requests from the database
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create the trigger function to notify our Edge Function of app changes
CREATE OR REPLACE FUNCTION public.on_app_domain_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://bkfhorslctqieetzqdtd.supabase.co/functions/v1/manage-app-domains',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-webhook-secret', current_setting('app.settings.domain_sync_secret')
      ),
      body := jsonb_build_object(
        'type', TG_OP,
        'record', row_to_json(NEW),
        'old_record', row_to_json(OLD)
      )
    );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- We log the error but don't block the transaction. 
  -- The admin can still manually add the domain if the automation fails.
  RAISE WARNING 'Cloudflare automation trigger failed: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach the trigger to the apps table
DROP TRIGGER IF EXISTS tr_app_domain_change ON public.apps;
CREATE TRIGGER tr_app_domain_change
  AFTER INSERT OR UPDATE OR DELETE
  ON public.apps
  FOR EACH ROW
  EXECUTE FUNCTION public.on_app_domain_change();

COMMENT ON FUNCTION public.on_app_domain_change() IS 'Automates Cloudflare Pages custom domain management via Edge Functions when an app is created, renamed, or deleted.';
