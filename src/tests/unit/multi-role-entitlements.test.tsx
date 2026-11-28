import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WorkspaceSwitcher } from "@/features/auth/components/WorkspaceSwitcher";
import { landingForEntitled, resolveEntitledRoles, type AdminGrantRow } from "@/features/auth/roles";

const active: AdminGrantRow = { role: "admin", revoked_at: null };
const revoked: AdminGrantRow = { role: "admin", revoked_at: "2026-11-26T00:00:00Z" };

describe("resolveEntitledRoles", () => {
  it("gives a parent with an active admin grant both workspaces, primary first", () => {
    expect(resolveEntitledRoles("parent", [active])).toEqual(["parent", "admin"]);
  });

  it("never lets a profile role alone confer admin once a grant row exists and is revoked", () => {
    expect(resolveEntitledRoles("admin", [revoked])).toEqual([]);
    expect(resolveEntitledRoles("parent", [revoked])).toEqual(["parent"]);
  });

  it("is strict once the migration is applied: a profile that merely says admin, with no grant, is not admin", () => {
    expect(resolveEntitledRoles("admin", [])).toEqual([]);
  });

  it("keeps legacy admins working ONLY on a database that predates the entitlement table", () => {
    expect(resolveEntitledRoles("admin", "missing")).toEqual(["admin"]);
    expect(resolveEntitledRoles("parent", "missing")).toEqual(["parent"]);
  });

  it("fails closed on an unexpected lookup error: no admin even for a profile-admin or a granted login", () => {
    expect(resolveEntitledRoles("admin", "error")).toEqual([]);
    expect(resolveEntitledRoles("parent", "error")).toEqual(["parent"]);
  });

  it("does not turn a non-admin into an admin without a grant, and ignores unknown roles", () => {
    expect(resolveEntitledRoles("parent", [])).toEqual(["parent"]);
    expect(resolveEntitledRoles("student", [{ role: "superuser", revoked_at: null }])).toEqual(["student"]);
    expect(resolveEntitledRoles("student", "missing")).toEqual(["student"]);
    expect(resolveEntitledRoles(null, [])).toEqual([]);
  });
});

describe("landingForEntitled", () => {
  it("sends people to an entitled home and never loops a revoked admin back to /admin", () => {
    expect(landingForEntitled(["parent", "admin"], "parent")).toBe("/parent");
    expect(landingForEntitled(["parent"], "parent")).toBe("/parent");
    expect(landingForEntitled(["admin"], "admin")).toBe("/admin");
    expect(landingForEntitled([], "admin")).toBe("/");
    expect(landingForEntitled([], null)).toBe("/");
  });
});

describe("WorkspaceSwitcher", () => {
  it("renders nothing for a single-role login", () => {
    const { container } = render(<WorkspaceSwitcher roles={["parent"]} current="parent" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("offers both workspaces and marks the current one", () => {
    render(<WorkspaceSwitcher roles={["parent", "admin"]} current="admin" />);
    expect(screen.getByRole("navigation", { name: "Workspace switcher" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Admin" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Admin" })).toHaveAttribute("href", "/admin");
    const parent = screen.getByRole("link", { name: "Parent" });
    expect(parent).toHaveAttribute("href", "/parent");
    expect(parent).not.toHaveAttribute("aria-current");
  });
});
