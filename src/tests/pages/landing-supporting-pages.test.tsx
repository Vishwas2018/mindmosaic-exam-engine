import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

/*
 * Every page here renders through LegalPageShell, which renders SiteNav.
 * SiteNav is auth-aware — it swaps "Log in / Start free" for a link to the
 * signed-in user's role home — so it now reads the router, the pathname and
 * the auth session. These pages are what's under test, not that behaviour
 * (src/tests/components/landing-nav.test.tsx covers it), so the header's
 * dependencies are stubbed at their signed-out defaults.
 */
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/about",
}));

vi.mock("@/features/auth/AuthProvider", () => ({
  useAuth: () => ({ status: "anonymous", role: null, signOut: vi.fn() }),
}));

import AboutPage, { metadata as aboutMetadata } from "@/app/about/page";
import AssessmentDisclaimerPage, {
  metadata as disclaimerMetadata,
} from "@/app/assessment-disclaimer/page";
import HelpPage, { metadata as helpMetadata } from "@/app/help/page";
import ParentGuidePage, { metadata as parentGuideMetadata } from "@/app/parent-guide/page";
import ProgramsPage, { metadata as programsMetadata } from "@/app/programs/page";
import ResourceDetailPage, {
  generateMetadata as resourceDetailMetadata,
} from "@/app/resources/[slug]/page";
import ResourcesIndexPage, { metadata as resourcesMetadata } from "@/app/resources/page";
import StudentTipsPage, { metadata as studentTipsMetadata } from "@/app/student-tips/page";
import { SUPPORT_EMAIL } from "@/features/landing/content";

/**
 * Every new supporting page (Part D): renders, has a real metadata
 * title/description, and — for the ones that reference it — uses the
 * single SUPPORT_EMAIL constant rather than a hardcoded/invented address.
 */
/*
 * About is a marketing screen now (design handoff screen 5), not a
 * LegalPageShell prose page. What matters has not changed: it must still
 * make the originality commitment, and it must not go back to describing
 * the product as Grade 3 and Grade 5 only while every other page says
 * Years 1-12 — the contradiction the rebuild was there to fix.
 */
describe("About page", () => {
  it("renders with a real title/description and states the originality commitment", () => {
    expect(aboutMetadata.title).toBeTruthy();
    expect(aboutMetadata.description).toBeTruthy();
    render(<AboutPage />);
    expect(
      screen.getByRole("heading", { level: 1, name: /built in australia/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/no past papers, no licensed third-party banks/i)).toBeInTheDocument();
  });

  it("says which year levels are live rather than implying the full range", () => {
    render(<AboutPage />);
    expect(screen.getByText(/what is live today is years 3 and 5/i)).toBeInTheDocument();
  });

  /* getAllBy, not getBy: the footer links the same documents, and every
     one of them must resolve to the same route. */
  it("links the privacy, terms and disclaimer documents rather than restating them", () => {
    render(<AboutPage />);
    for (const [name, href] of [
      ["Privacy Policy", "/privacy"],
      ["Terms and Conditions", "/terms"],
      ["Assessment Disclaimer", "/assessment-disclaimer"],
    ] as const) {
      const links = screen.getAllByRole("link", { name });
      expect(links.length).toBeGreaterThan(0);
      for (const link of links) expect(link).toHaveAttribute("href", href);
    }
  });
});

/*
 * Resources — rebuilt (public-pages Step 4) to Public/Resources.dc.html:
 * Published / Being written / Policies, not the old combined Learning-Hub
 * browser + Help index. HubLibrary.tsx and its search/tabs UI are no
 * longer rendered on this route (see resources/page.tsx's own comment).
 */
describe("Resources page", () => {
  it("renders the published list and is explicit about what's still being written", () => {
    expect(resourcesMetadata.title).toBeTruthy();
    render(<ResourcesIndexPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Resources" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /parent guide/i })).toHaveAttribute(
      "href",
      "/parent-guide",
    );
    expect(screen.getByRole("link", { name: /student tips/i })).toHaveAttribute(
      "href",
      "/student-tips",
    );
    expect(screen.getByRole("heading", { name: "Being written" })).toBeInTheDocument();
  });

  it("links the policy documents at their real, existing routes", () => {
    render(<ResourcesIndexPage />);
    for (const [name, href] of [
      ["Privacy (draft)", "/privacy"],
      ["Terms (draft)", "/terms"],
      ["Accessibility (draft)", "/accessibility"],
    ] as const) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
    }
  });
});

