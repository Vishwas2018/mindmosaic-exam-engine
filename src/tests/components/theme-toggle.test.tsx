import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let pathname = "/practice";
vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

import { ThemeController } from "@/features/theme/ThemeController";
import { ThemeToggle } from "@/features/theme/ThemeToggle";

const root = () => document.documentElement;

describe("Night mode", () => {
  beforeEach(() => {
    pathname = "/practice";
    window.localStorage.clear();
    root().removeAttribute("data-theme");
  });
  afterEach(() => {
    window.localStorage.clear();
    root().removeAttribute("data-theme");
  });

  it("is off by default and the switch says so", () => {
    render(
      <>
        <ThemeController />
        <ThemeToggle />
      </>,
    );
    expect(root()).not.toHaveAttribute("data-theme");
    expect(screen.getByRole("switch", { name: "Night mode" })).toHaveAttribute("aria-checked", "false");
  });

  it("turns on with the switch, stores the choice, and turns off again", async () => {
    const user = userEvent.setup();
    render(
      <>
        <ThemeController />
        <ThemeToggle />
      </>,
    );
    await user.click(screen.getByRole("switch", { name: "Night mode" }));
    expect(root()).toHaveAttribute("data-theme", "dark");
    expect(window.localStorage.getItem("mm-theme")).toBe("dark");
    expect(screen.getByRole("switch", { name: "Night mode" })).toHaveAttribute("aria-checked", "true");

    await user.click(screen.getByRole("switch", { name: "Night mode" }));
    expect(root()).not.toHaveAttribute("data-theme");
    expect(window.localStorage.getItem("mm-theme")).toBe("light");
  });

  it("restores a saved choice", () => {
    window.localStorage.setItem("mm-theme", "dark");
    render(<ThemeController />);
    expect(root()).toHaveAttribute("data-theme", "dark");
  });

  it("ignores a corrupt saved value", () => {
    window.localStorage.setItem("mm-theme", "nonsense");
    render(<ThemeController />);
    expect(root()).not.toHaveAttribute("data-theme");
  });

  it("stays light, and shows no switch, on a route that has not been verified", () => {
    pathname = "/admin/review";
    window.localStorage.setItem("mm-theme", "dark");
    render(
      <>
        <ThemeController />
        <ThemeToggle />
      </>,
    );
    expect(root()).not.toHaveAttribute("data-theme");
    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
  });

  it("follows the route: dark on a verified page, light when the visitor moves to one that is not", () => {
    window.localStorage.setItem("mm-theme", "dark");
    const { rerender } = render(<ThemeController />);
    expect(root()).toHaveAttribute("data-theme", "dark");
    pathname = "/teacher/assignments";
    act(() => rerender(<ThemeController />));
    expect(root()).not.toHaveAttribute("data-theme");
    pathname = "/results";
    act(() => rerender(<ThemeController />));
    expect(root()).toHaveAttribute("data-theme", "dark");
  });

  it("offers a labelled row for a mobile menu", () => {
    render(<ThemeToggle variant="row" />);
    const row = screen.getByRole("switch");
    expect(row).toHaveTextContent("Night mode");
    expect(row).toHaveTextContent("Off");
  });
});
