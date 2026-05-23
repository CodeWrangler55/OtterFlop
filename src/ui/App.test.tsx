import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { advanceKidStep, createInitialSave, exportSaveToJson, saveGame } from "../game/save-game";
import { App } from "./App";

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

  return stage;
}

function scrubTeeth() {
  const stage = mockBrushGeometry();
  const brush = screen.getByRole("button", { name: /Move Moon Brush over Pip's teeth/i });

  fireEvent.mouseDown(brush, { clientX: 150, clientY: 150 });

  for (let index = 0; index < 30; index += 1) {
    fireEvent.mouseMove(stage, {
      clientX: index % 2 === 0 ? 245 : 155,
      clientY: 154
    });
  }
}

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it("renders the home screen details", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "OtterFlop" })).toBeInTheDocument();
    expect(screen.getByText(/Unlocked otter kids/i)).toBeInTheDocument();
    expect(screen.getByText(/Surprise spins/i)).toBeInTheDocument();
    expect(screen.getByText(/Nightly surprise/i)).toBeInTheDocument();
    expect(screen.getAllByAltText("Pip").length).toBeGreaterThan(0);
    expect(
      screen.getByText("https://codewrangler55.github.io/OtterFlop/")
    ).toBeInTheDocument();
  });

  it("shows the splash briefly, then hides it after five seconds", () => {
    vi.useFakeTimers();

    render(<App />);

    expect(screen.getByLabelText(/opening splash/i)).toBeInTheDocument();
    expect(screen.getByText(/loading bedtime room/i)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5_000);
    });

    expect(screen.queryByLabelText(/opening splash/i)).not.toBeInTheDocument();
  });

  it("can enter the bedtime routine flow", async () => {
    const user = userEvent.setup();

    render(<App />);
    await user.click(screen.getByRole("button", { name: /start bedtime/i }));

    expect(screen.getByRole("heading", { name: /Snack Time/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Berry Bowl/i })).toBeInTheDocument();
    expect(screen.getByText(/Now helping Pip/i)).toBeInTheDocument();
  });

  it("can finish a bedtime and claim the nightly kid reward", async () => {
    const user = userEvent.setup();

    render(<App />);
    await user.click(screen.getByRole("button", { name: /start bedtime/i }));
    await user.click(screen.getByRole("button", { name: /Berry Bowl/i }));
    await user.click(screen.getByRole("button", { name: /Pick tonight's outfit/i }));
    scrubTeeth();
    await user.click(screen.getByRole("button", { name: /Jump to dad/i }));
    await waitFor(
      () => {
        expect(screen.getByRole("button", { name: /Fold paws together/i })).toBeInTheDocument();
      },
      { timeout: 2_500 }
    );
    await user.click(screen.getByRole("button", { name: /Fold paws together/i }));
    await user.click(screen.getByRole("button", { name: /Play lullaby/i }));
    await user.click(screen.getByRole("button", { name: /Finish bedtime for Pip/i }));
    await user.click(screen.getByRole("button", { name: /Claim bedtime surprise/i }));

    expect(screen.getByText(/Moss joined the bedtime family/i)).toBeInTheDocument();
    expect(screen.getByText(/2\/4 kids/i)).toBeInTheDocument();
  });

  it("can use a spin to unlock a new outfit", async () => {
    const user = userEvent.setup();

    render(<App />);
    await user.click(screen.getByRole("button", { name: /Spin for a surprise/i }));
    fireEvent.transitionEnd(screen.getByRole("img", { name: /Prize wheel/i }));

    expect(screen.getByText(/Stars Pajamas is ready for dress-up time/i)).toBeInTheDocument();
    expect(screen.getByText(/2 found/i)).toBeInTheDocument();
  });

  it("can dismiss a reward banner after a spin", async () => {
    const user = userEvent.setup();

    render(<App />);
    await user.click(screen.getByRole("button", { name: /Spin for a surprise/i }));
    fireEvent.transitionEnd(screen.getByRole("img", { name: /Prize wheel/i }));
    await user.click(screen.getByRole("button", { name: /Hide/i }));

    expect(screen.queryByText(/Stars Pajamas is ready for dress-up time/i)).not.toBeInTheDocument();
  });

  it("opens the hidden parent menu and rejects invalid save files", async () => {
    const user = userEvent.setup();

    render(<App />);

    const hotspot = screen.getByRole("button", { name: /open parent menu/i });
    await user.click(hotspot);
    await user.click(hotspot);
    await user.click(hotspot);
    await user.click(hotspot);

    expect(screen.getByRole("dialog", { name: /parent menu/i })).toBeInTheDocument();

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const badFile = new File(["not valid json"], "broken-save.json", {
      type: "application/json"
    });

    await user.upload(fileInput, badFile);

    expect(screen.getByText(/could not be loaded/i)).toBeInTheDocument();
  });

  it("can export a save file through the parent menu", async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.fn(() => "blob:otterflop");
    const revokeObjectURL = vi.fn();
    const urlState = globalThis.URL;
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);

    Object.defineProperty(globalThis, "URL", {
      configurable: true,
      value: { ...urlState, createObjectURL, revokeObjectURL }
    });

    render(<App />);

    const hotspot = screen.getByRole("button", { name: /open parent menu/i });
    await user.click(hotspot);
    await user.click(hotspot);
    await user.click(hotspot);
    await user.click(hotspot);
    await user.click(screen.getByRole("button", { name: /Export save file/i }));

    expect(createObjectURL).toHaveBeenCalled();

    Object.defineProperty(globalThis, "URL", {
      configurable: true,
      value: urlState
    });
    clickSpy.mockRestore();
  });

  it("can import a valid save file through the parent menu", async () => {
    const user = userEvent.setup();

    render(<App />);

    const hotspot = screen.getByRole("button", { name: /open parent menu/i });
    await user.click(hotspot);
    await user.click(hotspot);
    await user.click(hotspot);
    await user.click(hotspot);

    const importedSave = createInitialSave(new Date("2026-05-15T20:00:00Z"));
    importedSave.unlockedOutfitIds.push("outfit-pajamas-stars");
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const goodFile = new File([exportSaveToJson(importedSave)], "otterflop-save.json", {
      type: "application/json"
    });
    const originalText = (goodFile as File & { text?: () => Promise<string> }).text;
    Object.defineProperty(File.prototype, "text", {
      configurable: true,
      value: vi.fn().mockResolvedValue(exportSaveToJson(importedSave))
    });

    await user.upload(fileInput, goodFile);

    expect(screen.queryByRole("dialog", { name: /parent menu/i })).not.toBeInTheDocument();
    expect(screen.getByText(/2 found/i)).toBeInTheDocument();
    Object.defineProperty(File.prototype, "text", {
      configurable: true,
      value: originalText
    });
  });

  it("can reset progress from the parent menu", async () => {
    const user = userEvent.setup();
    const save = createInitialSave(new Date("2026-05-15T20:00:00Z"));
    save.unlockedKidIds.push("kid-moss");
    save.bedtimeOrderKidIds = ["kid-pip", "kid-moss"];
    save.bedtimeProgress.nightlyCompletedKidIds = ["kid-pip"];
    saveGame(save);

    render(<App />);

    expect(screen.getByText(/2\/4 kids/i)).toBeInTheDocument();

    const hotspot = screen.getByRole("button", { name: /open parent menu/i });
    await user.click(hotspot);
    await user.click(hotspot);
    await user.click(hotspot);
    await user.click(hotspot);
    await user.click(screen.getByRole("button", { name: /Reset progress/i }));

    expect(screen.getByText(/1\/4 kids/i)).toBeInTheDocument();
    expect(screen.getAllByText(/of 1 tucked in tonight/i).length).toBeGreaterThan(0);
    expect(screen.queryByRole("dialog", { name: /parent menu/i })).not.toBeInTheDocument();
  });

  it("loads an existing completed bedtime and shows the reward-ready state", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-15T20:00:00Z"));

    let save = createInitialSave(new Date("2026-05-15T20:00:00Z"));

    for (let index = 0; index < 7; index += 1) {
      save = advanceKidStep(save, "kid-pip", 7, new Date("2026-05-15T20:00:00Z"));
    }

    saveGame(save);
    render(<App />);

    expect(screen.getByRole("button", { name: /Visit the bedtime room/i })).toBeInTheDocument();
    expect(screen.getByText(/A new reward is ready now/i)).toBeInTheDocument();
  });

  it("can switch between unlocked kids from the routine sidebar", async () => {
    const user = userEvent.setup();
    const save = createInitialSave(new Date("2026-05-15T20:00:00Z"));
    save.unlockedKidIds.push("kid-moss");
    save.bedtimeOrderKidIds = ["kid-pip", "kid-moss"];
    save.selectedOutfitByKidId["kid-moss"] = "outfit-pajamas-moon";
    save.bedtimeProgress.currentStepIndexByKidId["kid-moss"] = 0;
    saveGame(save);

    render(<App />);
    await user.click(screen.getByRole("button", { name: /start bedtime/i }));
    await user.click(screen.getByRole("button", { name: /Moss Still awake/i }));

    expect(screen.getByText(/Now helping Moss/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Back home/i }));
    expect(screen.getByText(/Unlocked otter kids/i)).toBeInTheDocument();
  });

  it("reveals a spin reward only after the wheel finishes animating", async () => {
    const user = userEvent.setup();

    render(<App />);
    await user.click(screen.getByRole("button", { name: /Spin for a surprise/i }));

    expect(screen.queryByText(/Stars Pajamas is ready for dress-up time/i)).not.toBeInTheDocument();

    fireEvent.transitionEnd(screen.getByRole("img", { name: /Prize wheel/i }));

    await waitFor(() => {
      expect(screen.getByText(/Stars Pajamas is ready for dress-up time/i)).toBeInTheDocument();
    });
  });
});
