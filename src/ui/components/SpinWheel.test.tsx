import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SpinWheel, type SpinWheelSegment } from "./SpinWheel";

const segments: SpinWheelSegment[] = [
  {
    id: "outfit-pajamas-stars",
    label: "Stars Pajamas",
    fillColor: "#8aa6ff",
    accentColor: "#6378d8"
  },
  {
    id: "outfit-nightgown-cloud",
    label: "Cloud Nightgown",
    fillColor: "#f7a7d4",
    accentColor: "#e880bc"
  },
  {
    id: "kid-moss",
    label: "Moss",
    fillColor: "#7dd7b6",
    accentColor: "#44b997"
  }
];

describe("SpinWheel", () => {
  it("renders the wheel and lets the parent wire the spin action", async () => {
    const user = userEvent.setup();
    const onSpin = vi.fn();

    render(<SpinWheel segments={segments} rewardId={null} onSpin={onSpin} />);
    await user.click(screen.getByRole("button", { name: /spin for a surprise/i }));

    expect(onSpin).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("img", { name: /prize wheel/i })).toBeInTheDocument();
  });

  it("lets the child tap the wheel itself to start spinning", async () => {
    const user = userEvent.setup();
    const onSpin = vi.fn();

    render(<SpinWheel segments={segments} rewardId={null} onSpin={onSpin} />);
    await user.click(screen.getByRole("img", { name: /prize wheel/i }));

    expect(onSpin).toHaveBeenCalledTimes(1);
  });

  it("disables the trigger while spinning", () => {
    render(
      <SpinWheel
        segments={segments}
        rewardId="outfit-pajamas-stars"
        isSpinning
        spinToken={1}
        onSpin={() => undefined}
      />
    );

    expect(screen.getByRole("button", { name: /spinning/i })).toBeDisabled();
    expect(screen.getByText(/wheel is spinning/i)).toBeInTheDocument();
  });

  it("reveals the resolved reward after the wheel animation finishes", () => {
    const onReveal = vi.fn();
    const { container, rerender } = render(
      <SpinWheel segments={segments} rewardId={null} spinToken={0} onSpin={() => undefined} onReveal={onReveal} />
    );

    rerender(
      <SpinWheel
        segments={segments}
        rewardId="kid-moss"
        isSpinning
        spinToken={1}
        onSpin={() => undefined}
        onReveal={onReveal}
      />
    );

    fireEvent.transitionEnd(container.querySelector(".spin-wheel") as HTMLElement);

    expect(onReveal).toHaveBeenCalledWith(segments[2]);
    expect(screen.getByText(/Moss is ready/i)).toBeInTheDocument();
    expect(container.querySelector(".spin-wheel-reveal strong")?.textContent).toBe("Moss");
  });
});
