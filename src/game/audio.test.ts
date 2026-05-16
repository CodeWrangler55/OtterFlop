import { describe, expect, it, vi } from "vitest";
import { playLullabyMelody } from "./audio";

describe("playLullabyMelody", () => {
  it("returns a silent fallback when web audio is unavailable", async () => {
    const originalAudioContext = globalThis.AudioContext;
    const originalWebkitAudioContext = (
      globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext }
    ).webkitAudioContext;

    vi.stubGlobal("AudioContext", undefined);
    (
      globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext }
    ).webkitAudioContext = undefined;

    await expect(playLullabyMelody()).resolves.toEqual({
      mode: "silent",
      durationMs: 0
    });

    vi.stubGlobal("AudioContext", originalAudioContext);
    (
      globalThis as typeof globalThis & { webkitAudioContext?: typeof AudioContext }
    ).webkitAudioContext = originalWebkitAudioContext;
  });

  it("schedules the lullaby notes when an audio context is available", async () => {
    const oscillators: Array<{
      start: ReturnType<typeof vi.fn>;
      stop: ReturnType<typeof vi.fn>;
      connect: ReturnType<typeof vi.fn>;
      frequency: { value: number };
      type: string;
    }> = [];
    const gains: Array<{
      connect: ReturnType<typeof vi.fn>;
      gain: {
        setValueAtTime: ReturnType<typeof vi.fn>;
        linearRampToValueAtTime: ReturnType<typeof vi.fn>;
        exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
      };
    }> = [];

    class MockAudioContext {
      state: AudioContextState = "suspended";
      currentTime = 4;
      destination = {};

      resume = vi.fn(async () => undefined);

      createOscillator() {
        const oscillator = {
          type: "sine",
          frequency: { value: 0 },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn()
        };
        oscillators.push(oscillator);
        return oscillator;
      }

      createGain() {
        const gain = {
          connect: vi.fn(),
          gain: {
            setValueAtTime: vi.fn(),
            linearRampToValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn()
          }
        };
        gains.push(gain);
        return gain;
      }
    }

    const context = new MockAudioContext() as unknown as AudioContext;
    const result = await playLullabyMelody({ audioContext: context });

    expect(result.mode).toBe("audio");
    expect(result.durationMs).toBeGreaterThan(0);
    expect((context.resume as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalledTimes(1);
    expect(oscillators).toHaveLength(4);
    expect(gains).toHaveLength(4);
    expect(oscillators[0].frequency.value).toBe(523.25);
    expect(oscillators[3].start).toHaveBeenCalledWith(4.9);
    expect(gains[0].gain.linearRampToValueAtTime).toHaveBeenCalled();
  });
});
