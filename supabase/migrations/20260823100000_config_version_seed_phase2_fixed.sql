-- Phase 3 step 1, part 2: seed the real "Phase-2 fixed" configuration into
-- the tables 20260823090000 just created, so existing fixed delivery has
-- real version rows to eventually pin instead of the placeholder text
-- (spec §10.1-§10.3; ADR-004 accepted, option 1).
--
-- ONE framework, per ADR-004's decision: `create_assessment_session` (any
-- revision) delivers one behaviour today -- single-stage, fixed-path, no
-- adaptive routing -- shared by every offering, so one framework_versions
-- row describes it rather than one per offering.
--
-- ONE blueprint + profile PER OFFERING (99 today, from programme_offerings),
-- each an honest "whole eligible pool, no constraint beyond the offering
-- itself" -- ADR-004's exact phrase. Every blueprint has exactly one cell:
-- subjectId = the offering's subject, proportion = 1 (not itemCount: the
-- pool is not a fixed size, and assessmentBlueprintCellSchema requires
-- exactly one of the two), stageId = the framework's one stage. This is
-- real product scope, not a placeholder -- it is simply a blueprint that
-- imposes no constraint beyond what create_assessment_session already
-- selects on (year/style/subject), which is the honest description of what
-- that function actually does (see 20260812120000/20260822090000's own
-- comments: "blueprint-blind because blueprints are Phase 3").
--
-- WHY totalItems/totalMarks/estimatedTimeSeconds ARE NOT POOL SIZES. A
-- proportional cell (proportion = 1) is not cross-checked against totalItems
-- by assessmentBlueprintVersionSchema's superRefine -- only totalMarks is
-- always checked, against the sum of cell marks. There is no "current pool
-- size" this migration could honestly freeze into an IMMUTABLE row anyway:
-- item_versions is projected content that grows independently of this
-- schema migration, and a blueprint claiming a specific historical count
-- would be exactly the kind of fabricated number ADR-004 stood down over
-- once already. So these three fields are pinned to REAL, already-documented
-- platform constants instead of an invented pool size:
--   * marks / totalItems = 200, `create_assessment_session`'s own
--     `c_max_items` (20260812120000) -- the actual hard ceiling on how many
--     items ANY session, from this blueprint or any other, can ever serve.
--   * estimatedTimeSeconds = 86400, the same function's `c_untimed_ttl` --
--     the real ceiling an untimed sitting is bounded by today.
-- Neither is a claim about how many items currently exist for an offering;
-- both are true, named constants of the platform doing the serving.
--
-- WHY THE FRAMEWORK'S timing.mode IS "untimed", NOT "timed". Today's
-- `p_config->>'timing'` is a PER-SESSION learner choice
-- (examSelectionConfigSchema's TimingMode), not a framework-level constant --
-- and even the 'timed' branch does not fix a totalSeconds: it derives the
-- deadline from whatever content is actually allocated
-- (`v_estimated + c_timed_grace`). frameworkVersionSchema's `timing.mode` is
-- a single value that must apply to every profile using this framework, and
-- can only be "timed" together with a concrete `totalSeconds` (its own
-- superRefine). There genuinely is no single fixed duration this framework
-- imposes, so "untimed" (totalSeconds null) is the honest value -- it says
-- the FRAMEWORK does not fix a duration, which is true, rather than
-- asserting a specific timed length nobody chose.
-- `lateSubmissionGraceSeconds` (300) is a real constant either way
-- (`c_timed_grace`).
--
-- WHY tools.calculator/formulaSheet/dictionary ARE FALSE. Grepped: no such
-- feature exists in src/features/exam-engine or src/app/exam today. Only the
-- scratchpad (src/features/exam-engine/scratchpad/) is real, so it is the
-- only tool set to true. allowFlagForReview/allowSkip are true because
-- flaggedQuestionIds and goToQuestion(index) (src/features/exam-engine/
-- state/exam-store.ts) are real, live features.
--
-- These choices are judgment calls this migration states plainly rather
-- than hides in a jsonb literal -- flag any of them for correction before
-- promoting past this pass.

do $$
declare
  v_framework_id uuid;
begin
  -- -------------------------------------------------------------------------
  -- ONE framework_version: today's fixed-path delivery behaviour.
  -- -------------------------------------------------------------------------
  insert into public.framework_versions (framework_id, revision, label, delivery_mode, config)
  values (
    'phase2-fixed-framework', 1, 'Phase 2 fixed-path sitting', 'fixed_path',
    jsonb_build_object(
      'stages', jsonb_build_array(
        jsonb_build_object('stageId', 'main', 'ordinal', 0, 'label', 'Main assessment', 'sealOnComplete', false)
      ),
      'navigation', jsonb_build_object(
        'allowBacktrackWithinStage', true,
        'allowBacktrackAcrossStages', false,
        'allowFlagForReview', true,
        'allowSkip', true
      ),
      'timing', jsonb_build_object(
        'mode', 'untimed',
        'totalSeconds', null,
        'perStageSeconds', '{}'::jsonb,
        'lateSubmissionGraceSeconds', 300
      ),
      'submission', jsonb_build_object(
        'allowManualSubmit', true,
        'autoSubmitOnExpiry', true,
        'requireAllAnswered', false
      ),
      'scoring', jsonb_build_object(
        'algorithmId', 'question-scorers',
        'algorithmVersion', 1,
        'negativeMarking', false,
        'partialCredit', false,
        'manualReviewAffectsRouting', false
      ),
      'supportedQuestionTypes', to_jsonb(array[
        'multiple_choice', 'multiple_select', 'number_entry', 'fill_blank', 'dropdown',
        'true_false', 'matching', 'ordering', 'short_answer', 'reading_comprehension',
        'essay', 'label_diagram', 'hotspot', 'drag_drop'
      ]::text[]),
      'tools', jsonb_build_object(
        'calculator', false,
        'scratchpad', true,
        'formulaSheet', false,
        'dictionary', false
      )
    )
  )
  returning id into v_framework_id;

  -- -------------------------------------------------------------------------
  -- ONE blueprint_version + ONE cell per programme_offering (99 today).
  -- blueprint_id encodes (programme, subject, year) -- locale/region are
  -- constant ('en-AU', 'global') across every seeded offering today, so they
  -- are omitted from the id; blueprint_versions_natural_key fails loudly
  -- rather than colliding silently if that ever stops being true.
  -- -------------------------------------------------------------------------
  insert into public.blueprint_versions (blueprint_id, revision, label, total_items, total_marks)
  select
    'phase2-whole-pool.' || po.programme_id || '.' || po.subject_id || '.y' || po.year_level,
    1,
    'Whole eligible pool -- ' || pr.display_name || ' / ' || s.display_name || ' / Year ' || po.year_level,
    200,
    200
  from public.programme_offerings po
  join public.programmes pr on pr.id = po.programme_id
  join public.subjects s on s.id = po.subject_id
  where po.active;

  insert into public.blueprint_cells (
    blueprint_version_id, cell_id, stage_id, subject_id,
    stimulus_requirement, scoring_eligibility, proportion, marks, estimated_time_seconds
  )
  select
    bv.id, 'whole-pool', 'main', po.subject_id,
    'any', 'either', 1, 200, 86400
  from public.programme_offerings po
  join public.blueprint_versions bv
    on bv.blueprint_id = 'phase2-whole-pool.' || po.programme_id || '.' || po.subject_id || '.y' || po.year_level
   and bv.revision = 1
  where po.active;

  -- -------------------------------------------------------------------------
  -- ONE assessment_profile_version per offering, binding it to the one
  -- framework and its own whole-pool blueprint.
  -- -------------------------------------------------------------------------
  insert into public.assessment_profile_versions (
    profile_id, revision, label, programme_offering_id, framework_version_id, blueprint_version_id,
    delivery_mode, duration_seconds, scoring_algorithm_id, scoring_algorithm_version, availability
  )
  select
    'phase2-fixed.' || po.programme_id || '.' || po.subject_id || '.y' || po.year_level,
    1,
    'Phase 2 fixed -- ' || pr.display_name || ' / ' || s.display_name || ' / Year ' || po.year_level,
    po.id, v_framework_id, bv.id,
    'fixed_path', null, 'question-scorers', 1, 'available'
  from public.programme_offerings po
  join public.programmes pr on pr.id = po.programme_id
  join public.subjects s on s.id = po.subject_id
  join public.blueprint_versions bv
    on bv.blueprint_id = 'phase2-whole-pool.' || po.programme_id || '.' || po.subject_id || '.y' || po.year_level
   and bv.revision = 1
  where po.active;
end $$;
