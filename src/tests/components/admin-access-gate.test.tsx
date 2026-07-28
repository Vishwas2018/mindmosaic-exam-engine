import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdminAccessGate } from "@/features/admin-analytics/components/AdminAccessGate";
import type { ProfileRole } from "@/features/auth";

describe("AdminAccessGate", () => {
  it("renders children for an admin", () => {
    render(
      <AdminAccessGate role="admin">
        <p data-testid="protected">Operations content</p>
      </AdminAccessGate>,
    );
    expect(screen.getByTestId("protected")).toBeInTheDocument();
    expect(screen.queryByTestId("permission-denied")).not.toBeInTheDocument();
  });

  it.each<ProfileRole | null>(["teacher", "parent", "student", null])(
    "renders PermissionDenied instead of children for role %s",
    (role) => {
      render(
        <AdminAccessGate role={role}>
          <p data-testid="protected">Operations content</p>
        </AdminAccessGate>,
      );
      expect(screen.getByTestId("permission-denied")).toBeInTheDocument();
      expect(screen.queryByTestId("protected")).not.toBeInTheDocument();
    },
  );
});
