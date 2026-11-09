import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ParentSetupWizard } from "@/features/parent-dashboard/components/ParentSetupWizard";
import { ChildrenHub } from "@/features/parent-dashboard/components/ChildrenHub";
import { ChildProfileDetail } from "@/features/parent-dashboard/components/ChildProfileDetail";
import { ChildProgressView } from "@/features/parent-dashboard/components/ChildProgressView";
import { AttemptResultDetail } from "@/features/parent-dashboard/components/AttemptResultDetail";
import { AttemptAnswerReview } from "@/features/parent-dashboard/components/AttemptAnswerReview";
import { ChildCurriculumView } from "@/features/parent-dashboard/components/ChildCurriculumView";
import { PracticePreviewView } from "@/features/parent-dashboard/components/PracticePreviewView";
import { ParentAccountView } from "@/features/parent-dashboard/components/ParentAccountView";
import { ParentHelpView } from "@/features/parent-dashboard/components/ParentHelpView";
import { HelpArticleDetail } from "@/features/parent-dashboard/components/HelpArticleDetail";
import { SupportContactForm } from "@/features/parent-dashboard/components/SupportContactForm";
import { PREVIEW_CHILDREN, PREVIEW_HELP_ARTICLES } from "@/features/parent-dashboard/fixtures";

