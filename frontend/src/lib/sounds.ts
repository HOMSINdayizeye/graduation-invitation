// Short feedback sounds served from /public/sounds, so they ship with the build on any host.
export type SoundName = "confirm" | "error";

const SOURCES: Record<SoundName, string> = {
  confirm: "/sounds/feedback-confirm.mp3",
  error: "/sounds/feedback-error.mp3",
};

const cache: Partial<Record<SoundName, HTMLAudioElement>> = {};

const load = (name: SoundName) => {
  if (typeof Audio === "undefined") return null;
  if (!cache[name]) {
    const audio = new Audio(SOURCES[name]);
    audio.preload = "auto";
    audio.volume = 0.6;
    cache[name] = audio;
  }
  return cache[name]!;
};

// Plays from the start every time; browsers may block playback before the first user gesture, which is ignored.
export const playSound = (name: SoundName) => {
  const audio = load(name);
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
};

// Warms the cache so the first play has no network delay.
export const preloadSounds = () => (Object.keys(SOURCES) as SoundName[]).forEach(load);
