import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OTTER_FLOP_ANIMATION_MS, OtterFlopStep } from "./OtterFlopStep";

describe("OtterFlopStep", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows the step art and idle prompt before the jump", () => {
    render(<OtterFlopStep kidId="kid-pip" outfitId="outfit-pajamas-moon" onComplete={vi.fn()} />);

    expect(screen.getByRole("img", { name: /otter flop scene/i })).toBeInTheDocument();
    expect(screen.getByAltText(/dad otter waiting with open arms/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /jump to dad/i })).toBeEnabled();
    expect(screen.getByText(/help the otter kid leap into dad's arms/i)).toBeInTheDocument();
  });

  it("animates once and calls onComplete after the jump finishes", () => {
    const onComplete = vi.fn();

    render(<OtterFlopStep kidId="kid-pip" outfitId="outfit-pajamas-moon" onComplete={onComplete} />);

    const stage = screen.getByRole("img", { name: /otter flop scene/i });
    const button = screen.getByRole("button", { name: /jump to dad/i });

    fireEvent.click(button);

    expect(stage).toHaveClass("otter-flop-stage-jumping");
    expect(screen.getByRole("button", { name: /jumping/i })).toBeDisabled();
    expect(onComplete).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(OTTER_FLOP_ANIMATION_MS);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(stage).toHaveClass("otter-flop-stage-landed");
    expect(screen.getByRole("button", { name: /caught by dad/i })).toBeDisabled();
  });
});
