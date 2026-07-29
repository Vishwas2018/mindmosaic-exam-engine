import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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
describe("About page", () => {
  it("renders with a real title/description and mentions the originality commitment", () => {
    expect(aboutMetadata.title).toBeTruthy();
    expect(aboutMetadata.description).toBeTruthy();
    render(<AboutPage />);
    expect(screen.getByRole("heading", { level: 1, name: "About MindMosaic" })).toBeInTheDocument();
    expect(screen.getByText(/written from scratch/i)).toBeInTheDocument();
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
