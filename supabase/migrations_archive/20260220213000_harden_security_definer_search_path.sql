-- REL-03 / BUG-10: Lock search_path on all SECURITY DEFINER functions that have
-- an empty search_path="". An empty search_path allows search_path injection:
-- a malicious user who can create objects in any schema could shadow public.* tables
-- and trick functions running as the schema owner into querying attacker-controlled data.
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security
--
-- NOT TOUCHED (already correctly hardened):
--   consume_tenant_tokens, current_app_id, custom_access_token_hook,
--   jwt_is_admin, jwt_is_super_admin, jwt_is_tenant_admin, pull_changes,
--   submit_attempt_and_update_progress, validate_and_use_invitation_code,
--   on_app_domain_change

ALTER FUNCTION public.deactivate_invitation_code(uuid)
  SET search_path = public, auth;

ALTER FUNCTION public.deactivate_own_account()
  SET search_path = public, auth;

ALTER FUNCTION public.delete_own_account()
  SET search_path = public, auth;

ALTER FUNCTION public.generate_invitation_code(integer, integer)
  SET search_path = public, auth;

ALTER FUNCTION public.import_questions_bulk(jsonb)
  SET search_path = public, auth;


ALTER FUNCTION public.log_error(text, text, text, text, text, text, text, jsonb, uuid)
  SET search_path = public, auth;

ALTER FUNCTION public.log_security_event(text, text, jsonb, uuid, text)
  SET search_path = public, auth;

ALTER FUNCTION public.promote_error_to_issue(uuid, text, text, text)
  SET search_path = public, auth;

ALTER FUNCTION public.publish_curriculum(uuid)
  SET search_path = public, auth;


ALTER FUNCTION public.validate_invitation_code(text)
  SET search_path = public, auth;
