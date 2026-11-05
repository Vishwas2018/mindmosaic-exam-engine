"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/**
 * The still-life image inside a SubjectPlate: responsive AVIF/WebP at the size the plate is actually
 * drawn, lazy-loaded (so the plates on a long /practice page, and any hidden below a breakpoint,
 * are never fetched until they are near the viewport).
 *
 * It is a client leaf only so a missing file degrades the way the plate has always promised
 * (public/practice/subject/README.md): if the request fails, the image removes itself and the
 * tinted icon tile underneath shows instead of a broken image. A file that failed before React
 * attached `onError` (server-rendered HTML) is caught by the effect below.
 */
export function PlateImage({
  src,
  sizes,
  className,
}: {
  src: string;
  sizes: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (element && element.complete && element.naturalWidth === 0 && element.currentSrc) {
      setFailed(true);
    }
  }, []);

  if (failed) return null;

  return (
    <Image
      ref={ref}
      src={src}
      alt=""
      fill
      sizes={sizes}
      quality={85}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
