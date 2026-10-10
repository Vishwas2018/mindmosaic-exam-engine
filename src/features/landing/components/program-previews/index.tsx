import type { ReactNode } from "react";

import type { ProgramSceneData } from "../../chapter2-scenes";
import { AmcPreview } from "./AmcPreview";
import { CurriculumPreview } from "./CurriculumPreview";
import { IcasPreview } from "./IcasPreview";
import { NaplanPreview } from "./NaplanPreview";
import { PreviewWindow } from "./PreviewWindow";
import { SelectivePreview } from "./SelectivePreview";
import { SingaporePreview } from "./SingaporePreview";

const SCREENS = {
  naplan: NaplanPreview,
  icas: IcasPreview,
  curriculum: CurriculumPreview,
  amc: AmcPreview,
  singapore: SingaporePreview,
  selective: SelectivePreview,
} satisfies Record<ProgramSceneData["id"], () => ReactNode>;

/** The stationary product window for one Chapter 2 programme. It fills whatever frame its parent gives it. */
export function ProgramPreview({ sceneId, className }: { sceneId: ProgramSceneData["id"]; className?: string }) {
  const Screen = SCREENS[sceneId];
  return (
    <PreviewWindow className={className}>
      <Screen />
    </PreviewWindow>
  );
}
