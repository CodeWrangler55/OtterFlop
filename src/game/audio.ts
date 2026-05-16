export type LullabyPlaybackResult = {
  mode: "audio" | "silent";
  durationMs: number;
};

type LullabyPlaybackOptions = {
  audioContext?: AudioContext | null;
  volume?: number;
  noteDurationMs?: number;
  gapDurationMs?: number;
};

const DEFAULT_NOTES = [523.25, 659.25, 587.33, 523.25];
const DEFAULT_NOTE_DURATION_MS = 260;
const DEFAULT_GAP_DURATION_MS = 40;
const DEFAULT_VOLUME = 0.12;

function getAudioContextConstructor():
  | (new () => AudioContext)
  | undefined {
  const contextWindow = globalThis as typeof globalThis & {
    webkitAudioContext?: new () => AudioContext;
  };

  return contextWindow.AudioContext ?? contextWindow.webkitAudioContext;
}

export async function playLullabyMelody({
  audioContext,
  volume = DEFAULT_VOLUME,
  noteDurationMs = DEFAULT_NOTE_DURATION_MS,
  gapDurationMs = DEFAULT_GAP_DURATION_MS
}: LullabyPlaybackOptions = {}): Promise<LullabyPlaybackResult> {
  const AudioContextConstructor = getAudioContextConstructor();

  if (!audioContext && !AudioContextConstructor) {
    return { mode: "silent", durationMs: 0 };
  }

  const context = audioContext ?? new AudioContextConstructor!();

  if (context.state === "suspended") {
    await context.resume();
  }

  const stepSeconds = (noteDurationMs + gapDurationMs) / 1_000;
  const noteDurationSeconds = noteDurationMs / 1_000;
  const totalDurationMs =
    DEFAULT_NOTES.length * noteDurationMs +
    Math.max(0, DEFAULT_NOTES.length - 1) * gapDurationMs;
  const startAt = context.currentTime;

  DEFAULT_NOTES.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const noteStart = startAt + index * stepSeconds;
    const fadeOutAt = noteStart + Math.max(0.08, noteDurationSeconds - 0.02);

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(0.0001, noteStart);
    gain.gain.linearRampToValueAtTime(volume, noteStart + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, fadeOutAt);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(noteStart);
    oscillator.stop(noteStart + noteDurationSeconds);
  });

  return { mode: "audio", durationMs: totalDurationMs };
}