/*
 * /contact no longer exists as a page (owner ruling, 1 Oct): it permanently
 * redirects to /help#contact (next.config.ts), and the Help Centre page
 * below carries the "no contact form, one real email address" behaviour
 * the old /contact page used to.
 */
describe("Resource detail page", () => {
  it("renders the one published article with real content, not the mockup's placeholder copy", async () => {
    const element = await ResourceDetailPage({
      params: Promise.resolve({ slug: "how-we-check-questions" }),
    });
    render(element);
    expect(
      screen.getByRole("heading", { level: 1, name: "How we write and check questions" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/automated publication checks/i)).toBeInTheDocument();
    const metadata = await resourceDetailMetadata({
      params: Promise.resolve({ slug: "how-we-check-questions" }),
    });
    expect(metadata.title).toBeTruthy();
  });

  it("404s for an unknown slug", async () => {
    await expect(
      ResourceDetailPage({ params: Promise.resolve({ slug: "not-a-real-article" }) }),
    ).rejects.toThrow();
  });
});

describe("Help Centre page", () => {
  /*
   * Scoped to the page's own <main>: the sitewide SiteFooter (Components/
   * Site Footer.dc.html) carries its own "hello@mindmosaic.app" link too,
   * so an unscoped query would match both.
   */
  it("has no form, and links the one real support address — merged from the former /contact page", () => {
    expect(helpMetadata.title).toBeTruthy();
    render(<HelpPage />);
    const main = screen.getByRole("main");
    expect(
      within(main).getByRole("heading", { level: 1, name: "Help and contact" }),
    ).toBeInTheDocument();
    expect(document.querySelector("form")).not.toBeInTheDocument();
    expect(within(main).getByRole("link", { name: new RegExp(SUPPORT_EMAIL) })).toHaveAttribute(
      "href",
      `mailto:${SUPPORT_EMAIL}`,
    );
  });

  it("states the PIN is exactly 6 digits and is honest that reset isn't self-service", async () => {
    render(<HelpPage />);
    const user = userEvent.setup();
    // The first FAQ ("My child can't sign in") is open by default.
    expect(screen.getByText(/exactly 6 digits/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /reset my child.s practice history/i }));
    expect(screen.getByText(/isn.t a self-service/i)).toBeInTheDocument();
  });
});

describe("Programs page", () => {
  it("renders the year picker and both live families for Year 3 by default", () => {
    expect(programsMetadata.title).toBeTruthy();
    render(<ProgramsPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Programs" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Open for Year 3" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /naplan-style/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /icas-style/i })).toBeInTheDocument();
  });

  it("lists the six Planned pathways, none of them dated", () => {
    render(<ProgramsPage />);
    const heading = screen.getByRole("heading", { name: "Planned pathways" });
    const section = heading.closest("div")?.parentElement;
    if (!section) throw new Error("Planned pathways section not found");
    for (const name of [
      "Singapore Maths",
      "AMC-style",
      "Olympiad-style",
      "Selective-entry-style",
      "Scholarship-style",
      "Learning Hub",
    ]) {
      expect(within(section).getByText(name)).toBeInTheDocument();
    }
    expect(within(section).queryByText(/\b20\d{2}\b/)).not.toBeInTheDocument();
  });
});

describe("Parent Guide page", () => {
  it("renders with real content about the skill breakdown", () => {
    expect(parentGuideMetadata.title).toBeTruthy();
    render(<ParentGuidePage />);
    expect(screen.getByRole("heading", { level: 1, name: "Parent Guide" })).toBeInTheDocument();
    expect(screen.getByText(/skill-by-skill breakdown/i)).toBeInTheDocument();
  });
});

describe("Student Tips page", () => {
  it("renders age-appropriate tips", () => {
    expect(studentTipsMetadata.title).toBeTruthy();
    render(<StudentTipsPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Tips for Students" })).toBeInTheDocument();
  });
});

describe("Assessment Disclaimer page", () => {
  it("states non-affiliation with NAPLAN, ICAS and AMC", () => {
    expect(disclaimerMetadata.title).toBeTruthy();
    render(<AssessmentDisclaimerPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Assessment Disclaimer" })).toBeInTheDocument();
    expect(screen.getAllByText(/not affiliated with/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/NAPLAN/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ICAS/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/AMC|Australian Mathematics Competition/).length).toBeGreaterThan(0);
  });
});
