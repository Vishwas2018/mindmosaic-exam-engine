import { readFileSync } from "node:fs";
import { join } from "node:path";

import { ImageResponse } from "next/og";

// Reads the brain artwork off disk, so needs the Node.js runtime.
export const runtime = "nodejs";

function brainArtworkDataUrl(): string {
  const bytes = readFileSync(
    join(process.cwd(), "public/brand/mindmosaic-brain.png"),
  );
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

/*
 * 512x512 maskable icon for manifest.webmanifest. Maskable icons get
 * cropped to arbitrary shapes (circle, squircle, ...) by the OS, so
 * content must sit inside the ~80%-diameter safe-zone circle centered on
 * the canvas — the artwork here is scaled well inside that (330px wide on
 * a 512px canvas) with the brand-lavender background filling the rest.
 */
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f7f4ff",
        }}
      >
        {/*
          Satori, not the browser. This tree is rendered by next/og's
          ImageResponse into a PNG on the server — there is no DOM, no
          layout, and no next/image runtime to optimise anything. <img> with
          an inlined data URL is the only element Satori supports here, so
          the LCP/bandwidth advice the rule is giving does not apply.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={brainArtworkDataUrl()}
          alt=""
          width={330}
          height={274}
          style={{ objectFit: "contain" }}
        />
      </div>
    ),
    { width: 512, height: 512 },
  );
}
