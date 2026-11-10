import { StudentCanvasScreen } from "@/features/student/canvas/StudentCanvasScreen";

export type MySpaceCanvasState =
  | "resume"
  | "no-resume"
  | "first-visit"
  | "loading"
  | "empty-error";

export function resolveMySpaceState(raw?: string): MySpaceCanvasState {
  if (raw === "first-visit") return "first-visit";
  if (raw === "no-resume") return "no-resume";
  if (raw === "loading") return "loading";
  if (raw === "empty-error") return "empty-error";
  return "resume";
}

export function MySpaceCanvasScreen({ state }: { state: MySpaceCanvasState }) {
  return <StudentCanvasScreen screen="my-space" state={state} />;
}
