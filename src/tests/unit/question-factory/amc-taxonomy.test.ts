import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { candidateQuestionSchema } from "@/features/question-factory/ingestion/candidate-question";
import { checkTaxonomy } from "@/features/question-factory/validation/taxonomy-checks";
import { skillTaxonomyRegistry, validateTaxonomyEntries } from "@/features/question-factory/taxonomy";
const excluded = new Set(["roadmap-amc-y3-014", "roadmap-amc-y5-006", "roadmap-amc-y5-028"]);
const questions = [3, 5].flatMap(year => JSON.parse(readFileSync(`content/roadmap-drafts/amc-y${year}-draft.json`, "utf8")).questions).map(raw=>candidateQuestionSchema.parse(raw)).filter(q=>!excluded.has(q.id));
describe("explicit AMC taxonomy", () => {
  it("keeps the combined authoritative registry collision-free", () => {
    expect(validateTaxonomyEntries(skillTaxonomyRegistry.list())).toEqual({valid:true,issues:[]});
  });
  it("resolves all 57 reviewed drafts to their exact subject, strand, year and style", () => {
    expect(questions).toHaveLength(57);
    for(const q of questions) expect(checkTaxonomy(q),q.id).toEqual([]);
  });
  it("does not fuzzy-match an unregistered skill", () => {
    const q=structuredClone(questions[0]); q.metadata.skill += " invented variant";
    expect(checkTaxonomy(q)).toMatchObject([{code:"unknown_taxonomy_skill"}]);
  });
});
