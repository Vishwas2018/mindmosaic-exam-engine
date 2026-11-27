import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DefectDashboard } from "@/features/uat-assistant/components/DefectDashboard";
import { ElementInspectorOverlay } from "@/features/uat-assistant/components/ElementInspectorOverlay";
import { ReportIssueModal } from "@/features/uat-assistant/components/ReportIssueModal";
import type { BrowserSpeechRecognitionInstance } from "@/features/uat-assistant/components/useSpeechToText";
import {
  listUatIssues,
  resetUatStoreForTests,
} from "@/features/uat-assistant/storage/uat-idb";
import type { UatEnvironmentContext } from "@/features/uat-assistant/types";

// Polyfill native <dialog> showModal/close in jsdom if missing
beforeEach(async () => {
  await resetUatStoreForTests();
  HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

afterEach(() => {
  vi.restoreAllMocks();
  delete (window as unknown as { __MM_UAT_SPEECH_RECOGNITION__?: unknown }).__MM_UAT_SPEECH_RECOGNITION__;
});

const SAMPLE_ENV: UatEnvironmentContext = {
  browser: "Chrome 136 · Windows",
  viewport: { width: 1280, height: 800, devicePixelRatio: 1 },
  timestamp: "2026-11-26T02:00:00.000Z",
  route: "/student",
  pageUrl: "http://localhost:3000/student",
  portal: "student",
  testSessionId: "UAT-20261126-TEST",
  testSessionLabel: "Unit Pass",
  activeRole: "admin",
};

describe("UAT Assistant UI — non-destructive element inspector", () => {
  it("captures element locator without activating the underlying exam submit button", () => {
    const examSubmitSpy = vi.fn();
    const onSelect = vi.fn();

    render(
      <div>
        <button
          data-testid="exam-submit-answer"
          type="button"
          onClick={examSubmitSpy}
        >
          Submit final exam
        </button>
        <ElementInspectorOverlay
          active={true}
          onSelect={onSelect}
          onCancel={() => {}}
        />
      </div>,
    );

    const examBtn = screen.getByTestId("exam-submit-answer");
    document.elementsFromPoint = vi.fn(() => [
      screen.getByTestId("uat-inspector-shield"),
      examBtn,
      document.body,
    ]);

    const shield = screen.getByTestId("uat-inspector-shield");
    fireEvent.pointerMove(shield, { clientX: 40, clientY: 40 });
    fireEvent.click(shield, { clientX: 40, clientY: 40 });

    expect(examSubmitSpy).not.toHaveBeenCalled();
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0]?.[0]).toMatchObject({
      locator: '[data-testid="exam-submit-answer"]',
      locatorStrategy: "testid",
      tagName: "button",
      visibleSnippet: "Submit final exam",
    });
  });
});

