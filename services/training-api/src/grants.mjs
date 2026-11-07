/* PostgreSQL application privilege boundary.
 * Must be run by a trusted migration/database owner AFTER schema migration.
 * Roles are supplied by operator and MUST NOT be DB owners, superusers or
 * memberships in the migration role.
 */
export function roleName(value){
 if(typeof value!=="string"||!/^[_a-zA-Z][_a-zA-Z0-9]{0,62}$/.test(value))
  throw Error("Invalid PostgreSQL role name");
 return '"'+value.replaceAll('"','""')+'"';
}
export function grantStatements(appRole,provisionRole){
 const app=roleName(appRole),provision=roleName(provisionRole);
 if(app===provision)throw Error("Application and provisioning roles must differ");
 const tables=[
  "organizations","users","memberships","instructor_assignments",
  "sessions","practice_attempts","feedback_drafts","login_throttles","audit_events","instructor_mfa","email_verification_challenges","ai_daily_usage"
 ];
 const statements=[];
 // Revoke any direct privileges; database owners and role memberships need separate review.
 for(const role of [app,provision]){
  statements.push(`REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM ${role}`);
  statements.push(`REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM ${role}`);
  statements.push(`GRANT USAGE ON SCHEMA public TO ${role}`);
 }
 for(const table of ["organizations","users","memberships","instructor_assignments"])
  statements.push(`GRANT SELECT ON public.${table} TO ${app}`);
 // Sessions and login throttles: no DELETE; expiry handled by an operator,
 // not web requests. Session token hashes are never returned by API.
 for(const table of ["sessions","practice_attempts","feedback_drafts","login_throttles"])
  statements.push(`GRANT SELECT,INSERT ON public.${table} TO ${app}`);
 statements.push(`GRANT SELECT ON public.instructor_mfa TO ${app}`);
 statements.push(`GRANT UPDATE(last_used_step) ON public.instructor_mfa TO ${app}`);
 statements.push(`GRANT EXECUTE ON FUNCTION public.consume_email_challenge(char(64)) TO ${app}`);
 statements.push(`GRANT SELECT,INSERT ON public.ai_daily_usage TO ${app}`);
 statements.push(`GRANT UPDATE(request_count) ON public.ai_daily_usage TO ${app}`);
 statements.push(`GRANT UPDATE(revoked_at) ON public.sessions TO ${app}`);
 statements.push(`GRANT UPDATE(window_start,attempt_count) ON public.login_throttles TO ${app}`);
 // Full table reads of audit_events and changes to history are forbidden.
 statements.push(`GRANT INSERT ON public.audit_events TO ${app}`);
 statements.push(`GRANT USAGE ON SEQUENCE public.audit_events_id_seq TO ${app}`);
 // Provisioning account is explicitly more privileged and used only manually.
 for(const table of ["organizations","users","memberships","instructor_assignments"])
  statements.push(`GRANT SELECT,INSERT ON public.${table} TO ${provision}`);
 statements.push(`GRANT SELECT,INSERT ON public.instructor_mfa TO ${provision}`);
 statements.push(`GRANT SELECT,INSERT ON public.email_verification_challenges TO ${provision}`);
 statements.push(`GRANT UPDATE(consumed_at) ON public.email_verification_challenges TO ${provision}`);
 statements.push(`GRANT UPDATE(active) ON public.instructor_assignments TO ${provision}`);
 statements.push(`GRANT INSERT ON public.audit_events TO ${provision}`);
 statements.push(`GRANT USAGE ON SEQUENCE public.audit_events_id_seq TO ${provision}`);
 return statements;
}
