import "./lib/allow-server-only.mts";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
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

const TAG = process.env.CAPTURE_TAG ?? "after";
const OUT_DIR = path.join(
  process.env.CAPTURE_OUT_DIR ?? path.join(process.cwd(), "docs", "design", "screenshots"),
  TAG,
);
fs.mkdirSync(OUT_DIR, { recursive: true });

const cssFiles = fs
  .readdirSync(path.join(process.cwd(), ".next", "static", "css"))
  .filter((f) => f.endsWith(".css"));
const compiledCss = cssFiles
  .map((f) => fs.readFileSync(path.join(process.cwd(), ".next", "static", "css", f), "utf8"))
  .join("\n");

const BREAKPOINTS = [
  { name: "375", width: 375, height: 900 },
  { name: "768", width: 768, height: 1000 },
  { name: "1024", width: 1024, height: 1000 },
  { name: "1440", width: 1440, height: 1000 },
];

function htmlTemplate(bodyContent: string, title: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<style>${compiledCss}</style>
<style>body { background: var(--mm-page, #fcfbf8); }</style>
</head>
<body class="mm-root min-h-screen bg-mm-page text-mm-ink">
  <div class="mx-auto max-w-[1400px] p-6">
    ${bodyContent}
  </div>
</body>
</html>`;
}

async function shoot(name: string, html: string) {
  const browser = await chromium.launch({ headless: true });
  for (const bp of BREAKPOINTS) {
    const page = await browser.newPage({ viewport: { width: bp.width, height: bp.height } });
    await page.setContent(html, { waitUntil: "load" });
    const dest = path.join(OUT_DIR, `${name}-${bp.name}.png`);
    await page.screenshot({ path: dest, fullPage: true });
    console.log(`captured ${dest}`);
    await page.close();
  }
  await browser.close();
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
  await shoot("student-learn-pathways", htmlTemplate(panelHtml, "Lessons & Pathways"));

  const lesson = getLessonByCode("VC2M5N01")!;
  const availableQuestionsCount = getMappedQuestionIdsForNode("VC2M5N01").length;
  const lessonHtml = renderToString(
    React.createElement(LessonView, {
      lesson,
      nextLesson: { curriculumCode: "VC2M5N02", title: "Square and prime numbers" },
      availableQuestionsCount,
    }),
  );
  await shoot("lesson-detail", htmlTemplate(lessonHtml, `Lesson ${lesson.curriculumCode}`));

  console.log(`Done. Tag=${TAG}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
