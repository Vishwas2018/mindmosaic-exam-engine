"use client";

import { useRef, useState } from "react";

import type { CandidateMediaAsset } from "@/features/exam-engine/types/candidate-question";

export interface AudioStimulusProps {
  asset: CandidateMediaAsset;
  disabled?: boolean;
  onPlayback?: (event: { assetId: string; playCount: number }) => void;
}

/** Accessible, non-autoplaying audio with a deterministic local play limit. */
export function AudioStimulus({ asset, disabled = false, onPlayback }: AudioStimulusProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playCount, setPlayCount] = useState(0);
  const maximum = asset.playback.maxPlays;
  const exhausted = maximum !== undefined && playCount >= maximum;

  const handlePlay = () => {
    if (disabled || exhausted) {
      audioRef.current?.pause();
      return;
    }
    const nextCount = playCount + 1;
    setPlayCount(nextCount);
    onPlayback?.({ assetId: asset.id, playCount: nextCount });
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5" aria-labelledby={`${asset.id}-title`}>
      <h2 id={`${asset.id}-title`} className="font-semibold text-slate-900">{asset.title}</h2>
      {asset.instruction ? <p className="mt-1 text-sm text-slate-700">{asset.instruction}</p> : null}
      <audio
        ref={audioRef}
        className="mt-3 w-full"
        controls
        controlsList="nodownload"
        preload="metadata"
        src={asset.src}
        onPlay={handlePlay}
        aria-disabled={disabled || exhausted}
      >
        {asset.accessibility.fallbackMessage}
      </audio>
      {maximum !== undefined ? (
        <p className="mt-2 text-sm text-slate-600" aria-live="polite">
          {exhausted ? `Play limit reached (${maximum} of ${maximum}).` : `${maximum - playCount} of ${maximum} plays remaining.`}
        </p>
      ) : null}
      {exhausted || disabled ? <p className="mt-1 text-sm text-slate-600">{asset.accessibility.fallbackMessage}</p> : null}
      {asset.transcript ? (
        <details className="mt-3 text-sm text-slate-700">
          <summary className="cursor-pointer font-medium">Transcript</summary>
          <p className="mt-2 whitespace-pre-wrap">{asset.transcript.text}</p>
        </details>
      ) : null}
    </section>
  );
}
