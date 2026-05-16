import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LullabyStep } from "./LullabyStep";

describe("LullabyStep", () => {
  it("plays the lullaby and completes the step on user action", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    const playLullaby = vi.fn().mockResolvedValue({
      mode: "audio",
      durationMs: 1_120
    });

    render(<LullabyStep onComplete={onComplete} playLullaby={playLullaby} />);

    await user.click(screen.getByRole("button", { name: /play lullaby/i }));

    expect(playLullaby).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent(/lullaby is playing/i);
    expect(screen.getByRole("button", { name: /lullaby started/i })).toBeDisabled();
  });

  it("falls back cleanly when audio cannot play", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    const playLullaby = vi.fn().mockRejectedValue(new Error("audio blocked"));

    render(<LullabyStep onComplete={onComplete} playLullaby={playLullaby} />);

    await user.click(screen.getByRole("button", { name: /play lullaby/i }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent(/audio is unavailable/i);
  });
});
