/**
 * `npm run verify:config-versions` — proves the seeded config-version rows
 * (20260823090000/100000/110000; spec §10.1-§10.3; ADR-004 accepted) actually
 * satisfy the Phase 0 Zod contracts in src/schemas/platform/, not merely the
 * DB's own CHECK constraints.
 *
 * WHY THIS EXISTS SEPARATELY FROM THE CHECK CONSTRAINTS. Postgres CHECK
 * cannot run a Zod `.superRefine` (cross-field arithmetic like "proportions
 * sum to 1", "marks sum to totalMarks", or the union discriminator itself).
 * The migration's own triggers/constraints catch structural drift (a second
 * profile per offering, a mismatched framework); this script is the other
 * half spec §10.1 requires -- "every version MUST have ... corresponding Zod
 * validation" -- run against the live rows the migrations actually produced,
 * not against a fixture.
 *
 * For every framework_versions / blueprint_versions row, reconstructs the
 * exact document shape `frameworkVersionSchema` / `assessmentBlueprintVersionSchema`
 * expects (real columns + jsonb spread back together, cells re-nested from
 * blueprint_cells) and parses it. For every assessment_profile_versions row,
 * additionally resolves its pinned framework/blueprint and validates the
 * three together through `resolvedAssessmentProfileSchema` -- the same
 * cross-checks the insert trigger enforces, verified independently here.
 *
 * Exits non-zero and prints every Zod issue found. Read-only.
 */
import { z } from "zod";

import {
  assessmentBlueprintVersionSchema,
  assessmentProfileVersionSchema,
  frameworkVersionSchema,
  resolvedAssessmentProfileSchema,
} from "../src/schemas/platform";
import { connect } from "./migrations/verify";

interface Problem {
  readonly subject: string;
  readonly issues: string;
}

