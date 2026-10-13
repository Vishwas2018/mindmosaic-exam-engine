import { writingRubricSchema, type WritingRubric } from "../rubric";

/**
 * "Scholarship-style written expression", version 1.
 *
 * Six criteria on a 1-5 scale. Anchors are original MindMosaic wording written
 * for a Year 6 writer and for a parent who is not a teacher: each says what the
 * writing LOOKS LIKE at a level. Levels 2 and 4 are "in between" and carry no
 * text of their own, so a parent chooses 2 when a piece is better than the 1
 * description but short of the 3 one.
 *
 * Nothing here is copied or adapted from a published marking guide or any
 * school's rubric. It is a practice aid, not an official or predicted score.
 */
export const scholarshipWrittenExpressionRubric: WritingRubric = writingRubricSchema.parse({
  id: "scholarship-written-expression",
  version: 1,
  title: "Scholarship-style written expression",
  scaleMin: 1,
  scaleMax: 5,
  criteria: [
    {
      id: "punctuation",
      label: "Punctuation",
      lookFor: "Capitals, full stops, commas, apostrophes and speech marks, and whether they help you read.",
      anchors: {
        "1": "Capital letters and full stops are often missing or in the wrong place, so sentences run together. Commas, apostrophes and speech marks are rarely used or are mostly wrong.",
        "3": "Most sentences start with a capital and end with the right mark. Commas in lists and apostrophes are usually right. Speech marks, colons or brackets are tried but not always correct.",
        "5": "Punctuation is accurate and helps the reader. Commas are used after openers and inside longer sentences, apostrophes and speech marks are secure, and a dash, colon or semicolon is used on purpose for effect.",
      },
    },
    {
      id: "creativity",
      label: "Creativity",
      lookFor: "Fresh ideas, interesting word choices and a voice that sounds like a real person.",
      anchors: {
        "1": "Ideas are the first obvious ones and mostly read as a list of events or plain statements. There is little detail, comparison or personality.",
        "3": "There are some fresh ideas or details and a few interesting word choices or comparisons. The piece has some personality, but much of it is familiar.",
        "5": "The ideas feel original and are handled in a surprising or memorable way. Word choice is precise, images are vivid, and the writer takes a choice, such as an unusual angle, a twist or a striking detail, that stays with the reader.",
      },
    },
    {
      id: "construction",
      label: "Construction (structure)",
      lookFor: "A planned opening, ideas in a sensible order, paragraphs, and an ending that finishes the piece.",
      anchors: {
        "1": "There is no clear beginning, middle and end. Ideas are jumbled or repeated, there are few or no paragraphs, and the writing stops rather than ends.",
        "3": "There is a clear opening and ending and the ideas are mostly in a sensible order, grouped into paragraphs. Links between ideas are simple, such as 'then' and 'next', and the ending may feel rushed.",
        "5": "The opening draws the reader in. Each paragraph has a job and leads to the next with varied links, the pace is controlled, and the ending feels planned and completes the piece.",
      },
    },
    {
      id: "grammar",
      label: "Grammar",
      lookFor: "Complete sentences, steady tense, words that agree, and a mix of sentence lengths.",
      anchors: {
        "1": "Many sentences are incomplete or joined without a break. Tense and agreement (for example 'we was') slip often, so the meaning is sometimes unclear.",
        "3": "Most sentences are complete and correct and the tense is mostly steady. Longer sentences are attempted with the odd slip.",
        "5": "Sentences are correct and varied, with simple, compound and complex forms. Tense is consistent, agreement is secure, and sentence length is chosen to shape meaning.",
      },
    },
    {
      id: "spelling",
      label: "Spelling",
      lookFor: "Common words, year-level words and ambitious words spelt correctly.",
      anchors: {
        "1": "Many common words are misspelt, including words taught in earlier years, and the writing is hard to read in places.",
        "3": "Common and year-level words are mostly correct. Mistakes appear in harder words, such as double letters, silent letters or endings that change, but they rarely block reading.",
        "5": "Almost every word is correct, including ambitious vocabulary. Any errors are in rare or very difficult words, and the writer clearly uses spelling strategies.",
      },
    },
    {
      id: "relevance",
      label: "Relevance",
      lookFor: "Does the writing answer the prompt, in the right form, from start to finish?",
      anchors: {
        "1": "The writing mostly does not answer the prompt, or only touches on it. It may wander off topic or be in the wrong form, such as a story when an argument was asked for.",
        "3": "The writing addresses the prompt and stays mostly on topic. Some parts drift or are not connected to the task, and the form is roughly right.",
        "5": "The writing responds directly to the prompt all the way through. Every part serves the task, the form and purpose match what was asked, and the interpretation shows thought.",
      },
    },
  ],
});
