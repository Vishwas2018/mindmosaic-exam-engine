import { describe, expect, it } from "vitest";

import { chapter3Scenes } from "@/features/landing/chapter3-journey";
import { chapter4Scenes } from "@/features/landing/chapter4-progress";
import { chapter3LayerStarts, chapter4LayerStarts, layerForegroundOpacity } from "@/features/landing/cinematic/sceneProgress";
import { cinematicMotion } from "@/features/landing/cinematic/config";
import {
  createFocusHandoff,
  findByFocusKey,
  focusKeyOf,
  makeAnchorFor,
} from "@/features/landing/cinematic/useFocusContinuity";

/** The same copy, wrapped the way each tree wraps it: a plain <section> (natural) and a motion <div> (pinned). */
function section(tree: "natural" | "pinned") {
  const root = document.createElement("section");
  const scene = (tag: string) =>
    `<${tag} data-scene="practise"><a href="/a">Explore practice</a><button>More</button></${tag}>`;
  root.innerHTML =
    tree === "natural"
      ? `<div><div>${scene("section")}</div><div data-handoff="chapter-4"><a href="/b">Next</a></div></div>`
      : `<div><div><div>${scene("div")}</div></div><div data-handoff="chapter-4"><a href="/b">Next</a></div><nav><button>01 Learn</button></nav></div>`;
  document.body.append(root);
  return root;
}

describe("focus keys identify a control independent of the tree around it", () => {
  it("is the same in the natural-flow and the pinned tree, and resolves back to the matching control", () => {
    const natural = section("natural");
    const pinned = section("pinned");
    const naturalLink = natural.querySelectorAll("a")[0]!;
    const naturalButton = natural.querySelector("button")!;
    const naturalHandoff = natural.querySelectorAll("a")[1]!;

    for (const control of [naturalLink, naturalButton, naturalHandoff]) {
      const key = focusKeyOf(natural, control)!;
      expect(key).toBeTruthy();
      const twin = findByFocusKey(pinned, key)!;
      expect(twin.textContent).toBe(control.textContent);
      expect(pinned.contains(twin)).toBe(true);
      expect(focusKeyOf(pinned, twin)).toBe(key);
    }
    natural.remove();
    pinned.remove();
  });

  it("has no key for controls outside a scene or hand-off (the progress rail), or outside the section", () => {
    const pinned = section("pinned");
    expect(focusKeyOf(pinned, pinned.querySelector("nav button"))).toBeNull();
    expect(focusKeyOf(pinned, document.body)).toBeNull();
    expect(focusKeyOf(pinned, null)).toBeNull();
    expect(findByFocusKey(pinned, "scene:missing#0")).toBeNull();
    pinned.remove();
  });
});

describe("the one-slot hand-off between the two trees", () => {
  it("is consumed once, so a restore can never be applied twice", () => {
    const handoff = createFocusHandoff();
    expect(handoff.take()).toBeNull();
    handoff.put("scene:practise#0");
    expect(handoff.take()).toBe("scene:practise#0");
    expect(handoff.take()).toBeNull();
  });
});

describe("makeAnchorFor", () => {
  for (const [name, starts, crossfade, ids] of [
    ["chapter 3", chapter3LayerStarts, cinematicMotion.chapter3.crossfade, chapter3Scenes.map((scene) => scene.id)],
    ["chapter 4", chapter4LayerStarts, cinematicMotion.chapter4.crossfade, chapter4Scenes.map((scene) => scene.id)],
  ] as const) {
    it(`${name}: every scene and the hand-off anchor on a fully presented layer`, () => {
      const anchorFor = makeAnchorFor(starts, crossfade, ids, 1);
      ids.forEach((id, index) => {
        const container = document.createElement("div");
        container.setAttribute("data-scene", id);
        const progress = anchorFor(container)!;
        expect(layerForegroundOpacity(progress, starts, index + 1, crossfade)).toBeGreaterThanOrEqual(0.99);
      });
      const handoff = document.createElement("div");
      handoff.setAttribute("data-handoff", "x");
      const progress = anchorFor(handoff)!;
      expect(progress).toBeLessThanOrEqual(1);
      expect(layerForegroundOpacity(progress, starts, starts.length - 1, crossfade)).toBeGreaterThanOrEqual(0.99);
    });
  }

  it("returns null for a scene it does not know", () => {
    const container = document.createElement("div");
    container.setAttribute("data-scene", "nope");
    expect(makeAnchorFor(chapter3LayerStarts, 0.055, ["a"], 1)(container)).toBeNull();
  });
});
