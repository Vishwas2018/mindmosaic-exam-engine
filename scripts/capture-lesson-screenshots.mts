import "./lib/allow-server-only.mts";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { renderToString } from "react-dom/server";
import React from "react";
import { getLevel3NumberPathway, getLessonByCode } from "@/features/curriculum/lessons/content";
import { LessonPathwayList } from "@/features/curriculum/lessons/components/LessonPathwayList";
import { LessonView } from "@/features/curriculum/lessons/components/LessonView";
import { getMappedQuestionIdsForNode } from "@/features/curriculum/lessons/alignments";

const OUT_DIR = path.join(process.cwd(), "docs", "curriculum", "screenshots", "lessons");
fs.mkdirSync(OUT_DIR, { recursive: true });

// Read compiled Tailwind CSS or minimal Tailwind CDN for standalone HTML snapshot rendering
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
  console.log("Capturing Lesson screenshots via Playwright...");
  const browser = await chromium.launch({ headless: true });

  const pathway = getLevel3NumberPathway();
  const lesson1 = getLessonByCode("VC2M3N01")!;
  const mappedQuestions = getMappedQuestionIdsForNode("VC2M3N01");

  // 1. Pathway List - Desktop
  {
    const pathwayHtml = renderToString(
      React.createElement(LessonPathwayList, { pathway, previewMode: false }),
    );
    const fullHtml = htmlTemplate(pathwayHtml, "MindMosaic - Level 3 Number Pathway");
    const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
    await page.setContent(fullHtml, { waitUntil: "networkidle" });
    const dest = path.join(OUT_DIR, "pathway-list-desktop.png");
    await page.screenshot({ path: dest, fullPage: true });
    console.log(`✓ Captured: ${dest}`);
    await page.close();
  }

  // 2. Pathway List - Mobile
  {
    const pathwayHtml = renderToString(
      React.createElement(LessonPathwayList, { pathway, previewMode: false }),
    );
    const fullHtml = htmlTemplate(pathwayHtml, "MindMosaic - Level 3 Number Pathway");
    const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
    await page.setContent(fullHtml, { waitUntil: "networkidle" });
    const dest = path.join(OUT_DIR, "pathway-list-mobile.png");
    await page.screenshot({ path: dest, fullPage: true });
    console.log(`✓ Captured: ${dest}`);
    await page.close();
  }

  // 3. Lesson Concept View - Desktop
  {
    const lessonHtml = renderToString(
      React.createElement(LessonView, {
        lesson: lesson1,
        nextLesson: { curriculumCode: "VC2M3N02", title: "Place Value to 10,000" },
        availableQuestionsCount: mappedQuestions.length,
      }),
    );
    const fullHtml = htmlTemplate(lessonHtml, "MindMosaic - Lesson VC2M3N01");
    const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
    await page.setContent(fullHtml, { waitUntil: "networkidle" });
    const dest = path.join(OUT_DIR, "lesson-concept-desktop.png");
    await page.screenshot({ path: dest, fullPage: true });
    console.log(`✓ Captured: ${dest}`);
    await page.close();
  }

  // 4. Worked Example Stepper - Desktop
  {
    const lessonHtml = renderToString(
      React.createElement(LessonView, {
        lesson: lesson1,
        nextLesson: { curriculumCode: "VC2M3N02", title: "Place Value to 10,000" },
        availableQuestionsCount: mappedQuestions.length,
      }),
    );
    const fullHtml = htmlTemplate(lessonHtml, "MindMosaic - Worked Example");
    const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
    await page.setContent(fullHtml, { waitUntil: "networkidle" });
    // Focus on worked example section
    const stepperElement = page.locator("section").nth(1);
    const dest = path.join(OUT_DIR, "worked-example-stepper-desktop.png");
    if (await stepperElement.isVisible()) {
      await stepperElement.screenshot({ path: dest });
    } else {
      await page.screenshot({ path: dest, fullPage: true });
    }
    console.log(`✓ Captured: ${dest}`);
    await page.close();
  }

  // 5. Check & Practise Drill Handoff - Desktop
  {
    const lessonHtml = renderToString(
      React.createElement(LessonView, {
        lesson: lesson1,
        nextLesson: { curriculumCode: "VC2M3N02", title: "Place Value to 10,000" },
        availableQuestionsCount: mappedQuestions.length,
      }),
    );
    const fullHtml = htmlTemplate(lessonHtml, "MindMosaic - Check & Practise Drill");
    const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
    await page.setContent(fullHtml, { waitUntil: "networkidle" });
    const checkElement = page.locator("section").last();
    const dest = path.join(OUT_DIR, "check-practise-desktop.png");
    if (await checkElement.isVisible()) {
      await checkElement.screenshot({ path: dest });
    } else {
      await page.screenshot({ path: dest, fullPage: true });
    }
    console.log(`✓ Captured: ${dest}`);
    await page.close();
  }

  await browser.close();
  console.log("All screenshots captured successfully.");
}

main().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
