import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { BedtimeStepDefinition } from "../../game/content";
import { RoutineStepContent } from "./RoutineStepContent";
import { SnackStep } from "./SnackStep";

const feedStep: BedtimeStepDefinition = {
  id: "feed",
  title: "Snack Time",
  actionLabel: "Give a bedtime snack",
  detail: "Snack detail",
  sceneAssetId: "scene-snack-table"
};

describe("SnackStep", () => {
  it("lets a child tap a snack to deliver it", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();

    render(<SnackStep kidName="Pip" onComplete={onComplete} />);
    await user.click(screen.getByRole("button", { name: /Berry Bowl/i }));

    expect(onComplete).toHaveBeenCalledWith("snack-berries");
    expect(screen.getByText(/Pip got a snack/i)).toBeInTheDocument();
  });

  it("accepts a dragged snack drop", () => {
    const onComplete = vi.fn();

    render(<SnackStep kidName="Moss" onComplete={onComplete} />);

    const snack = screen.getByRole("button", { name: /Moon Crackers/i });
    const target = screen.getByLabelText(/Moss snack target/i);
    const dataTransfer = {
      effectAllowed: "",
      dropEffect: "",
      setData: vi.fn(),
      getData: vi.fn(() => "snack-crackers")
    };

    fireEvent.dragStart(snack, { dataTransfer });
    fireEvent.dragOver(target, { dataTransfer });
    fireEvent.drop(target, { dataTransfer });

    expect(onComplete).toHaveBeenCalledWith("snack-crackers");
    expect(screen.getByText(/Moon Crackers is ready for bedtime/i)).toBeInTheDocument();
  });
});

describe("RoutineStepContent", () => {
  it("renders the snack step for the feed routine", () => {
    render(
      <RoutineStepContent
        step={feedStep}
        unlockedOutfits={[]}
        onSelectOutfit={() => undefined}
        activeKidName="Bubble"
      />
    );

    expect(screen.getByText(/Drag a snack to Bubble/i)).toBeInTheDocument();
  });
});
