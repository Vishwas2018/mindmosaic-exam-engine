"use client";

import { useEffect } from "react";

/**
 * The last boundary. Only fires when the root layout itself throws, which
 * means React has torn down everything below it — so this file has to supply
 * its own <html> and <body>, and cannot rely on the app's fonts, providers,
 * Tailwind layer or shared components being available.
 *
 * That is why the styles here are inline and the markup is plain. It is the
 * one screen in the product that must render when nothing else can, and
 * anything imported is one more thing that can fail at exactly the moment
 * everything already has.
 *
 * Every other route uses the branded boundaries built on WidgetError; see
 * src/components/route-boundaries/RouteError.tsx.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error] root layout threw", {
      digest: error.digest,
      message: error.message,
    });
  }, [error]);

  return (
    <html lang="en-AU">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background: "#f7f4ff",
          color: "#1c1330",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
        }}
      >
        <main style={{ maxWidth: "32rem", textAlign: "center" }}>
          {/*
            The wordmark as brand, not as an uppercase kicker. This boundary
            replaces the whole document when the app fails to boot, so it
            cannot rely on MindMosaicLogo (next/image, brand tokens, fonts) —
            the two-tone lockup is restated here in literal hex, the one
            place in the app where duplicating it is the safe choice.
          */}
          <p style={{ margin: 0, fontSize: "20px", fontWeight: 700, letterSpacing: "-0.03em" }}>
            <span style={{ color: "#5925a8" }}>Mind</span>
            <span style={{ color: "#ff555a" }}>Mosaic</span>
            <span style={{ color: "#ff555a", fontSize: "0.42em", verticalAlign: "super" }}>®</span>
          </p>
          <h1 style={{ margin: "12px 0 0", fontSize: "28px", lineHeight: 1.25, fontWeight: 800 }}>
            Something went badly wrong
          </h1>
          <p style={{ margin: "12px 0 0", fontSize: "16px", lineHeight: 1.6, color: "#5b5170" }}>
            The page couldn&apos;t start. Nothing you were working on has been deleted —
            try again, and if it keeps happening please let us know.
          </p>

          <div
            style={{
              marginTop: "28px",
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                minHeight: "48px",
                padding: "0 24px",
                borderRadius: "12px",
                border: "none",
                background: "#5925a8",
                color: "#ffffff",
                fontSize: "15px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            {/*
              A plain <a>, not next/link, on purpose. This boundary only
              renders when the root layout threw, so the router is part of
              what just failed — a client-side navigation would be asking
              the broken thing to fix itself. A full document load is the
              recovery. The lint rule cannot see that distinction.
            */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                minHeight: "48px",
                display: "inline-flex",
                alignItems: "center",
                padding: "0 24px",
                borderRadius: "12px",
                border: "1px solid rgba(89,37,168,0.25)",
                background: "#ffffff",
                color: "#5925a8",
                fontSize: "15px",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Go to the home page
            </a>
          </div>

          {error.digest && (
            <p style={{ marginTop: "28px", fontSize: "12px", color: "#5b5170" }}>
              Reference: <code>{error.digest}</code>
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
