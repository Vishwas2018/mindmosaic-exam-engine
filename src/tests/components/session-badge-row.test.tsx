import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SessionBadgeRow } from "@/features/exam-engine/components/SessionBadgeRow";
import type { SessionBadge } from "@/features/exam-engine/scoring/session-badges";

const BADGES: SessionBadge[] = [
  { id: "perfect-score", label: "Perfect score", tone: "gold" },
  { id: "full-attempt", label: "Every question attempted", tone: "green" },
];

describe("SessionBadgeRow", () => {
  it("renders nothing when there are no badges", () => {
    const { container } = render(<SessionBadgeRow badges={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders one chip per badge", () => {
    render(<SessionBadgeRow badges={BADGES} />);
    expect(screen.getByTestId("session-badge-perfect-score")).toHaveTextContent("Perfect score");
    expect(screen.getByTestId("session-badge-full-attempt")).toHaveTextContent(
      "Every question attempted",
    );
  });
});
