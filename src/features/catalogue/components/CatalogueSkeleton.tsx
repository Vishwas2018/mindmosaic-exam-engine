import { Card, Skeleton } from "@/components/ui";

/**
 * Route-level loading placeholder for the catalogue.
 *
 * Every block matches the height and position of what replaces it — the
 * hero band, the filter panel, and six cards in the same three-column grid
 * — so nothing shifts when the real content lands. `aria-hidden` plus one
 * polite status message means a screen reader hears "Loading" once instead
 * of reading out a page of empty boxes.
 */
export function CatalogueSkeleton() {
  return (
    <>
      <p role="status" className="sr-only">
        Loading practice programs
      </p>

      <div aria-hidden="true">
        <section className="border-b border-royal/8 bg-white/50 py-10 sm:py-12">
          <div className="site-width">
            <Skeleton className="h-6 w-52 rounded-full" />
            <Skeleton className="mt-4 h-11 w-full max-w-xl" />
            <Skeleton className="mt-3 h-5 w-full max-w-2xl" />
            <div className="mt-6 flex flex-wrap gap-2">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-8 w-40 rounded-full" />
              ))}
            </div>
          </div>
        </section>

        <div className="site-width py-10 sm:py-12">
          <Skeleton className="h-36 w-full rounded-2xl" />

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {Array.from({ length: 6 }, (_, index) => (
              <Card key={index} variant="default" className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <Skeleton className="h-12 w-12 rounded-2xl" />
                  <Skeleton className="h-6 w-32 rounded-full" />
                </div>
                <Skeleton className="mt-4 h-6 w-4/5" />
                <Skeleton className="mt-3 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-2/3" />
                <Skeleton className="mt-4 h-4 w-1/2" />
                <Skeleton className="mt-5 h-12 w-full rounded-xl" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
