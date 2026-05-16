import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BrushStep } from "./BrushStep";

describe("BrushStep", () => {
  it("lets a child tap a toothbrush to complete brushing", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();

    render(<BrushStep kidName="Pip" onComplete={onComplete} />);
    await user.click(screen.getByRole("button", { name: /Moon Brush/i }));

    expect(onComplete).toHaveBeenCalledWith("toothbrush-moon");
    expect(screen.getByText(/Pip's teeth are all shiny/i)).toBeInTheDocument();
  });

  it("supports dropping a toothbrush onto the otter target", () => {
    const onComplete = vi.fn();

    render(<BrushStep kidName="Moss" onComplete={onComplete} />);
    const target = screen.getByText(/Brush Moss's teeth/i).closest(".brush-target") as HTMLElement;

    fireEvent.drop(target, {
      dataTransfer: {
        getData: () => "toothbrush-bubble"
      }
    });

    expect(onComplete).toHaveBeenCalledWith("toothbrush-bubble");
    expect(screen.getByText(/Moss's teeth are all shiny/i)).toBeInTheDocument();
  });
});
