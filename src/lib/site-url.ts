/**
 * The public origin metadata, the sitemap and robots.txt point at.
 *
 * `mindmosaic.app` is not a live domain, so absolute URLs built from it (og:image,
 * canonical, sitemap) pointed at nothing. Vercel sets VERCEL_PROJECT_PRODUCTION_URL
 * (a bare host, no scheme) to the project's production domain on every deployment,
 * previews included, so no new environment variable is needed and attaching a custom
 * domain later changes the origin without a code change. Outside Vercel (local
 * builds, CI) the verified production domain below is used.
 */
export const FALLBACK_SITE_ORIGIN = "https://mindmosaic-exam-engine.vercel.app";

export function siteOrigin(
  env: Readonly<Record<string, string | undefined>> = process.env,
): string {
  const host = env.VERCEL_PROJECT_PRODUCTION_URL?.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return host ? `https://${host}` : FALLBACK_SITE_ORIGIN;
}
