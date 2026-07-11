import type { CandidateAnswer } from "@/features/exam-engine/types";
import type { Question } from "@/schemas/question.schema";

/**
 * Human-readable formatting of answer keys and submitted responses for the
 * results review. Manual-review questions (essays) intentionally return null
 * from formatCorrectAnswer: no objective answer is invented for them.
 */

function optionText(question: Question, optionId: string): string {
  return (
    question.options.find((option) => option.id === optionId)?.text ?? optionId
  );
}

function interactionText(
  question: Question,
  kind: "item" | "zone" | "source" | "target" | "label" | "blank" | "field",
  id: string,
): string {
  const interaction = question.interaction;
  if (!interaction) return id;
  switch (interaction.type) {
    case "matching":
      if (kind === "source") {
        return interaction.sources.find((entry) => entry.id === id)?.text ?? id;
      }
      return interaction.targets.find((entry) => entry.id === id)?.text ?? id;
    case "ordering":
      return interaction.items.find((entry) => entry.id === id)?.text ?? id;
    case "drag_drop":
      if (kind === "item") {
        return interaction.items.find((entry) => entry.id === id)?.text ?? id;
      }
      return interaction.zones.find((entry) => entry.id === id)?.label ?? id;
    case "label_diagram":
      if (kind === "label") {
        return interaction.labels.find((entry) => entry.id === id)?.text ?? id;
      }
      return interaction.targets.find((entry) => entry.id === id)?.label ?? id;
    case "fill_blank":
      return interaction.blanks.find((entry) => entry.id === id)?.label ?? id;
    case "dropdown": {
      if (kind === "field") {
        return interaction.fields.find((entry) => entry.id === id)?.label ?? id;
      }
      for (const field of interaction.fields) {
        const option = field.options.find((entry) => entry.id === id);
        if (option) return option.text;
      }
      return id;
    }
    default:
      return id;
  }
}

function hotspotRegionLabel(question: Question, regionId: string): string {
  for (const visual of question.visuals) {
    if (visual.type !== "hotspot_svg") continue;
    const region = visual.data.regions.find((entry) => entry.id === regionId);
    if (region) return region.accessibleLabel;
  }
  return regionId;
}

/** Format the correct answer for display; null for manual-review questions. */
export function formatCorrectAnswer(question: Question): string | null {
  const key = question.answerKey;
  switch (key.kind) {
    case "single_option":
      return optionText(question, key.optionId);
    case "multiple_options":
      return key.optionIds.map((id) => optionText(question, id)).join("; ");
    case "number":
      return key.unit ? `${key.value} ${key.unit}` : String(key.value);
    case "text":
      return key.acceptableAnswers.join(" or ");
    case "boolean":
      return key.value ? "True" : "False";
    case "fill_blank":
      return key.blanks
        .map(
          (blank) =>
            `${interactionText(question, "blank", blank.id)}: ${blank.acceptedAnswers[0]}`,
        )
        .join("; ");
    case "dropdown":
      return key.fields
        .map(
          (field) =>
            `${interactionText(question, "field", field.id)}: ${interactionText(question, "item", field.correctOptionId)}`,
        )
        .join("; ");
    case "matching":
      return key.pairs
        .map((pair) => {
          const sourceKind =
            question.interaction?.type === "label_diagram" ? "label" : "source";
          return `${interactionText(question, sourceKind, pair.sourceId)} matches ${interactionText(question, "target", pair.targetId)}`;
        })
        .join("; ");
    case "ordering":
      return key.optionIds
        .map((id, index) => `${index + 1}. ${interactionText(question, "item", id)}`)
        .join("; ");
    case "hotspot":
      return key.regionIds.map((id) => hotspotRegionLabel(question, id)).join("; ");
    case "drag_drop":
      return Object.entries(key.placements)
        .map(
          ([itemId, zoneId]) =>
            `${interactionText(question, "item", itemId)} goes in ${interactionText(question, "zone", zoneId)}`,
        )
        .join("; ");
    case "manual":
      return null;
  }
}

/** Format a submitted response for display; null when unanswered. */
export function formatResponse(
  question: Question,
  answer: CandidateAnswer | undefined,
): string | null {
  if (answer === undefined || answer === null) return null;
  if (typeof answer === "string") {
    if (answer.trim().length === 0) return null;
    if (question.answerKey.kind === "single_option") {
      return optionText(question, answer);
    }
    return answer;
  }
  if (typeof answer === "number") return String(answer);
  if (typeof answer === "boolean") return answer ? "True" : "False";
  if (Array.isArray(answer)) {
    if (answer.length === 0) return null;
    switch (question.answerKey.kind) {
      case "multiple_options":
        return answer.map((id) => optionText(question, id)).join("; ");
      case "ordering":
        return answer
          .map((id, index) => `${index + 1}. ${interactionText(question, "item", id)}`)
          .join("; ");
      case "hotspot":
        return answer.map((id) => hotspotRegionLabel(question, id)).join("; ");
      default:
        return answer.join("; ");
    }
  }
  const entries = Object.entries(answer);
  if (entries.length === 0) return null;
  switch (question.answerKey.kind) {
    case "fill_blank":
      return entries
        .map(
          ([blankId, text]) =>
            `${interactionText(question, "blank", blankId)}: ${text}`,
        )
        .join("; ");
    case "dropdown":
      return entries
        .map(
          ([fieldId, valueId]) =>
            `${interactionText(question, "field", fieldId)}: ${interactionText(question, "item", valueId)}`,
        )
        .join("; ");
    case "matching":
      return entries
        .map(([sourceId, targetId]) => {
          const sourceKind =
            question.interaction?.type === "label_diagram" ? "label" : "source";
          return `${interactionText(question, sourceKind, sourceId)} matched to ${interactionText(question, "target", targetId)}`;
        })
        .join("; ");
    case "drag_drop":
      return entries
        .map(
          ([itemId, zoneId]) =>
            `${interactionText(question, "item", itemId)} placed in ${interactionText(question, "zone", zoneId)}`,
        )
        .join("; ");
    default:
      return entries.map(([id, value]) => `${id}: ${value}`).join("; ");
  }
}

/** Format whole seconds as a spoken-friendly "X min Y sec" string. */
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds} sec`;
  return `${minutes} min ${seconds} sec`;
}

/** Format remaining seconds as MM:SS for the countdown display. */
export function formatClock(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
