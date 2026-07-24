import { readFileSync } from "node:fs";
import { join } from "node:path";

import { ImageResponse } from "next/og";

export const ogImageSize = { width: 1200, height: 630 };
export const ogImageContentType = "image/png";
export const ogImageAlt = "MindMosaic — know exactly what to practise next.";

/* Brain artwork has no alpha padding baked in and isn't square (608x505),
   so it's read once per request and inlined as a data URL — satori (the
   renderer behind ImageResponse) can't fetch from the local filesystem
   itself, only from network URLs or data URLs. */
function brainArtworkDataUrl(): string {
  const bytes = readFileSync(
    join(process.cwd(), "public/brand/mindmosaic-brain.png"),
  );
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

export function renderShareImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 88px",
          background: "#f7f4ff",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 620 }}>
          <div style={{ display: "flex", fontSize: 104, fontWeight: 900, letterSpacing: -3 }}>
            <span style={{ color: "#5925a8" }}>Mind</span>
            <span style={{ color: "#f7700c" }}>Mosaic</span>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 28,
              fontSize: 40,
              fontWeight: 600,
              color: "#2a1051",
              lineHeight: 1.3,
            }}
          >
            Know exactly what to practise next.
          </div>
        </div>
        <img
          src={brainArtworkDataUrl()}
          alt=""
          width={480}
          height={399}
          style={{ objectFit: "contain" }}
        />
      </div>
    ),
    ogImageSize,
  );
}
