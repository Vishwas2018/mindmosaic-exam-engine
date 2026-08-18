import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AudioStimulus } from "@/features/exam-engine/components/AudioStimulus";
import type { CandidateMediaAsset } from "@/features/exam-engine/types/candidate-question";

const asset: CandidateMediaAsset = {
  id: "original-audio",
  kind: "audio",
  src: "/media/assessment/original-audio.mp3",
  mimeType: "audio/mpeg",
  durationSeconds: 5,
  title: "Listen once",
  instruction: "Use the play control when ready.",
  playback: { autoplay: false, maxPlays: 1 },
  accessibility: {
    fallbackMessage: "Ask a supervisor for the approved accommodation.",
    accommodationRequiredWhenUnavailable: true,
  },
  integrity: { sha256: "a".repeat(64), sizeBytes: 800 },
};

describe("AudioStimulus", () => {
  beforeEach(() => {
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
  });

  it("uses native controls without autoplay and exposes deterministic play limits", () => {
    const onPlayback = vi.fn();
    const { container } = render(<AudioStimulus asset={asset} onPlayback={onPlayback} />);
    const audio = container.querySelector("audio");
    expect(audio).not.toBeNull();
    expect(audio).toHaveAttribute("controls");
    expect(audio).not.toHaveAttribute("autoplay");
    expect(screen.getByText("1 of 1 plays remaining.")).toBeInTheDocument();

    fireEvent.play(audio!);
    expect(onPlayback).toHaveBeenCalledWith({ assetId: "original-audio", playCount: 1 });
    expect(screen.getByText("Play limit reached (1 of 1).")).toBeInTheDocument();

    fireEvent.play(audio!);
    expect(onPlayback).toHaveBeenCalledTimes(1);
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  });
});
