import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { motionValue } from "framer-motion";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { cinematicMotion } from "@/features/landing/cinematic/config";
import { HeroScenePhoto } from "@/features/landing/components/HeroScenePhoto";
import { landingMedia } from "@/features/landing/media";

/*
 * Photograph readiness: a scene may cover the one beneath it only after its picture has loaded
 * AND decoded. A failed request, a broken file or a decode error must never be marked ready, and
 * must leave the previous photograph on screen.
 */

const slot = (index: number) => landingMedia.chapter1.scenes[landingMedia.chapter1.sceneOrder[index]!];
const starts = Object.values(cinematicMotion.chapter1.sceneStarts);

function stubImage({ complete, naturalWidth, decode }: { complete: boolean; naturalWidth: number; decode: () => Promise<void> }) {
  vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(complete);
  vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(naturalWidth);
  Object.defineProperty(HTMLImageElement.prototype, "decode", { configurable: true, value: decode });
}

function mount(options: { index?: number; q?: number; ready?: number; nextReady?: number | null; progress?: boolean } = {}) {
  const { index = 1, q = starts[1]! + 0.1, ready = 0, nextReady = null, progress = true } = options;
  const readyValue = motionValue(ready);
  const onSettled = vi.fn();
  const view = render(
    <HeroScenePhoto
      index={index}
      slot={slot(index)}
      progress={progress ? motionValue(q) : null}
      ready={readyValue}
      nextReady={nextReady === null ? null : motionValue(nextReady)}
      hot
      priority={index === 0}
      onSettled={onSettled}
    />,
  );
  const wrapper = view.container.querySelector<HTMLElement>("[data-hero-scene]")!;
  return { ...view, wrapper, photo: wrapper.querySelector("img")!, readyValue, onSettled };
}

beforeEach(() => {
  // Photographs under test start unloaded: `complete` false until a test says otherwise.
  stubImage({ complete: false, naturalWidth: 0, decode: () => Promise.resolve() });
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe("Chapter 1 photograph readiness", () => {
  it("starts unready: a scene whose picture has not arrived covers nothing", () => {
    const { wrapper, readyValue } = mount();
    expect(wrapper).toHaveAttribute("data-photo-state", "loading");
    expect(readyValue.get()).toBe(0);
    expect(Number(getComputedStyle(wrapper).opacity)).toBe(0);
  });

  it("becomes ready only after the picture has loaded AND decoded, then eases in", async () => {
    let finishDecode!: () => void;
    stubImage({ complete: false, naturalWidth: 1672, decode: () => new Promise<void>((resolve) => (finishDecode = resolve)) });
    const { wrapper, photo, readyValue, onSettled } = mount();
    fireEvent.load(photo);
    // Loaded but not decoded yet: still not allowed to cover anything.
    expect(readyValue.get()).toBe(0);
    expect(wrapper).toHaveAttribute("data-photo-state", "loading");
    expect(onSettled).not.toHaveBeenCalled();
    await act(async () => finishDecode());
    await waitFor(() => expect(readyValue.get()).toBe(1));
    expect(wrapper).toHaveAttribute("data-photo-state", "ready");
    expect(onSettled).toHaveBeenCalledWith(1);
    await waitFor(() => expect(Number(getComputedStyle(wrapper).opacity)).toBe(1));
  });

  it("never marks a failed request as ready, and leaves the scene covering nothing", async () => {
    const { wrapper, photo, readyValue, onSettled } = mount();
    fireEvent.error(photo);
    await waitFor(() => expect(wrapper).toHaveAttribute("data-photo-state", "error"));
    expect(readyValue.get()).toBe(0);
    expect(onSettled).not.toHaveBeenCalled();
    expect(Number(getComputedStyle(wrapper).opacity)).toBe(0);
  });

  it("never marks a loaded-but-undecodable picture as ready", async () => {
    stubImage({ complete: false, naturalWidth: 1672, decode: () => Promise.reject(new Error("EncodingError")) });
    const { wrapper, photo, readyValue, onSettled } = mount();
    fireEvent.load(photo);
    await waitFor(() => expect(wrapper).toHaveAttribute("data-photo-state", "error"));
    expect(readyValue.get()).toBe(0);
    expect(onSettled).not.toHaveBeenCalled();
  });

  it("treats a 'load' with no pixels as a failure, not a success", async () => {
    const { wrapper, photo, readyValue } = mount();
    fireEvent.load(photo);
    await waitFor(() => expect(wrapper).toHaveAttribute("data-photo-state", "error"));
    expect(readyValue.get()).toBe(0);
  });

  it("settles a picture that finished before hydration without waiting for a load event", async () => {
    stubImage({ complete: true, naturalWidth: 1672, decode: () => Promise.resolve() });
    const { wrapper, readyValue, onSettled } = mount({ index: 0, q: 0, ready: 1 });
    await waitFor(() => expect(wrapper).toHaveAttribute("data-photo-state", "ready"));
    expect(readyValue.get()).toBe(1);
    expect(onSettled).toHaveBeenCalledWith(0);
  });

  it("hides scene 1 if its server-rendered request turns out to have failed", async () => {
    stubImage({ complete: true, naturalWidth: 0, decode: () => Promise.resolve() });
    const { wrapper, readyValue } = mount({ index: 0, q: 0, ready: 1 });
    await waitFor(() => expect(wrapper).toHaveAttribute("data-photo-state", "error"));
    expect(readyValue.get()).toBe(0);
    await waitFor(() => expect(Number(getComputedStyle(wrapper).opacity)).toBe(0));
  });

  it("keeps the last decoded photograph underneath until the next one is ready AND covers it", () => {
    const q = starts[2]! + 0.1; // scene 3 fully in
    // Scene 2 is fully covered by a ready scene 3: dropped from painting.
    expect(Number(getComputedStyle(mount({ index: 1, q, ready: 1, nextReady: 1 }).wrapper).opacity)).toBe(0);
    // Scene 3 never became ready (failed or still loading): scene 2 stays on screen.
    expect(Number(getComputedStyle(mount({ index: 1, q, ready: 1, nextReady: 0 }).wrapper).opacity)).toBe(1);
  });

  it("renders a plain still photograph in natural flow: no inline opacity or transform", () => {
    const { wrapper, photo } = mount({ index: 0, progress: false, ready: 1 });
    expect(wrapper.getAttribute("style") ?? "").not.toMatch(/opacity|transform|scale/);
    expect(photo.parentElement!.getAttribute("style") ?? "").not.toMatch(/opacity|transform|scale/);
  });

  it("gives only scene 1 a high-priority preload; the others load low and eagerly once mounted", () => {
    const first = mount({ index: 0, q: 0, ready: 1 });
    expect(first.photo.getAttribute("fetchpriority")).not.toBe("low");
    const later = mount({ index: 2 });
    expect(later.photo.getAttribute("fetchpriority")).toBe("low");
    expect(later.photo.getAttribute("loading")).toBe("eager");
  });
});
