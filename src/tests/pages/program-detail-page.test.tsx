import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/programs/naplan-style",
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("@/features/auth/AuthProvider", () => ({
  useAuth: () => ({ status: "anonymous", role: null, signOut: vi.fn() }),
}));

import ProgramDetailPage, { generateMetadata, generateStaticParams } from "@/app/programs/[slug]/page";
import { programmes } from "@/features/landing/content";

describe("Program detail page", () => {
  it("has a static param for every real programme", () => {
    const params = generateStaticParams();
    const slugs = params.map((p) => p.slug);
    for (const item of programmes.items) {
      expect(slugs).toContain(item.id);
    }
  });

  it("renders a real programme's name, subjects and start-free CTA", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "naplan-style" }) });
    expect(metadata.title).toBe("NAPLAN-style");

    const Page = await ProgramDetailPage({ params: Promise.resolve({ slug: "naplan-style" }) });
    render(Page);
    expect(screen.getByRole("heading", { level: 1, name: "NAPLAN-style" })).toBeInTheDocument();
    const aside = screen.getByRole("complementary", { name: "Get started" });
    expect(within(aside).getByRole("link", { name: "Start free" })).toHaveAttribute("href", "/sign-up");
    expect(within(aside).getByRole("link", { name: "Try a set as a guest" })).toHaveAttribute(
      "href",
      "/practice",
    );
  });

  it("404s for an unknown slug", async () => {
    await expect(ProgramDetailPage({ params: Promise.resolve({ slug: "not-a-real-program" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
  });
});
