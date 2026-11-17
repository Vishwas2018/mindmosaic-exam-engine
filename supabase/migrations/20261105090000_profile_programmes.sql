-- Programmes a parent says a child is enrolled in / interested in.
-- Written only by provisionChild (service role) at creation time. Deliberately
-- NOT added to the authenticated column-level UPDATE grant, so a student
-- cannot edit it; reads fall under the existing profiles SELECT policies.

alter table public.profiles
  add column if not exists programmes text[] not null default '{}'::text[];

comment on column public.profiles.programmes is
  'Parent-declared programme ids (enrolled or interested). Intent only; grants no entitlement.';
