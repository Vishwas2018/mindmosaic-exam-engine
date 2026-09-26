-- ---------------------------------------------------------------------------
-- AMC (Australian Mathematics Competition) programme offerings (spec §6.3, §1.7)
-- Seeds the `amc_mathematics` subject and the Middle Primary (Year 3) +
-- Upper Primary (Year 5) offerings under the existing
-- `australian_mathematics_competition` programme.
-- ---------------------------------------------------------------------------

insert into public.subjects (id, display_name, selection_filter_alias) values
  ('amc_mathematics', 'AMC Mathematics', null)
on conflict (id) do nothing;

insert into public.programme_offerings (programme_id, subject_id, year_level, locale, region) values
  ('australian_mathematics_competition', 'amc_mathematics', 3, 'en-AU', 'global'),
  ('australian_mathematics_competition', 'amc_mathematics', 5, 'en-AU', 'global')
on conflict (programme_id, subject_id, year_level, locale, region) do nothing;
