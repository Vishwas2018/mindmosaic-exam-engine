import { Skeleton, SkeletonText } from "@/components/ui";

/**
 * Shared loading skeletons for data-driven route segments.
 *
 * Without a `loading.tsx`, a server segment that awaits data shows the
 * PREVIOUS page until it resolves — or, on a cold navigation, nothing at
 * all. On a slow connection that reads as a broken link, and the usual
 * response is to click again.
 *
 * These deliberately mirror the shape of the page that follows (a header
 * strip, then cards) so the layout doesn't jump when real content lands.
 * Every one is announced: `SkeletonText` carries `role="status"`, so a
 * screen reader says "Loading" rather than narrating silence.
 *
 * ONE RULE when placing a `loading.tsx` that uses these: never put it at or
 * above a segment that calls `notFound()`. The Suspense boundary makes the
 * response stream, so HTTP 200 is committed before the 404 can be — the
 * branded not-found page still renders, but with a success status, which
 * only an assertion on `response.status()` will ever notice. It has already
 * happened once, to /practice and /teacher. The rule is enforced in
 * src/tests/unit/route-loading-boundaries.test.ts.
 */

/** Header strip common to every signed-in shell. */
function ShellHeaderSkeleton() {
  return (
    <div className="border-b border-royal/8 bg-white">
      <div className="site-width flex min-h-20 items-center justify-between gap-4 py-3">
        <Skeleton className="h-9 w-40" />
        <div className="hidden items-center gap-2 lg:flex">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  );
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-2xl border border-royal/8 bg-white p-6">
      <Skeleton className="h-6 w-40" />
      <div className="mt-4">
        <SkeletonText lines={lines} label="Loading content" />
      </div>
    </div>
  );
}

/**
 * A signed-in dashboard: shell header, page heading, then cards.
 * @param label announced to assistive technology, so it names the page
 *              rather than saying "loading" into the void.
 */
export function DashboardLoading({
  label = "Loading your dashboard",
  cards = 3,
}: {
  label?: string;
  cards?: number;
}) {
  return (
    <div className="min-h-screen bg-page">
      <ShellHeaderSkeleton />
      <main className="site-width py-10 sm:py-12">
        <div className="mx-auto max-w-5xl space-y-8">
          <div role="status" aria-label={label}>
            <Skeleton className="h-10 w-72" />
            <span className="sr-only">{label}</span>
          </div>
          <Skeleton className="h-4 w-96" />
          {Array.from({ length: cards }, (_, index) => (
            <CardSkeleton key={index} lines={index === 0 ? 2 : 3} />
          ))}
        </div>
      </main>
    </div>
  );
}

/** A full-width content page with no signed-in shell (practice, results). */
export function PageLoading({ label = "Loading" }: { label?: string }) {
  return (
    <main id="main-content" className="min-h-screen bg-page">
      <div className="site-width py-10 sm:py-14">
        <div role="status" aria-label={label}>
          <Skeleton className="h-10 w-80" />
          <span className="sr-only">{label}</span>
        </div>
        <Skeleton className="mt-4 h-4 w-full max-w-xl" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <CardSkeleton key={index} lines={2} />
          ))}
        </div>
      </div>
    </main>
  );
}

/**
 * The exam runner. Kept visually calm and explicitly labelled: a child
 * waiting for questions to appear should see something that reads as
 * "nearly there", not a blank screen they might navigate away from.
 */
export function ExamLoading() {
  return (
    <main id="main-content" className="min-h-screen bg-page">
      <div className="border-b border-royal/8 bg-white">
        <div className="site-width flex min-h-20 items-center justify-between py-3">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      <div className="site-width py-10">
        <div role="status" aria-label="Getting your exam ready">
          <Skeleton className="h-3 w-full rounded-full" />
          <span className="sr-only">Getting your exam ready</span>
        </div>
        <div className="mt-10 rounded-2xl border border-royal/8 bg-white p-8">
          <Skeleton className="h-6 w-32" />
          <div className="mt-6">
            <SkeletonText lines={3} label="Loading the question" />
          </div>
          <div className="mt-8 space-y-3">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
