import { render, screen } from "@testing-library/react";
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
import ContactPage, { metadata as contactMetadata } from "@/app/contact/page";
import HelpPage, { metadata as helpMetadata } from "@/app/help/page";
import ParentGuidePage, { metadata as parentGuideMetadata } from "@/app/parent-guide/page";
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

describe("Resources page (Learning Hub)", () => {
  it("renders the hub with its search field and category tabs", async () => {
    const { default: ResourcesPage, metadata } = await import("@/app/resources/page");
    expect(metadata.title).toBeTruthy();
    render(<ResourcesPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: /explanations, worked examples and guides/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/search the hub/i)).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "All" })).toHaveAttribute("aria-selected", "true");
  });

  /* Nine briefs, not nine published guides — the page must say so once
     rather than letting the cards imply articles that do not exist. */
  it("is explicit that the guides are not written yet", async () => {
    const { default: ResourcesPage } = await import("@/app/resources/page");
    render(<ResourcesPage />);
    expect(
      screen.getByText(/these guides are commissioned and not yet published/i),
    ).toBeInTheDocument();
  });
});

describe("Contact page", () => {
  it("has no form, and links the one real support address", () => {
    expect(contactMetadata.title).toBeTruthy();
    render(<ContactPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Contact & Support" })).toBeInTheDocument();
    expect(document.querySelector("form")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: SUPPORT_EMAIL })).toHaveAttribute(
      "href",
      `mailto:${SUPPORT_EMAIL}`,
    );
  });
});

describe("Help Centre page", () => {
  it("states the PIN is exactly 6 digits and is honest that reset isn't self-service", () => {
    expect(helpMetadata.title).toBeTruthy();
    render(<HelpPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Help Centre" })).toBeInTheDocument();
    expect(screen.getByText(/exactly 6 digits/i)).toBeInTheDocument();
    expect(screen.getByText(/isn't a self-service/i)).toBeInTheDocument();
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
