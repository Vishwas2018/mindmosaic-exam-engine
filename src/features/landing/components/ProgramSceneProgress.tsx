"use client";

import { chapter2Scenes } from "../chapter2-scenes";
import { chapterTwo } from "../content";
import { ChapterSceneProgress } from "./ChapterSceneProgress";

const ITEMS = chapter2Scenes.map((scene) => ({ id: scene.id, number: scene.number, label: scene.navLabel }));

/**
 * Chapter 2's programme progress ("01 NAPLAN ... 06 Selective"): the shared
 * ChapterSceneProgress fed with the six programme scenes.
 *
 * `activeLayer` is the chapter's layer index (0 is the intro, scenes are 1..6).
 */
export function ProgramSceneProgress({
  activeLayer,
  onSelect,
}: {
  activeLayer: number;
  onSelect: (sceneIndex: number) => void;
}) {
  return (
    <ChapterSceneProgress
      items={ITEMS}
      activeScene={activeLayer - 1}
      onSelect={onSelect}
      ariaLabel={chapterTwo.progressLabel}
    />
  );
}