describe("UAT Assistant UI — voice dictation, AI improvement & dashboard workflow", () => {
  it("shows unsupported fallback when SpeechRecognition is unavailable and still saves manual notes", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();

    render(
      <ReportIssueModal
        open={true}
        onClose={() => {}}
        onStartElementPick={() => {}}
        pickedElement={null}
        onClearElement={() => {}}
        environment={SAMPLE_ENV}
        aiConfigured={true}
        onSaved={onSaved}
      />,
    );

    expect(screen.getByTestId("uat-voice-unsupported")).toBeInTheDocument();

    const notesBox = screen.getByLabelText(/Your observation notes/i);
    await user.type(notesBox, "Card padding collapses on tablet portrait.");
    await user.click(screen.getByTestId("uat-save-issue-btn"));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    const saved = await listUatIssues();
    expect(saved).toHaveLength(1);
    expect(saved[0]?.originalNotes).toBe("Card padding collapses on tablet portrait.");
  });

  it("supports voice dictation, preserves original notes after Improve with AI, and allows editing AI output", async () => {
    let lastInstance: BrowserSpeechRecognitionInstance | null = null;
    class MockSpeechRecognition implements BrowserSpeechRecognitionInstance {
      continuous = false;
      interimResults = false;
      lang = "en-AU";
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: ((event: { error: string }) => void) | null = null;
      onresult: ((event: {
        resultIndex: number;
        results: { length: number; [index: number]: { isFinal: boolean; length: number; [index: number]: { transcript: string } } };
      }) => void) | null = null;
      constructor() {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        lastInstance = this;
      }
      start() {
        this.onstart?.();
      }
      stop() {
        this.onend?.();
      }
      abort() {
        this.onend?.();
      }
    }

    (window as unknown as { __MM_UAT_SPEECH_RECOGNITION__?: unknown }).__MM_UAT_SPEECH_RECOGNITION__ =
      MockSpeechRecognition;

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ok: true,
          draft: {
            title: "Timer badge contrast too low on Practice runner",
            description: "Tester observed low contrast on the timer badge.",
            stepsToReproduce: ["Open /student", "Check timer badge"],
            actualResult: "Timer badge text is faint.",
            expectedResult: "To verify: timer text meets 4.5:1 AA contrast.",
            severity: "high",
            category: "accessibility",
            generatedAt: "2026-11-26T02:10:00.000Z",
            providerId: "anthropic",
            modelId: "claude-sonnet-5",
            mode: "ai",
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const user = userEvent.setup();
    const onSaved = vi.fn();

    render(
      <ReportIssueModal
        open={true}
        onClose={() => {}}
        onStartElementPick={() => {}}
        pickedElement={null}
        onClearElement={() => {}}
        environment={SAMPLE_ENV}
        aiConfigured={true}
        onSaved={onSaved}
      />,
    );

    const voiceBtn = await screen.findByTestId("uat-voice-toggle");
    await user.click(voiceBtn);

    expect(lastInstance).not.toBeNull();
    act(() => {
      lastInstance!.onresult?.({
        resultIndex: 0,
        results: {
          length: 1,
          0: {
            isFinal: true,
            length: 1,
            0: { transcript: "The timer badge text looks faint against lilac." },
          },
        },
      });
    });

    await waitFor(() =>
      expect(screen.getByLabelText(/Your observation notes/i)).toHaveValue(
        "The timer badge text looks faint against lilac.",
      ),
    );

    // Trigger Improve with AI
    await user.click(screen.getByTestId("uat-improve-ai-btn"));

    const titleInput = await screen.findByLabelText("Defect title");
    expect(titleInput).toHaveValue("Timer badge contrast too low on Practice runner");

    // Original notes remain untouched!
    expect(screen.getByLabelText(/Your observation notes/i)).toHaveValue(
      "The timer badge text looks faint against lilac.",
    );

    // Edit the AI-generated title before saving
    await user.clear(titleInput);
    await user.type(titleInput, "Edited: Timer badge contrast below AA");
    await user.click(screen.getByTestId("uat-save-issue-btn"));

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));

    const issues = await listUatIssues();
    expect(issues[0]?.title).toBe("Edited: Timer badge contrast below AA");
    expect(issues[0]?.originalNotes).toBe("The timer badge text looks faint against lilac.");
    expect(issues[0]?.inputMethod).toBe("voice");
  });

  it("surfaces actionable recovery message when microphone permission is denied", async () => {
    class DeniedSpeechRecognition implements BrowserSpeechRecognitionInstance {
      continuous = false;
      interimResults = false;
      lang = "en-AU";
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: ((event: { error: string }) => void) | null = null;
      onresult: null = null;
      start() {
        this.onerror?.({ error: "not-allowed" });
      }
      stop() {}
      abort() {}
    }

    (window as unknown as { __MM_UAT_SPEECH_RECOGNITION__?: unknown }).__MM_UAT_SPEECH_RECOGNITION__ =
      DeniedSpeechRecognition;

    const user = userEvent.setup();
    render(
      <ReportIssueModal
        open={true}
        onClose={() => {}}
        onStartElementPick={() => {}}
        pickedElement={null}
        onClearElement={() => {}}
        environment={SAMPLE_ENV}
        aiConfigured={false}
        onSaved={() => {}}
      />,
    );

    await user.click(await screen.findByTestId("uat-voice-toggle"));
    expect(await screen.findByRole("alert")).toHaveTextContent(/Microphone permission is blocked/i);
  });

  it("filters statuses (Open, Fixed, Retest, Closed) and gates GitHub issue creation behind explicit confirmation", async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          githubIssue: {
            number: 88,
            url: "https://github.com/Vishwas2018/mindmosaic-exam-engine/issues/88",
            repo: "Vishwas2018/mindmosaic-exam-engine",
            createdAt: "2026-11-26T02:30:00.000Z",
          },
        }),
        { status: 201, headers: { "content-type": "application/json" } },
      ),
    );

    // Seed one issue via ReportIssueModal first
    render(
      <ReportIssueModal
        open={true}
        onClose={() => {}}
        onStartElementPick={() => {}}
        pickedElement={null}
        onClearElement={() => {}}
        environment={SAMPLE_ENV}
        aiConfigured={false}
        onSaved={() => {}}
      />,
    );
    await user.type(screen.getByLabelText(/Your observation notes/i), "Broken link in footer");
    await user.click(screen.getByTestId("uat-save-issue-btn"));
    await waitFor(async () => expect(await listUatIssues()).toHaveLength(1));

    render(
      <DefectDashboard
        mode="page"
        githubRepo="Vishwas2018/mindmosaic-exam-engine"
        githubConfigured={true}
      />,
    );

    expect(await screen.findByTestId("uat-detail-original-notes")).toHaveTextContent(
      "Broken link in footer",
    );

    // Transition Open -> Fixed -> Retest -> Closed
    const statusSelect = screen.getByTestId("uat-detail-status-select");
    await user.selectOptions(statusSelect, "fixed");
    await user.click(screen.getByTestId("uat-filter-status-fixed"));
    expect(screen.getByTestId("uat-detail-original-notes")).toBeInTheDocument();

    await user.selectOptions(screen.getByTestId("uat-detail-status-select"), "retest");
    await user.click(screen.getByTestId("uat-filter-status-retest"));
    expect(screen.getByTestId("uat-detail-original-notes")).toBeInTheDocument();

    // Open GitHub confirmation modal — no API call happens until checkbox + confirm!
    await user.click(screen.getByTestId("uat-open-github-confirm"));
    expect(fetchSpy).not.toHaveBeenCalled();

    // Clicking confirm without ticking checkbox blocks submission
    await user.click(screen.getByTestId("uat-github-submit-confirm"));
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.getByText(/Tick the confirmation checkbox/i)).toBeInTheDocument();

    // Ticking checkbox + clicking confirm invokes POST /api/uat/github
    await user.click(screen.getByTestId("uat-github-confirm-checkbox"));
    await user.click(screen.getByTestId("uat-github-submit-confirm"));

    await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/Vishwas2018\/mindmosaic-exam-engine#88/)).toBeInTheDocument();
  });
});