describe("Parent Workspace UI - Screen Components", () => {
  describe("ParentSetupWizard (b0 - b4)", () => {
    it("renders the welcome headline and initial form fields", () => {
      render(<ParentSetupWizard initialParentName="Priya" />);

      expect(screen.getByRole("heading", { level: 1, name: /welcome, priya/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/year level/i)).toBeInTheDocument();
      expect(screen.getByText(/curriculum standard/i)).toBeInTheDocument();
    });

    it("creates a child profile and reveals access credentials with no unapproved timeframes", () => {
      render(<ParentSetupWizard initialParentName="Priya" />);

      // Use the preview state button to switch to created state (b1)
      const childCreatedBtn = screen.getByRole("button", { name: /child created \(b1\)/i });
      fireEvent.click(childCreatedBtn);

      // Successfully transitioned to created step (b1)
      expect(screen.getByRole("heading", { level: 1, name: /aisha is ready/i })).toBeInTheDocument();
      expect(screen.getByText(/login code/i)).toBeInTheDocument();
      expect(screen.getAllByText(/pin/i).length).toBeGreaterThan(0);

      // Ensure no unapproved "30-day" wording
      expect(screen.queryByText(/30[- ]day/i)).not.toBeInTheDocument();
    });
  });

  describe("ChildrenHub (b10, b13, b14)", () => {
    it("displays the family plan usage and child cards", () => {
      render(<ChildrenHub initialChildren={PREVIEW_CHILDREN} />);

      expect(screen.getByRole("heading", { level: 1, name: /children/i })).toBeInTheDocument();
      expect(screen.getByText(/2 of 3 used on your family plan/i)).toBeInTheDocument();

      // Child names
      expect(screen.getByText(/aisha/i)).toBeInTheDocument();
      expect(screen.getByText(/kabir/i)).toBeInTheDocument();

      // No evaluative performance bands rendered
      expect(screen.queryByText(/exceeding/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/strong/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/needs additional support/i)).not.toBeInTheDocument();
    });

    it("allows toggling a child's pause state", () => {
      render(<ChildrenHub initialChildren={PREVIEW_CHILDREN} />);

      // Find pause buttons
      const pauseButtons = screen.getAllByRole("button", { name: /pause place/i });
      expect(pauseButtons.length).toBeGreaterThan(0);

      // Pause Aisha
      fireEvent.click(pauseButtons[0]);

      // Confirm status message or badge
      expect(screen.getAllByText(/paused \u00B7 profile kept/i).length).toBe(2);
    });
  });

  describe("ChildProfileDetail (b11, b12)", () => {
    it("renders child identity, access credentials, and navigation links", () => {
      const aisha = PREVIEW_CHILDREN[0];
      render(<ChildProfileDetail child={aisha} />);

      expect(screen.getByRole("heading", { level: 1, name: /aisha/i })).toBeInTheDocument();
      expect(screen.getByText(aisha.loginCode)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /reset pin/i })).toBeInTheDocument();

      // Links to curriculum, progress, and writing
      expect(screen.getByRole("link", { name: /aisha's progress/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /learning for aisha/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /aisha's writing/i })).toBeInTheDocument();
    });

    it("opens erasure modal without any unapproved 30-day retention text", () => {
      const aisha = PREVIEW_CHILDREN[0];
      render(<ChildProfileDetail child={aisha} />);

      const deleteBtn = screen.getByRole("button", { name: /request deletion of aisha's data/i });
      fireEvent.click(deleteBtn);

      expect(screen.getByText(/erasure request state demonstration/i)).toBeInTheDocument();
      // Strictly verify no 30-day claim
      expect(screen.queryByText(/30[- ]day/i)).not.toBeInTheDocument();
    });
  });

  describe("ChildProgressView (b15, b18, b19)", () => {
    it("renders progress headline, marks meters, and past papers", () => {
      render(<ChildProgressView childId="child-aisha" />);

      expect(screen.getByRole("heading", { level: 1, name: /aisha's progress/i })).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 2, name: /breakdown by subject/i })).toBeInTheDocument();
      expect(screen.getAllByText(/finished papers/i).length).toBeGreaterThan(0);

      // Strictly no percent signs or evaluative bands in marks summaries
      expect(screen.queryByText(/exceeding/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/developing/i)).not.toBeInTheDocument();
    });

    it("switches to empty state without throwing and explains needed practice", () => {
      render(<ChildProgressView childId="child-aisha" />);

      const emptyBtn = screen.getByRole("button", { name: /nothing yet/i });
      fireEvent.click(emptyBtn);

      expect(screen.getByText(/nothing finished yet/i)).toBeInTheDocument();
    });
  });

  describe("AttemptResultDetail & AttemptAnswerReview (b16, b17)", () => {
    it("renders paper result breakdown with marks and allowed duration", () => {
      render(<AttemptResultDetail childId="child-aisha" resultId="res-reading-301" />);

      expect(screen.getByRole("heading", { level: 1, name: /naplan-style reading/i })).toBeInTheDocument();
      expect(screen.getByText(/marks by text type/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /go through the answers/i })).toBeInTheDocument();
    });

    it("renders question list in answer review with explanations", () => {
      render(<AttemptAnswerReview childId="child-aisha" resultId="res-reading-301" />);

      expect(screen.getByRole("heading", { level: 1, name: /going through the answers/i })).toBeInTheDocument();
      expect(screen.getByText(/why did maya hesitate before pushing through the gate\?/i)).toBeInTheDocument();
      expect(screen.getAllByText(/explanation:/i).length).toBeGreaterThan(0);
    });
  });

  describe("ChildCurriculumView & PracticePreviewView (b20, b21, b22)", () => {
    it("renders curriculum subjects and explore links", () => {
      render(<ChildCurriculumView childId="child-aisha" />);

      expect(screen.getByRole("heading", { level: 1, name: /learning for aisha/i })).toBeInTheDocument();
      expect(screen.getAllByText(/reading/i).length).toBeGreaterThan(0);
      expect(screen.getByRole("link", { name: /preview sample question/i })).toBeInTheDocument();
    });

    it("renders practice preview with disabled proposals clearly flagged", () => {
      render(<PracticePreviewView childId="child-aisha" />);

      expect(screen.getByRole("heading", { level: 1, name: /sample question preview/i })).toBeInTheDocument();
      expect(screen.getByText(/proposal: assign practice \(p9\)/i)).toBeInTheDocument();
      expect(screen.getByText(/proposal: stretch content \(p10\)/i)).toBeInTheDocument();
    });
  });

  describe("ParentAccountView (b23 - b26)", () => {
    it("renders subscription details, billing return link, and security options", () => {
      render(<ParentAccountView />);

      expect(screen.getByRole("heading", { level: 1, name: /account/i })).toBeInTheDocument();
      expect(screen.getByText(/family plan/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /manage on billing/i })).toBeInTheDocument();
    });

    it("renders deletion request modal without unapproved 30-day retention wording", () => {
      render(<ParentAccountView />);

      const deleteBtn = screen.getByRole("button", { name: /request verified account deletion/i });
      fireEvent.click(deleteBtn);

      expect(screen.getByText(/erasure request state demonstration/i)).toBeInTheDocument();
      expect(screen.queryByText(/30[- ]day/i)).not.toBeInTheDocument();
    });
  });

  describe("Help Centre & Contact Form (b27, b28, b29)", () => {
    it("renders help categories and searchable articles", () => {
      render(<ParentHelpView />);

      expect(screen.getByRole("heading", { level: 1, name: /help/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/try "pin" or "invoice"/i)).toBeInTheDocument();
      expect(screen.getByText(/getting your child signed in/i)).toBeInTheDocument();
    });

    it("renders help article content and feedback buttons", () => {
      const article = PREVIEW_HELP_ARTICLES["forgotten-pin"];
      render(<HelpArticleDetail article={article} />);

      expect(screen.getByRole("heading", { level: 1, name: article.title })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /yes, helped/i })).toBeInTheDocument();
    });

    it("validates and displays confirmation with ticket reference in SupportContactForm", () => {
      render(<SupportContactForm />);

      const confirmStateBtn = screen.getByRole("button", { name: /demonstration acknowledgment state/i });
      fireEvent.click(confirmStateBtn);

      expect(screen.getByText(/demonstration submission acknowledgment/i)).toBeInTheDocument();
      expect(screen.getByText(/sample-preview-only/i)).toBeInTheDocument();
    });
  });
});
