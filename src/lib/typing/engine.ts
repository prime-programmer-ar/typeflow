// Pure typing-engine logic: test config, word generation, stats math.

import {
  applyPunctuation,
  makeWordStream,
  randomNumberWord,
} from "./words";
import { buildRealWorldWords, pickQuote } from "./sentences";
import type {
  QuoteLength,
  RealWorldCategory,
  Sample,
  SessionCounters,
  SessionStats,
  Settings,
  TestMode,
} from "./types";

export interface TestConfig {
  mode: TestMode;
  /** seconds for time mode, word count for words/realworld/custom/quote, null for zen */
  amount: number | null;
  /** stable label used for PB keys, e.g. "time 30" */
  label: string;
  punctuation: boolean;
  numbers: boolean;
  quoteSource?: string;
}

export interface BuiltTest {
  words: string[];
  config: TestConfig;
}

function decorateWords(raw: string[], punctuation: boolean, numbers: boolean): string[] {
  const n = raw.length;
  return raw.map((w, i) => {
    let word = w;
    if (numbers && Math.random() < 0.07) {
      word = randomNumberWord();
    }
    if (punctuation) {
      word = applyPunctuation(word, i === 0, i === n - 1);
    }
    return word;
  });
}

function categoriesFrom(
  cat: RealWorldCategory | "mixed"
): RealWorldCategory[] {
  if (cat !== "mixed") return [cat];
  return ["everyday", "tech", "literature", "movies", "idioms", "business"];
}

export const CUSTOM_WORD_CAP = 500;

/** Build the initial word list + frozen config for a new test. */
export function buildTest(settings: Settings, customText?: string): BuiltTest {
  const { mode, punctuation, numbers } = settings;
  switch (mode) {
    case "time": {
      const amount = Math.max(1, Math.min(3600, Math.round(settings.timeAmount)));
      const stream = makeWordStream();
      const raw = Array.from({ length: 220 }, () => stream());
      return {
        words: decorateWords(raw, punctuation, numbers),
        config: { mode, amount, label: `time ${amount}`, punctuation, numbers },
      };
    }
    case "words": {
      const amount = Math.max(1, Math.min(1000, Math.round(settings.wordsAmount)));
      const stream = makeWordStream();
      const raw = Array.from({ length: amount }, () => stream());
      return {
        words: decorateWords(raw, punctuation, numbers),
        config: { mode, amount, label: `words ${amount}`, punctuation, numbers },
      };
    }
    case "quote": {
      const len: QuoteLength = settings.quoteLength;
      const q = pickQuote(len);
      const words = q.text.trim().split(/\s+/);
      return {
        words,
        config: {
          mode,
          amount: words.length,
          label: `quote ${len}`,
          punctuation: true,
          numbers: false,
          quoteSource: q.source,
        },
      };
    }
    case "realworld": {
      const amount = Math.max(
        5,
        Math.min(300, Math.round(settings.realWorldAmount))
      );
      const cats = categoriesFrom(settings.realWorldCategory);
      const words = buildRealWorldWords(cats, amount);
      const labelCat =
        settings.realWorldCategory === "mixed"
          ? "mixed"
          : settings.realWorldCategory;
      return {
        words,
        config: {
          mode,
          amount: words.length,
          label: `realworld ${labelCat}`,
          punctuation: true,
          numbers: false,
        },
      };
    }
    case "custom": {
      const text = (customText ?? "").trim();
      const words = text.split(/\s+/).filter(Boolean).slice(0, CUSTOM_WORD_CAP);
      return {
        words: words.length > 0 ? words : ["the", "quick", "brown", "fox"],
        config: {
          mode,
          amount: words.length,
          label: "custom",
          punctuation: true,
          numbers: false,
        },
      };
    }
    case "zen":
      return {
        words: [],
        config: { mode, amount: null, label: "zen", punctuation, numbers },
      };
  }
}

/** Extra words for time mode when the buffer runs low. */
export function extendWords(count: number, punctuation: boolean, numbers: boolean): string[] {
  const stream = makeWordStream();
  const raw = Array.from({ length: count }, () => stream());
  return decorateWords(raw, punctuation, numbers);
}

// ---------- stats ----------

export function cumulativeWpm(counters: SessionCounters, elapsedMs: number): number {
  const min = Math.max(elapsedMs / 60000, 1 / 60000);
  return (counters.correct + counters.spaces) / 5 / min;
}

export function liveRaw(counters: SessionCounters, elapsedMs: number): number {
  const min = Math.max(elapsedMs / 60000, 1 / 60000);
  const presses =
    counters.correct + counters.incorrect + counters.extra + counters.spaces;
  return presses / 5 / min;
}

function smooth(values: number[]): number[] {
  if (values.length < 3) return values;
  return values.map((v, i, arr) => {
    if (i === 0) return (v + arr[1]) / 2;
    if (i === arr.length - 1) return (v + arr[i - 1]) / 2;
    return (arr[i - 1] + v + arr[i + 1]) / 3;
  });
}

export function computeStats(
  counters: SessionCounters,
  samples: Sample[],
  startedAt: number,
  endedAt: number
): SessionStats {
  const elapsed = Math.max(endedAt - startedAt, 250);
  const min = elapsed / 60000;
  const correctTotal = counters.correct + counters.spaces;
  const presses =
    counters.correct + counters.incorrect + counters.extra + counters.spaces;
  const wpm = correctTotal / 5 / min;
  const raw = presses / 5 / min;
  const acc = presses === 0 ? 100 : (correctTotal / presses) * 100;

  const raws = smooth(samples.map((s) => s.raw).filter((r) => r > 0));
  let consistency = 100;
  if (raws.length >= 3) {
    const mean = raws.reduce((a, b) => a + b, 0) / raws.length;
    if (mean > 0) {
      const variance =
        raws.reduce((acc2, v) => acc2 + (v - mean) ** 2, 0) / raws.length;
      const cv = Math.sqrt(variance) / mean;
      consistency = Math.max(0, Math.min(100, (1 - cv) * 100));
    }
  }
  return {
    wpm: Math.max(0, wpm),
    raw: Math.max(0, raw),
    acc: Math.max(0, Math.min(100, acc)),
    consistency,
  };
}

/** Human friendly label: "time 30" -> "Time · 30s" (strips PB flags like ":p") */
export function prettyModeLabel(label: string): string {
  const raw = label.split(":")[0];
  const [mode, ...rest] = raw.split(" ");
  const param = rest.join(" ");
  const names: Record<string, string> = {
    time: "Time",
    words: "Words",
    quote: "Quote",
    realworld: "Real World",
    custom: "Custom",
    zen: "Zen",
  };
  const name = names[mode] ?? mode;
  if (!param) return name;
  if (mode === "time") return `${name} · ${param}s`;
  if (mode === "words") return `${name} · ${param}`;
  return `${name} · ${param}`;
}
