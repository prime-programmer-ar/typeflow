// ---------- TypeFlow core types ----------

export type TestMode = "time" | "words" | "quote" | "realworld" | "custom" | "zen";

export type QuoteLength = "short" | "medium" | "long" | "all";

export type RealWorldCategory =
  | "everyday"
  | "tech"
  | "literature"
  | "movies"
  | "idioms"
  | "business";

export type TypingFont = "jetbrains" | "roboto" | "plex";

export type CaretStyle = "line" | "block" | "underline";

export interface Settings {
  // appearance
  theme: string;
  typingFont: TypingFont;
  fontSize: number; // px, 20 - 40
  caretStyle: CaretStyle;
  smoothCaret: boolean;
  showLiveWpm: boolean;
  showLiveChart: boolean;
  paceCaret: boolean;
  // behavior
  punctuation: boolean;
  numbers: boolean;
  stopOnError: boolean;
  blindMode: boolean;
  // sound
  soundEnabled: boolean;
  volume: number; // 0 - 100
  // defaults
  mode: TestMode;
  timeAmount: number; // seconds
  wordsAmount: number;
  quoteLength: QuoteLength;
  realWorldCategory: RealWorldCategory | "mixed";
  realWorldAmount: number; // target words
}

/** One point of the live per-second chart. */
export interface Sample {
  t: number; // second index
  wpm: number; // net wpm at this point (cumulative)
  raw: number; // raw wpm of this second
  errors: number; // errors made during this second
}

export interface ResultRecord {
  id: string;
  at: number; // epoch ms
  mode: TestMode;
  modeLabel: string; // e.g. "time 30", "words 50", "quote · medium", "real world · tech"
  wpm: number;
  raw: number;
  acc: number; // 0-100
  consistency: number; // 0-100
  correct: number;
  incorrect: number;
  extra: number;
  missed: number;
  durationSec: number;
  punctuation: boolean;
  numbers: boolean;
  samples: Sample[];
}

export interface PersonalBest {
  wpm: number;
  acc: number;
  at: number;
}

/** char -> { c: correct presses, i: incorrect presses } */
export interface KeyStats {
  [key: string]: { c: number; i: number };
}

export interface AppData {
  version: number;
  settings: Settings;
  results: ResultRecord[]; // newest first, capped
  pbs: Record<string, PersonalBest>;
  keyStats: KeyStats;
  activity: Record<string, { count: number; seconds: number }>; // "YYYY-MM-DD"
  streak: { current: number; longest: number; lastDay: string | null };
  firstUse: number;
}

// ---------- session runtime types ----------

export interface WordState {
  word: string;
  typed: string;
  submitted: boolean; // user moved past this word
  wasCorrect: boolean; // fully correct when submitted
  missedAtSubmit: number; // chars missed when the word was submitted (for undo)
}

export type SessionStatus = "idle" | "running" | "done";

/** Final computed statistics for a finished test. */
export interface SessionStats {
  wpm: number;
  raw: number;
  acc: number; // 0-100
  consistency: number; // 0-100
}

export interface SessionCounters {
  correct: number;
  incorrect: number;
  extra: number;
  missed: number;
  spaces: number; // correct spaces submitted
}