function zodIssues(error: z.ZodError): string {
  return error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`).join("; ");
}

const client = await connect();
const problems: Problem[] = [];

try {
  const frameworks = await client.query<{
    id: string;
    framework_id: string;
    revision: number;
    label: string;
    delivery_mode: string;
    config: Record<string, unknown>;
  }>(`select id, framework_id, revision, label, delivery_mode, config from public.framework_versions`);

  for (const row of frameworks.rows) {
    const candidate = {
      kind: "framework_version" as const,
      schemaVersion: 1 as const,
      frameworkId: row.framework_id,
      revision: row.revision,
      label: row.label,
      deliveryMode: row.delivery_mode,
      ...row.config,
    };
    const result = frameworkVersionSchema.safeParse(candidate);
    if (!result.success) {
      problems.push({ subject: `framework_versions ${row.framework_id}.v${row.revision} (${row.id})`, issues: zodIssues(result.error) });
    }
  }

  const blueprints = await client.query<{
    id: string;
    blueprint_id: string;
    revision: number;
    label: string;
    total_items: number;
    total_marks: number;
  }>(`select id, blueprint_id, revision, label, total_items, total_marks from public.blueprint_versions`);

  const cellRows = await client.query<{
    blueprint_version_id: string;
    cell_id: string;
    section_id: string | null;
    stage_id: string;
    subject_id: string;
    strand_id: string | null;
    skill_node_id: string | null;
    difficulty_band: string | null;
    question_types: string[] | null;
    cognitive_demand: string | null;
    stimulus_requirement: string;
    scoring_eligibility: string;
    item_count: number | null;
    proportion: string | null;
    marks: number;
    estimated_time_seconds: number;
  }>(`select blueprint_version_id, cell_id, section_id, stage_id, subject_id, strand_id, skill_node_id,
             difficulty_band, question_types, cognitive_demand, stimulus_requirement, scoring_eligibility,
             item_count, proportion, marks, estimated_time_seconds
        from public.blueprint_cells`);

  const cellsByBlueprint = new Map<string, typeof cellRows.rows>();
  for (const cell of cellRows.rows) {
    const list = cellsByBlueprint.get(cell.blueprint_version_id) ?? [];
    list.push(cell);
    cellsByBlueprint.set(cell.blueprint_version_id, list);
  }

  function toCandidateCell(cell: (typeof cellRows.rows)[number]) {
    return {
      cellId: cell.cell_id,
      sectionId: cell.section_id ?? undefined,
      stageId: cell.stage_id,
      subjectId: cell.subject_id,
      strandId: cell.strand_id ?? undefined,
      skillNodeId: cell.skill_node_id ?? undefined,
      difficultyBand: cell.difficulty_band ?? undefined,
      questionTypes: cell.question_types ?? undefined,
      cognitiveDemand: cell.cognitive_demand ?? undefined,
      stimulusRequirement: cell.stimulus_requirement,
      scoringEligibility: cell.scoring_eligibility,
      itemCount: cell.item_count ?? undefined,
      proportion: cell.proportion !== null ? Number(cell.proportion) : undefined,
      marks: cell.marks,
      estimatedTimeSeconds: cell.estimated_time_seconds,
    };
  }

  const blueprintDocuments = new Map<string, unknown>();
  for (const row of blueprints.rows) {
    const cells = (cellsByBlueprint.get(row.id) ?? []).map(toCandidateCell);
    const candidate = {
      kind: "assessment_blueprint_version" as const,
      schemaVersion: 1 as const,
      blueprintId: row.blueprint_id,
      revision: row.revision,
      label: row.label,
      cells,
      totalItems: row.total_items,
      totalMarks: row.total_marks,
    };
    blueprintDocuments.set(row.id, candidate);
    const result = assessmentBlueprintVersionSchema.safeParse(candidate);
    if (!result.success) {
      problems.push({ subject: `blueprint_versions ${row.blueprint_id}.v${row.revision} (${row.id})`, issues: zodIssues(result.error) });
    }
  }

  const frameworkDocuments = new Map<string, unknown>();
  for (const row of frameworks.rows) {
    frameworkDocuments.set(row.id, {
      kind: "framework_version" as const,
      schemaVersion: 1 as const,
      frameworkId: row.framework_id,
      revision: row.revision,
      label: row.label,
      deliveryMode: row.delivery_mode,
      ...row.config,
    });
  }

  const profiles = await client.query<{
    id: string;
    profile_id: string;
    revision: number;
    label: string;
    programme_offering_id: string;
    framework_version_id: string;
    blueprint_version_id: string;
    delivery_mode: string;
    duration_seconds: number | null;
    scoring_algorithm_id: string;
    scoring_algorithm_version: number;
    availability: string;
    withdrawn_at: string | null;
  }>(`select id, profile_id, revision, label, programme_offering_id, framework_version_id, blueprint_version_id,
             delivery_mode, duration_seconds, scoring_algorithm_id, scoring_algorithm_version, availability, withdrawn_at
        from public.assessment_profile_versions`);

  const offerings = await client.query<{
    id: string;
    programme_id: string;
    subject_id: string;
    year_level: number;
    locale: string;
    assessment_family_id: string;
  }>(`select po.id, po.programme_id, po.subject_id, po.year_level, po.locale, pr.assessment_family_id
        from public.programme_offerings po
        join public.programmes pr on pr.id = po.programme_id`);
  const offeringById = new Map(offerings.rows.map((o) => [o.id, o]));

  for (const row of profiles.rows) {
    const offering = offeringById.get(row.programme_offering_id);
    if (!offering) {
      problems.push({ subject: `assessment_profile_versions ${row.profile_id} (${row.id})`, issues: `no programme_offering ${row.programme_offering_id}` });
      continue;
    }
    const framework = frameworkDocuments.get(row.framework_version_id);
    const blueprint = blueprintDocuments.get(row.blueprint_version_id);
    const candidate = {
      kind: "assessment_profile_version" as const,
      schemaVersion: 1 as const,
      profileId: row.profile_id,
      revision: row.revision,
      label: row.label,
      offering: {
        family: offering.assessment_family_id,
        programmeId: offering.programme_id,
        subjectId: offering.subject_id,
        yearLevel: offering.year_level,
        locale: offering.locale,
      },
      frameworkId: (framework as { frameworkId: string }).frameworkId,
      frameworkRevision: (framework as { revision: number }).revision,
      blueprintId: (blueprint as { blueprintId: string }).blueprintId,
      blueprintRevision: (blueprint as { revision: number }).revision,
      deliveryMode: row.delivery_mode,
      durationSeconds: row.duration_seconds,
      scoringAlgorithmId: row.scoring_algorithm_id,
      scoringAlgorithmVersion: row.scoring_algorithm_version,
      availability: row.availability,
      withdrawnAt: row.withdrawn_at ?? undefined,
    };

    const result = assessmentProfileVersionSchema.safeParse(candidate);
    if (!result.success) {
      problems.push({ subject: `assessment_profile_versions ${row.profile_id} (${row.id})`, issues: zodIssues(result.error) });
      continue;
    }

    const resolved = resolvedAssessmentProfileSchema.safeParse({
      profile: result.data,
      framework,
      blueprint,
    });
    if (!resolved.success) {
      problems.push({ subject: `resolved profile ${row.profile_id} (${row.id})`, issues: zodIssues(resolved.error) });
    }
  }

  console.log(
    `Checked ${frameworks.rows.length} framework_version(s), ${blueprints.rows.length} blueprint_version(s), ${profiles.rows.length} assessment_profile_version(s).`,
  );

  if (problems.length === 0) {
    console.log("PASS — every row validates against its Phase 0 Zod contract, individually and composed.");
  } else {
    console.log(`\nFAIL — ${problems.length} row(s) failed Zod validation:`);
    for (const problem of problems) console.log(`  - ${problem.subject}: ${problem.issues}`);
    process.exitCode = 1;
  }
} finally {
  await client.end();
}
