/**
 * Whether sessions may be served questions that a person must mark.
 *
 * Today that is exactly the four essay items (answerKey.kind === "manual"):
 * Year 3 and Year 5, NAPLAN-style and ICAS-style writing. Their result reads
 * "marked by a person" and stays "marks pending review" for ever when the
 * family has no teacher — the only marking surface for a bank question is the
 * teacher's (src/app/api/teacher/marking). The standalone timed-writing
 * feature (/student/writing, parent marking) is separate and unaffected.
 *
 * Beta: false. Flip to true once there is a way for a family-only account to
 * get these marked (or an automated first-pass marker), and the hint copy in
 * ExamConfigurator becomes true again. This is a serving filter only: nothing
 * is removed from the bank, the manifest, or any count of published items.
 */
export const SERVE_MANUALLY_MARKED_QUESTIONS = false;
