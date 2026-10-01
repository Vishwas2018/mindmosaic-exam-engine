"use client";

import { useState } from "react";
import Image from "next/image";
import { twMerge } from "tailwind-merge";

/**
 * The loading-fade-in half of `ImageSlot` (primitives.tsx), split into its
 * own client component: `useState` here would otherwise force the whole
 * (mostly server-safe) primitives.tsx module to be client-only for every
 * page that imports any of its non-interactive helpers.
 */
export function ImageSlotImage({
  src,
  alt,
  priority,
  sizes,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes: string;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      onLoad={() => setLoaded(true)}
      className={twMerge("mm-image-slot object-cover opacity-0 transition-opacity duration-500", loaded && "opacity-100")}
    />
  );
}
