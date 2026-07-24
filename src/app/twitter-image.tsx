import {
  ogImageAlt,
  ogImageContentType,
  ogImageSize,
  renderShareImage,
} from "@/lib/og-image";

// Reads the brain artwork off disk (see src/lib/og-image.tsx), so this
// needs the Node.js runtime rather than edge.
export const runtime = "nodejs";

export const alt = ogImageAlt;
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return renderShareImage();
}
