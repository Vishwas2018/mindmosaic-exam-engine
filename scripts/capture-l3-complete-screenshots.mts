import "./lib/allow-server-only.mts";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { renderToString } from "react-dom/server";
import React from "react";
import {
  getLevel3MeasurementPathway,
  getLevel3LanguagePathway,
  getLessonByCode,
} from "@/features/curriculum/lessons/content";
import { LessonPathwayList } from "@/features/curriculum/lessons/components/LessonPathwayList";
import { LessonView } from "@/features/curriculum/lessons/components/LessonView";
import { getMappedQuestionIdsForNode } from "@/features/curriculum/lessons/alignments";

const OUT_DIR = path.join(process.cwd(), "docs", "curriculum", "screenshots", "lessons-l3");
fs.mkdirSync(OUT_DIR, { recursive: true });

const htmlTemplate = (bodyContent: string, title: string) => `
<!DOCTYPE html>
<html lang="en" class="h-full bg-slate-50">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            'mm-brand': '#2563eb',
            'mm-brand-deep': '#1d4ed8',
            'mm-tint': '#eff6ff',
            'mm-ink': '#0f172a',
            'mm-ink-soft': '#334155',
            'mm-muted': '#64748b',
            'mm-line': '#e2e8f0',
            'mm-line-soft': '#f1f5f9',
          }
        }
      }
    }
  </script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
  </style>
</head>
<body class="min-h-full bg-slate-50 text-slate-900 antialiased p-4 sm:p-8">
  <div class="max-w-4xl mx-auto">
    ${bodyContent}
  </div>
</body>
</html>
`;

async function main() {
  console.log("Capturing Level 3 Grade-Complete screenshots via Playwright...");
  const browser = await chromium.launch({ headless: true });

  // 1. One Maths Strand Pathway (Measurement)
  {
    const pathway = getLevel3MeasurementPathway({ includeDrafts: true });
    const pathwayHtml = renderToString(
      React.createElement(LessonPathwayList, { pathway, previewMode: false }),
    );
    const fullHtml = htmlTemplate(pathwayHtml, "MindMosaic - Level 3 Measurement Pathway");
    const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
    await page.setContent(fullHtml, { waitUntil: "networkidle" });
    const dest = path.join(OUT_DIR, "01-maths-strand-pathway-measurement.png");
    await page.screenshot({ path: dest, fullPage: true });
    console.log(`✓ Captured 1/4: ${dest}`);
    await page.close();
  }

  // 2. One English Strand Pathway (Language)
  {
    const pathway = getLevel3LanguagePathway({ includeDrafts: true });
    const pathwayHtml = renderToString(
      React.createElement(LessonPathwayList, { pathway, previewMode: false }),
    );
    const fullHtml = htmlTemplate(pathwayHtml, "MindMosaic - Level 3 English Language Pathway");
    const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
    await page.setContent(fullHtml, { waitUntil: "networkidle" });
    const dest = path.join(OUT_DIR, "02-english-strand-pathway-language.png");
    await page.screenshot({ path: dest, fullPage: true });
    console.log(`✓ Captured 2/4: ${dest}`);
    await page.close();
  }

  // 3. One English Worked-Example Stepper (VC2E3LA06 Clause Structures)
  {
    const lesson = getLessonByCode("VC2E3LA06")!;
    const mappedQuestions = getMappedQuestionIdsForNode("VC2E3LA06");
    const lessonHtml = renderToString(
      React.createElement(LessonView, {
        lesson,
        nextLesson: { curriculumCode: "VC2E3LA07", title: "Types of Verbs" },
        availableQuestionsCount: mappedQuestions.length,
      }),
    );
    const fullHtml = htmlTemplate(lessonHtml, "MindMosaic - English Clause Stepper");
    const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
    await page.setContent(fullHtml, { waitUntil: "networkidle" });
    const stepperElement = page.locator("section").nth(1);
    const dest = path.join(OUT_DIR, "03-english-worked-example-stepper.png");
    if (await stepperElement.isVisible()) {
      await stepperElement.screenshot({ path: dest });
    } else {
      await page.screenshot({ path: dest, fullPage: true });
    }
    console.log(`✓ Captured 3/4: ${dest}`);
    await page.close();
  }

  // 4. One Node Showing the Honest "Practice Coming Soon" Check (VC2M3A01 - 0 questions)
  {
    const lesson = getLessonByCode("VC2M3A01")!;
    const mappedQuestions = getMappedQuestionIdsForNode("VC2M3A01"); // returns 0
    const lessonHtml = renderToString(
      React.createElement(LessonView, {
        lesson,
        nextLesson: { curriculumCode: "VC2M3A02", title: "Mental Arithmetic Strategies" },
        availableQuestionsCount: mappedQuestions.length,
      }),
    );
    const fullHtml = htmlTemplate(lessonHtml, "MindMosaic - Practice Coming Soon Check");
    const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
    await page.setContent(fullHtml, { waitUntil: "networkidle" });
    const checkElement = page.locator("section").last();
    const dest = path.join(OUT_DIR, "04-honest-practice-coming-soon-check.png");
    if (await checkElement.isVisible()) {
      await checkElement.screenshot({ path: dest });
    } else {
      await page.screenshot({ path: dest, fullPage: true });
    }
    console.log(`✓ Captured 4/4: ${dest}`);
    await page.close();
  }

  await browser.close();
  console.log("All 4 Level 3 screenshots captured successfully.");
}

main().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
