import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Stitch Prototype",
  robots: { index: false, follow: false },
};

const screens = [
  {
    href: "/prototype/dashboard",
    title: "Dashboard",
    subtitle: "Vihaan (Year 5)",
    thumb: "/prototype/stitch/dashboard.png",
  },
  {
    href: "/prototype/learning-hub",
    title: "Learning Hub",
    subtitle: "Catalogue & Pathways",
    thumb: "/prototype/stitch/learning-hub.png",
  },
  {
    href: "/prototype/practice-studio",
    title: "Practice Studio",
    subtitle: "Equivalent Fractions Runner",
    thumb: "/prototype/stitch/practice-studio.png",
  },
  {
    href: "/prototype/exam-centre",
    title: "Exam Centre",
    subtitle: "NAPLAN Sample Test & Catalogue",
    thumb: "/prototype/stitch/exam-centre.png",
  },
  {
    href: "/prototype/lesson",
    title: "Lesson",
    subtitle: "Equivalent Fractions - Learning Hub",
    thumb: "/prototype/stitch/lesson.png",
  },
  {
    href: "/prototype/progress",
    title: "My Progress",
    subtitle: "Attempt Review",
    thumb: "/prototype/stitch/progress.png",
  },
];

export default function PrototypeIndexPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-gray-900">
        Stitch prototype — MindMosaic Student Portal
      </h1>
      <p className="mt-2 text-sm text-gray-500">
        Static reference screens from Stitch, isolated from the app&apos;s
        own styling via iframe.{" "}
        <a
          href="/prototype/stitch/design-system.md"
          className="underline"
          target="_blank"
          rel="noreferrer"
        >
          Design system doc
        </a>
      </p>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {screens.map((screen) => (
          <Link
            key={screen.href}
            href={screen.href}
            className="group block overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-md"
          >
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-gray-50">
              <Image
                src={screen.thumb}
                alt={screen.title}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover object-top"
              />
            </div>
            <div className="p-4">
              <div className="font-medium text-gray-900 group-hover:underline">
                {screen.title}
              </div>
              <div className="text-sm text-gray-500">{screen.subtitle}</div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
