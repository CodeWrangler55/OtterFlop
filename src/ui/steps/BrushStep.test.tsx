import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BrushStep } from "./BrushStep";

function mockBrushGeometry() {
  const stage = screen.getByLabelText(/Brush Pip's teeth/i);
  const mouth = stage.querySelector(".brush-otter-mouth") as HTMLElement;

  vi.spyOn(stage, "getBoundingClientRect").mockReturnValue({
    left: 0,
    top: 0,
    right: 400,
    bottom: 400,
    width: 400,
    height: 400,
    x: 0,
    y: 0,
    toJSON: () => ({})
  });

  vi.spyOn(mouth, "getBoundingClientRect").mockReturnValue({
    left: 135,
    top: 120,
    right: 265,
    bottom: 190,
    width: 130,
    height: 70,
    x: 135,
    y: 120,
    toJSON: () => ({})
  });
}

describe("BrushStep", () => {
  beforeEach(() => {
    Element.prototype.setPointerCapture = vi.fn();
  });

  it("selects a toothbrush without completing brushing", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();

    render(<BrushStep kidName="Pip" onComplete={onComplete} />);
    await user.click(screen.getByRole("button", { name: /Bubble Brush/i }));

    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByText(/Scrub the teeth/i)).toBeInTheDocument();
  });

  it("requires five seconds of back-and-forth scrubbing over the teeth", () => {
    const onComplete = vi.fn();

    render(<BrushStep kidName="Pip" onComplete={onComplete} />);
    mockBrushGeometry();

    const brush = screen.getByRole("button", { name: /Move Moon Brush/i });
    const stage = screen.getByLabelText(/Brush Pip's teeth/i);

    fireEvent.mouseDown(brush, { clientX: 150, clientY: 150 });

    for (let index = 0; index < 30; index += 1) {
      const clientX = index % 2 === 0 ? 245 : 155;

      fireEvent.mouseMove(stage, {
        clientX,
        clientY: 154
      });
    }

    expect(onComplete).toHaveBeenCalledWith("toothbrush-moon");
    expect(screen.getByText(/Pip's teeth are all shiny/i)).toBeInTheDocument();
  });
});
