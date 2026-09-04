import "./lib/allow-server-only.mts";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { renderToString } from "react-dom/server";
import React from "react";
import {
  getCurriculumPathwaysForYearLevel,
  groupPathwaysByLearningArea,
  getLessonByCode,
} from "@/features/curriculum/lessons/content";
import { CurriculumPathwaysPanel } from "@/features/curriculum/lessons/components/CurriculumPathwaysPanel";
import { LessonView } from "@/features/curriculum/lessons/components/LessonView";
import { getMappedQuestionIdsForNode } from "@/features/curriculum/lessons/alignments";

const cssFiles = fs
  .readdirSync(path.join(process.cwd(), ".next", "static", "css"))
  .filter((f) => f.endsWith(".css"));
const compiledCss = cssFiles
  .map((f) => fs.readFileSync(path.join(process.cwd(), ".next", "static", "css", f), "utf8"))
  .join("\n");

function htmlTemplate(bodyContent: string, title: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<style>${compiledCss}</style>
</head>
<body class="mm-root min-h-screen bg-mm-page text-mm-ink">
  <div class="mx-auto max-w-[1400px] p-6">
    ${bodyContent}
  </div>
</body>
</html>`;
}

async function check(name: string, html: string) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  const page = await context.newPage();
  await page.setContent(html, { waitUntil: "load" });
  const results = await new AxeBuilder({ page }).analyze();
  const seriousOrCritical = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  console.log(`\n=== ${name} ===`);
  console.log(`Total violations: ${results.violations.length}`);
  console.log(`Serious/critical: ${seriousOrCritical.length}`);
  for (const v of results.violations) {
    console.log(`  [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))`);
  }
  await browser.close();
  return seriousOrCritical;
}

async function main() {
  const yearLevel = 5;
  const pathways = getCurriculumPathwaysForYearLevel(yearLevel);
  const learningAreas = groupPathwaysByLearningArea(pathways);

  const panelHtml = renderToString(
    React.createElement(CurriculumPathwaysPanel, {
      yearLevel,
      learningAreas,
      recommendedFocusLabel: "Numeracy",
    }),
  );
  const panelViolations = await check(
    "/student/learn — Lessons & Pathways panel",
    htmlTemplate(panelHtml, "Lessons & Pathways"),
  );

  const lesson = getLessonByCode("VC2M5N01")!;
  const availableQuestionsCount = getMappedQuestionIdsForNode("VC2M5N01").length;
  const lessonHtml = renderToString(
    React.createElement(LessonView, {
      lesson,
      nextLesson: { curriculumCode: "VC2M5N02", title: "Square and prime numbers" },
      availableQuestionsCount,
    }),
  );
  const lessonViolations = await check(
    "Lesson detail page",
    htmlTemplate(lessonHtml, `Lesson ${lesson.curriculumCode}`),
  );

  const total = panelViolations.length + lessonViolations.length;
  console.log(`\nTOTAL serious/critical violations across both screens: ${total}`);
  if (total > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
