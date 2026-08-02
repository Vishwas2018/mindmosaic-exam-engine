import { readFileSync } from "node:fs";
import { join } from "node:path";

import { ImageResponse } from "next/og";

export const ogImageSize = { width: 1200, height: 630 };
export const ogImageContentType = "image/png";
export const ogImageAlt = "MindMosaic — know exactly what to practise next.";

/* Satori (the renderer behind ImageResponse) can't fetch from the local
   filesystem itself, only from network URLs or data URLs, so the mark and
   the wordmark font are each read once per request and inlined. */
function markDataUrl(): string {
  const bytes = readFileSync(join(process.cwd(), "public/brand/icon-512.png"));
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

function robotoBoldData(): ArrayBuffer {
  const bytes = readFileSync(
    join(process.cwd(), "src/assets/fonts/roboto-700-latin.woff"),
  );
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  );
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
          <div
            style={{
              display: "flex",
              fontFamily: "Roboto",
              fontSize: 96,
              fontWeight: 700,
              letterSpacing: -3,
              color: "#5925a8",
            }}
          >
            MindMosaic
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
        {/*
          Satori, not the browser. This tree is rendered by next/og's
          ImageResponse into a PNG on the server — there is no DOM, no
          layout, and no next/image runtime to optimise anything. <img> with
          an inlined data URL is the only element Satori supports here, so
          the LCP/bandwidth advice the rule is giving does not apply.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={markDataUrl()}
          alt=""
          width={360}
          height={360}
          style={{ objectFit: "contain" }}
        />
      </div>
    ),
    {
      ...ogImageSize,
      fonts: [
        { name: "Roboto", data: robotoBoldData(), weight: 700, style: "normal" },
      ],
    },
  );
}
