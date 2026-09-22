-- Add student onboarding completion timestamps and preferences to profiles table.
-- First-run detection (Guardrail G1): stored per-user in Supabase, not client state alone.

alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists diagnostic_completed_at timestamptz,
  add column if not exists interests text[] not null default '{}'::text[],
  add column if not exists weekly_goal_minutes integer not null default 60;

-- Update column-level grants so authenticated users can update their own preferences and onboarding timestamps.
revoke update on public.profiles from authenticated;
grant update (
  display_name,
  year_level,
  onboarding_completed_at,
  diagnostic_completed_at,
  interests,
  weekly_goal_minutes
) on public.profiles to authenticated;
