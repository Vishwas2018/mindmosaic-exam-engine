import Image from "next/image";
import Link from "next/link";
import { Trophy } from "lucide-react";

import { fitsEveryStudent } from "../content";
import { lpButton } from "./primitives";

function MiniCard({ card }: { card: (typeof fitsEveryStudent.miniCards)[number] }) {
  return (
    <div className="w-44 rounded-2xl bg-white p-3.5 shadow-[0_16px_40px_rgba(42,16,81,0.16)]">
      <p className="text-xs font-bold text-lp-muted">{card.label}</p>
      {card.kind === "progress" ? (
        <>
          <p className="mt-1 font-display text-lg font-bold tracking-[-0.02em] text-lp-ink">{card.value}</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-brand/10">
            <div className="h-full rounded-full bg-brand" style={{ width: `${card.fraction * 100}%` }} />
          </div>
        </>
      ) : (
        <div className="mt-1.5 flex items-center gap-1.5 text-success">
          <Trophy aria-hidden="true" className="h-4 w-4" />
          <span className="text-sm font-bold">{card.value}</span>
        </div>
      )}
    </div>
  );
}

export function FitsEveryStudent() {
  return (
    <section aria-labelledby="fits-heading" className="bg-[color-mix(in_srgb,var(--brand)_7%,white)] py-16 sm:py-24">
      <div className="site-width grid items-center gap-12 lg:grid-cols-2 lg:gap-10">
        <div>
          <h2 id="fits-heading" className="font-display text-3xl font-bold leading-[1.1] tracking-[-0.03em] text-lp-ink sm:text-4xl">
            {fitsEveryStudent.headlineLines.map((line) => (
              <span key={line.text} className={line.tone === "brand" ? "text-brand" : undefined}>
                {line.text}
              </span>
            ))}
          </h2>
          <p className="mt-5 max-w-md text-lg leading-8 text-lp-muted">{fitsEveryStudent.body}</p>
          <Link href={fitsEveryStudent.cta.href} className={lpButton({ size: "lg", className: "mt-8" })}>
            {fitsEveryStudent.cta.label}
          </Link>
        </div>

        <div className="relative mx-auto w-full max-w-sm">
          <Image
            src={fitsEveryStudent.image.src}
            alt={fitsEveryStudent.image.alt}
            width={fitsEveryStudent.image.width}
            height={fitsEveryStudent.image.height}
            loading="lazy"
            className="w-full rounded-4xl object-cover"
          />
          <div className="absolute -left-6 top-8 hidden sm:block">
            <MiniCard card={fitsEveryStudent.miniCards[0]} />
          </div>
          <div className="absolute -right-4 top-1/3 hidden sm:block">
            <MiniCard card={fitsEveryStudent.miniCards[1]} />
          </div>
          <div className="absolute -bottom-6 left-1/4 hidden sm:block">
            <MiniCard card={fitsEveryStudent.miniCards[2]} />
          </div>
        </div>
      </div>
    </section>
  );
}
