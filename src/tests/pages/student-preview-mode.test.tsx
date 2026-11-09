import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

vi.mock("server-only", () => ({}));

const mockHost = vi.hoisted(() => ({ value: "localhost:3010" as string | null }));
vi.mock("next/headers", () => ({
  headers: async () => ({ get: (name: string) => (name === "host" ? mockHost.value : null) }),
}));

import { isStudentPreviewEnabled } from "@/features/student/preview-mode";
import { requireStudent } from "@/features/student/require-student";
import { PREVIEW_STUDENT_CONTEXT } from "@/features/student/fixtures/student-preview-fixtures";
import { StudentAnswerReview } from "@/features/student/components/review/StudentAnswerReview";

describe("Student Workspace Preview Gate & Review", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    mockHost.value = "localhost:3010";
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("isStudentPreviewEnabled", () => {
    it("returns false when STUDENT_WORKSPACE_PREVIEW is not set", async () => {
      vi.unstubAllEnvs();
      const enabled = await isStudentPreviewEnabled();
      expect(enabled).toBe(false);
    });

    it("returns false when on Vercel even if STUDENT_WORKSPACE_PREVIEW=1", async () => {
      vi.stubEnv("STUDENT_WORKSPACE_PREVIEW", "1");
      vi.stubEnv("VERCEL", "1");
      const enabled = await isStudentPreviewEnabled();
      expect(enabled).toBe(false);
    });
  });

  describe("requireStudent in preview mode", () => {
    it("returns sample student context without requiring Supabase", async () => {
      vi.stubEnv("STUDENT_WORKSPACE_PREVIEW", "1");

      const student = await requireStudent();
      expect(student).toEqual(PREVIEW_STUDENT_CONTEXT);
      expect(student.displayName).toBe("Aisha Raman");
      expect(student.yearLevel).toBe(3);
    });
  });

  describe("StudentAnswerReview Component", () => {
    it("renders headings, score text, and questions", () => {
      render(
        <StudentAnswerReview
          paperTitle="NAPLAN-style Numeracy"
          scoreText="24 of 32 marks"
        />
      );

      expect(
        screen.getByRole("heading", {
          level: 1,
          name: /every question, with the working/i,
        })
      ).toBeInTheDocument();
      expect(screen.getByText(/24 of 32 marks/i)).toBeInTheDocument();
      expect(screen.getByText(/filter:/i)).toBeInTheDocument();
    });

    it("filters questions when filter chips are clicked", () => {
      render(
        <StudentAnswerReview
          paperTitle="NAPLAN-style Numeracy"
          scoreText="24 of 32 marks"
        />
      );

      const wrongFilter = screen.getByRole("button", { name: /wrong/i });
      fireEvent.click(wrongFilter);

      expect(screen.getAllByText(/needs look/i).length).toBeGreaterThan(0);
    });
  });
});
