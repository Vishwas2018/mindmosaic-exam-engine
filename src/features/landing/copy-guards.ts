/**
 * Patterns the landing-page tests use to keep marketing copy truthful.
 * Kept in one place so the unit and e2e suites cannot drift apart, and so a
 * test can prove each pattern actually fires on a known-bad string (see
 * landing-copy-guards.test.ts) instead of passing because it never matches.
 */

/** Adaptive-questioning, tutoring and AI-product claims MindMosaic does not make. */
export const PROHIBITED_PRODUCT_CLAIMS = /\b(?:AI|A\.I\.|artificial intelligence|adaptive|adapt to you|AI tutor)\b/i;

/** The recommendation drill is five questions (DRILL_QUESTION_COUNT), never ten. */
export const TEN_QUESTION_DRILL = /\b(?:10|ten)[- ]question/i;

/** A drill is offered only when a test has eligible missed skills, never after every test. */
export const EVERY_TEST_PROMISE = /\b(?:every test|after every test|each test's results)\b/i;

/** Student-only recommendation actions must not appear as parent-view capabilities. */
export const PARENT_LAUNCHES_DRILL = /\b(?:five|5)[- ]questions?\b/i;

/**
 * Alt text for campaign photography describes the scene only. Words that
 * describe interface or branding mean product UI or a logo is baked into
 * the picture, which docs/design.md §27 forbids.
 */
export const BAKED_UI_ALT_WORDS = /\b(?:MindMosaic|dashboard|logo|interface|app|card|cards|showing|displays?|shows)\b/i;
