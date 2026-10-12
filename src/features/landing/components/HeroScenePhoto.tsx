"use client";

import { useEffect, useRef, useState, type CSSProperties, type SyntheticEvent } from "react";
import Image from "next/image";

import { cinematicMotion } from "../cinematic/config";
import { resolveSlotSrc, type LandingMediaSlot } from "../media";

/** How long to wait for `decode()` after `load` before showing the picture anyway, ms. */
const DECODE_GRACE_MS = 250;

/**
 * One Chapter 1 scene's full photograph. It sits over the scene's inlined blurred preview (drawn by
 * the stage), starts invisible, and fades in only once the browser has loaded AND decoded it, so
 * scrolling never shows a half-painted or late-popping picture and the timeline never waits for it.
 * If the file fails, the preview simply stays and the stage says so.
 *
 * Scene 1 is in the server HTML: it starts visible (the browser paints it as it arrives) and only
 * drops out if the request is found to have failed. Later scenes start hidden.
 *
 * `onSettled(index, ok)` fires once, when the photograph is decoded (`ok`) or has failed.
 */
export function HeroScenePhoto({
  index,
  slot,
  priority,
  onSettled,
}: {
  index: number;
  slot: LandingMediaSlot;
  priority: boolean;
  onSettled: (index: number, ok: boolean) => void;
}) {
  const [shown, setShown] = useState(priority);
  const settled = useRef(false);
  const imageRef = useRef<HTMLImageElement>(null);

  const settle = (ok: boolean) => {
    if (settled.current) return;
    settled.current = true;
    setShown(ok);
    onSettled(index, ok);
  };

  const onLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const element = event.currentTarget;
    const decoded = typeof element.decode === "function" ? element.decode().catch(() => undefined) : Promise.resolve();
    void Promise.race([decoded, new Promise((resolve) => setTimeout(resolve, DECODE_GRACE_MS))]).then(() => settle(true));
  };

  // Scene 1 may finish (or fail) before React attaches onLoad/onError to the server-rendered element.
  useEffect(() => {
    const element = imageRef.current;
    if (!element || !element.complete || settled.current) return;
    if (element.naturalWidth > 0) {
      const decoded = typeof element.decode === "function" ? element.decode().catch(() => undefined) : Promise.resolve();
      void Promise.race([decoded, new Promise((resolve) => setTimeout(resolve, DECODE_GRACE_MS))]).then(() => settle(true));
    } else {
      settle(false);
    }
    // settle() only closes over refs and stable props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Image
      ref={imageRef}
      src={resolveSlotSrc(slot)}
      alt={slot.alt}
      fill
      sizes="100vw"
      quality={85}
      preload={priority}
      onLoad={onLoad}
      onError={() => settle(false)}
      style={
        {
          "--pos-m": slot.focalMobile,
          "--pos-t": slot.focalTablet,
          "--pos-d": slot.focalDesktop,
          opacity: shown ? 1 : 0,
          transition: `opacity ${cinematicMotion.chapter1.photoFadeMs}ms ease`,
        } as CSSProperties
      }
      className="object-cover [object-position:var(--pos-m)] md:[object-position:var(--pos-t)] lg:[object-position:var(--pos-d)] motion-reduce:transition-none"
    />
  );
}
