import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

vi.mock("server-only", () => ({}));

const mockHost = vi.hoisted(() => ({ value: "localhost:3011" as string | null }));
vi.mock("next/headers", () => ({
  headers: async () => ({ get: (name: string) => (name === "host" ? mockHost.value : null) }),
}));

import { isAuthPreviewEnabled } from "@/features/auth/preview-mode";
import { AuthPreviewScreens } from "@/features/auth/components/preview/AuthPreviewScreens";

describe("Authentication Workspace Preview Gate & Component", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    mockHost.value = "localhost:3011";
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("isAuthPreviewEnabled", () => {
    it("returns false when AUTH_PREVIEW is not set", async () => {
      vi.unstubAllEnvs();
      const enabled = await isAuthPreviewEnabled();
      expect(enabled).toBe(false);
    });

    it("returns false when on Vercel even if AUTH_PREVIEW=1", async () => {
      vi.stubEnv("AUTH_PREVIEW", "1");
      vi.stubEnv("VERCEL", "1");
      const enabled = await isAuthPreviewEnabled();
      expect(enabled).toBe(false);
    });

    it("returns false if host is non-loopback", async () => {
      vi.stubEnv("AUTH_PREVIEW", "1");
      mockHost.value = "mindmosaic.com.au";
      const enabled = await isAuthPreviewEnabled();
      expect(enabled).toBe(false);
    });

    it("returns true when AUTH_PREVIEW=1 and loopback", async () => {
      vi.stubEnv("AUTH_PREVIEW", "1");
      mockHost.value = "localhost:3011";
      const enabled = await isAuthPreviewEnabled();
      expect(enabled).toBe(true);
    });
  });

  describe("AuthPreviewScreens component", () => {
    it("renders the entry artboard by default with role selection", () => {
      render(<AuthPreviewScreens initialView="entry" />);

      expect(screen.getByText("Welcome to MindMosaic")).toBeInTheDocument();
      expect(screen.getByText("Choose how you want to sign in today.")).toBeInTheDocument();
      expect(screen.getByText(/I'm a parent/i)).toBeInTheDocument();
      expect(screen.getByText(/I'm a student/i)).toBeInTheDocument();
    });

    it("renders parent sign-in when switched to parent-signin", () => {
      render(<AuthPreviewScreens initialView="parent-signin" />);

      expect(screen.getByText("Parent sign in")).toBeInTheDocument();
      expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    });

    it("renders student sign-in with 8-character code and 6-digit PIN", () => {
      render(<AuthPreviewScreens initialView="student-signin" />);

      expect(screen.getByText("Student sign in")).toBeInTheDocument();
      expect(screen.getByLabelText(/Login code/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/PIN/i)).toBeInTheDocument();
    });

    it("allows switching artboards using the top switcher pills", () => {
      render(<AuthPreviewScreens initialView="entry" />);

      const studentPill = screen.getByRole("button", { name: /Student Sign-in \(b14\)/i });
      fireEvent.click(studentPill);

      expect(screen.getByText("Student sign in")).toBeInTheDocument();
    });

    it("renders the session expired state", () => {
      render(<AuthPreviewScreens initialView="session-expired" />);

      expect(screen.getByText("Your session has expired")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Sign in again/i })).toBeInTheDocument();
    });

    it("renders paused profile state with parent reactivate guidance", () => {
      render(<AuthPreviewScreens initialView="paused-profile" />);

      expect(screen.getByText("Practice is currently paused")).toBeInTheDocument();
      expect(screen.getByText(/Ask your parent to unpause your place/i)).toBeInTheDocument();
    });
  });
});
