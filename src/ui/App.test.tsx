import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("renders the project shell details", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "OtterFlop" })).toBeInTheDocument();
    expect(screen.getByText(/GitHub Pages target/i)).toBeInTheDocument();
    expect(screen.getByText(/asset prompt catalog/i)).toBeInTheDocument();
    expect(screen.getByAltText("Pip")).toBeInTheDocument();
    expect(screen.getByAltText(/Mommy otter character/i)).toBeInTheDocument();
    expect(screen.getByAltText(/Concept family lineup/i)).toBeInTheDocument();
    expect(
      screen.getByText("https://codewrangler55.github.io/OtterFlop/")
    ).toBeInTheDocument();
  });
});
