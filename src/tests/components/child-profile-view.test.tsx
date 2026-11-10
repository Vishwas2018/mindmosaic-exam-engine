import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ChildProfileView,
  type ChildProfileDetails,
  type SiblingLink,
} from "@/features/parent-dashboard/components/ChildProfileView";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const SAMPLE_CHILD: ChildProfileDetails = {
  id: "child-aisha",
  displayName: "Aisha",
  yearLevel: 3,
  loginCode: "K7XJ-2P9R",
  avatarColor: "purple",
  archived: false,
  finishedPapersCount: 4,
  lastSignedIn: "Tuesday, 4:14 pm",
};

const SIBLINGS: SiblingLink[] = [
  { id: "child-aisha", displayName: "Aisha", yearLevel: 3 },
  { id: "child-kabir", displayName: "Kabir", yearLevel: 5 },
];

afterEach(() => {
  vi.unstubAllGlobals();
  refresh.mockReset();
});

describe("ChildProfileView", () => {
  it("renders child details, login code, and paper count", () => {
    render(
      <ChildProfileView
        child={SAMPLE_CHILD}
        siblings={SIBLINGS}
        availableYearLevels={[3, 5]}
        isLocalPreview={true}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Aisha" })).toBeInTheDocument();
    expect(screen.getByText(/Year 3/)).toBeInTheDocument();
    expect(screen.getByText(/Can sign in/)).toBeInTheDocument();
    expect(screen.getByText(/4 finished papers/)).toBeInTheDocument();
    expect(screen.getByText("K7XJ-2P9R")).toBeInTheDocument();
    expect(screen.getByText("Tuesday, 4:14 pm")).toBeInTheDocument();
  });

  it("renders sibling switcher tabs when multiple children exist", () => {
    render(
      <ChildProfileView
        child={SAMPLE_CHILD}
        siblings={SIBLINGS}
        availableYearLevels={[3, 5]}
      />,
    );

    const aishaLink = screen.getByRole("link", { name: /Aisha/i });
    const kabirLink = screen.getByRole("link", { name: /Kabir/i });

    expect(aishaLink).toHaveAttribute("aria-current", "page");
    expect(kabirLink).not.toHaveAttribute("aria-current");
    expect(kabirLink).toHaveAttribute("href", "/parent/children/child-kabir");
  });

  it("allows selecting avatar colour options with aria-pressed", async () => {
    const user = userEvent.setup();
    render(
      <ChildProfileView
        child={SAMPLE_CHILD}
        availableYearLevels={[3, 5]}
      />,
    );

    const royalBtn = screen.getByRole("button", { name: "Avatar colour: Royal" });
    const amberBtn = screen.getByRole("button", { name: "Avatar colour: Amber" });

    expect(royalBtn).toHaveAttribute("aria-pressed", "true");
    expect(amberBtn).toHaveAttribute("aria-pressed", "false");

    await user.click(amberBtn);
    expect(amberBtn).toHaveAttribute("aria-pressed", "true");
    expect(royalBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("submits updated name and year level via PATCH /api/parent/children/[id]", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    render(
      <ChildProfileView
        child={SAMPLE_CHILD}
        availableYearLevels={[3, 5]}
        isLocalPreview={false}
      />,
    );

    const nameInput = screen.getByLabelText("First name");
    await user.clear(nameInput);
    await user.type(nameInput, "Aisha R");

    const yearSelect = screen.getByLabelText("Year level");
    await user.selectOptions(yearSelect, "5");

    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/parent/children/child-aisha",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ displayName: "Aisha R", yearLevel: 5 }),
      }),
    );
  });

  it("opens the PIN reset dialog when clicking Reset PIN", async () => {
    const user = userEvent.setup();
    render(
      <ChildProfileView
        child={SAMPLE_CHILD}
        availableYearLevels={[3, 5]}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Reset PIN/i }));
    expect(screen.getByRole("heading", { name: /Reset Aisha’s PIN\?/i })).toBeInTheDocument();
  });

  it("opens the printable sign-in card dialog", async () => {
    const user = userEvent.setup();
    render(
      <ChildProfileView
        child={SAMPLE_CHILD}
        availableYearLevels={[3, 5]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Sign-in card" }));
    expect(screen.getByRole("heading", { name: "Student sign-in card" })).toBeInTheDocument();
    expect(screen.getAllByText("K7XJ-2P9R")).toHaveLength(2);
  });

  it("handles profile pausing and displays honest confirmation copy", async () => {
    const user = userEvent.setup();
    render(
      <ChildProfileView
        child={SAMPLE_CHILD}
        availableYearLevels={[3, 5]}
        isLocalPreview={true}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Pause Aisha/i }));
    expect(screen.getByText(/Pausing stops Aisha signing in\. Her profile, papers and all answers are completely kept/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Pause profile" }));
    expect(await screen.findByRole("button", { name: /Let Aisha back in/i })).toBeInTheDocument();
  });

  it("allows requesting out-of-band deletion", async () => {
    const user = userEvent.setup();
    render(
      <ChildProfileView
        child={SAMPLE_CHILD}
        availableYearLevels={[3, 5]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Request deletion" }));
    expect(screen.getByText(/This begins the out-of-band erasure process/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirm deletion request" }));
    expect(await screen.findByText(/Deletion requested/i)).toBeInTheDocument();
    expect(screen.getByText(/We will verify your request before anything is erased/i)).toBeInTheDocument();
  });
});
