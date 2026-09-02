import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MindMosaicLogo } from "@/components/branding";

describe("MindMosaicLogo component", () => {
  it("renders with default props (light variant, md size, full lockup)", () => {
    render(<MindMosaicLogo />);
    const logo = screen.getByRole("img", { name: "MindMosaic" });
    expect(logo).toBeInTheDocument();

    // Wordmark text runs
    expect(screen.getByText("Mind")).toBeInTheDocument();
    expect(screen.getByText("Mosaic")).toBeInTheDocument();
    expect(screen.getByText("®")).toBeInTheDocument();

    // Default light variant styling
    expect(screen.getByText("Mind")).toHaveClass("text-brand");
    expect(screen.getByText("Mosaic")).toHaveClass("text-brand-coral");
  });

  it("renders the inverse variant with white text for Mind and accessible trademark", () => {
    render(<MindMosaicLogo variant="inverse" />);
    const logo = screen.getByRole("img", { name: "MindMosaic" });
    expect(logo).toBeInTheDocument();

    expect(screen.getByText("Mind")).toHaveClass("text-white");
    expect(screen.getByText("Mosaic")).toHaveClass("text-brand-coral");
    expect(screen.getByText("®")).toHaveClass("text-white/70");
  });

  it("supports backwards-compatible inverse prop and inverseTone='lilac'", () => {
    render(<MindMosaicLogo inverse inverseTone="lilac" />);
    expect(screen.getByText("Mind")).toHaveClass("text-mm-lilac");
    expect(screen.getByText("Mosaic")).toHaveClass("text-brand-coral");
  });

  it("supports layout='mark' to render only the brain mark without wordmark", () => {
    render(<MindMosaicLogo layout="mark" />);
    const logo = screen.getByRole("img", { name: "MindMosaic" });
    expect(logo).toBeInTheDocument();
    expect(screen.queryByText("Mind")).not.toBeInTheDocument();
    expect(screen.queryByText("Mosaic")).not.toBeInTheDocument();
  });

  it("supports trademark='tm' and trademark='none'", () => {
    const { rerender } = render(<MindMosaicLogo trademark="tm" />);
    expect(screen.getByText("™")).toBeInTheDocument();
    expect(screen.queryByText("®")).not.toBeInTheDocument();

    rerender(<MindMosaicLogo trademark="none" />);
    expect(screen.queryByText("™")).not.toBeInTheDocument();
    expect(screen.queryByText("®")).not.toBeInTheDocument();
  });

  it("renders correct discrete sizes: sm, md, lg", () => {
    const { container, rerender } = render(<MindMosaicLogo size="sm" />);
    const smImg = container.querySelector("img");
    expect(smImg).toHaveAttribute("width", "29");
    expect(smImg).toHaveAttribute("height", "26");

    rerender(<MindMosaicLogo size="md" />);
    const mdImg = container.querySelector("img");
    expect(mdImg).toHaveAttribute("width", "38");
    expect(mdImg).toHaveAttribute("height", "34");

    rerender(<MindMosaicLogo size="lg" />);
    const lgImg = container.querySelector("img");
    expect(lgImg).toHaveAttribute("width", "49");
    expect(lgImg).toHaveAttribute("height", "44");
  });

  it("gracefully normalizes legacy numeric sizes to controlled presets", () => {
    const { container, rerender } = render(<MindMosaicLogo size={22} />);
    const smImg = container.querySelector("img");
    expect(smImg).toHaveAttribute("width", "29");

    rerender(<MindMosaicLogo size={36} />);
    const mdImg = container.querySelector("img");
    expect(mdImg).toHaveAttribute("width", "38");

    rerender(<MindMosaicLogo size={48} />);
    const lgImg = container.querySelector("img");
    expect(lgImg).toHaveAttribute("width", "49");
  });

  it("merges custom className without breaking core alignment", () => {
    const { container } = render(<MindMosaicLogo className="custom-test-class" />);
    expect(container.firstChild).toHaveClass("custom-test-class");
    expect(container.firstChild).toHaveClass("inline-flex");
    expect(container.firstChild).toHaveClass("items-center");
  });
});
