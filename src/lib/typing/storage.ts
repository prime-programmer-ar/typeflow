// Local-first persistence. Everything lives in the browser's localStorage —
// no account, no server, no tracking. Users can export/import a JSON backup
// to move progress between browsers or devices.

import type {
  AppData,
  PersonalBest,
  ResultRecord,
  Settings,
} from "./types";

export const STORAGE_KEY = "typeflow.v1";
const DATA_VERSION = 1;
const MAX_RESULTS = 400;

export const DEFAULT_SETTINGS: Settings = {
  theme: "ember",
  typingFont: "jetbrains",
  fontSize: 28,
  caretStyle: "line",
  smoothCaret: true,
  showLiveWpm: true,
  showLiveChart: false,
  paceCaret: false,
  punctuation: false,
  numbers: false,
  stopOnError: false,
  blindMode: false,
  soundEnabled: false,
  volume: 40,
  mode: "time",
  timeAmount: 30,
  wordsAmount: 25,
  quoteLength: "medium",
  realWorldCategory: "mixed",
  realWorldAmount: 25,
};

export function defaultData(): AppData {
  return {
    version: DATA_VERSION,
    settings: { ...DEFAULT_SETTINGS },
    results: [],
    pbs: {},
    keyStats: {},
    activity: {},
    streak: { current: 0, longest: 0, lastDay: null },
    firstUse: Date.now(),
  };
}

/** Local (not UTC) YYYY-MM-DD for activity keys. */
export function localDay(ts: number = Date.now()): string {
  const d = new Date(ts);
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const da = new Date(ay, am - 1, ad).getTime();
  const db = new Date(by, bm - 1, bd).getTime();
  return Math.round((db - da) / 86400000);
}

function computeStreak(
  activity: AppData["activity"],
  prev: AppData["streak"]
): AppData["streak"] {
  const today = localDay();
  const days = Object.keys(activity).sort();
  if (days.length === 0) return prev;

  // current streak: walk back from today (or yesterday if today empty so far)
  let anchor = today;
  if (!activity[today]) {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    anchor = localDay(y.getTime());
    if (!activity[anchor]) return { ...prev, current: 0 };
  }
  let current = 0;
  let cursor = new Date(anchor);
  while (activity[localDay(cursor.getTime())]) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // longest streak: scan all active days
  let longest = current;
  let run = 0;
  let prevDay: string | null = null;
  for (const d of days) {
    if (prevDay !== null && daysBetween(prevDay, d) === 1) run++;
    else run = 1;
    if (run > longest) longest = run;
    prevDay = d;
  }
  return { current, longest: Math.max(longest, prev.longest), lastDay: today };
}

function migrate(raw: unknown): AppData {
  const base = defaultData();
  if (!raw || typeof raw !== "object") return base;
  const data = raw as Partial<AppData>;
  const merged: AppData = {
    ...base,
    ...data,
    settings: { ...base.settings, ...(data.settings ?? {}) },
    results: Array.isArray(data.results) ? data.results.slice(0, MAX_RESULTS) : [],
    pbs: data.pbs && typeof data.pbs === "object" ? data.pbs : {},
    keyStats: data.keyStats && typeof data.keyStats === "object" ? data.keyStats : {},
    activity: data.activity && typeof data.activity === "object" ? data.activity : {},
    streak: data.streak ?? base.streak,
    version: DATA_VERSION,
  };
  return merged;
}

export function loadData(): AppData {
  if (typeof window === "undefined") return defaultData();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    return migrate(JSON.parse(raw));
  } catch {
    return defaultData();
  }
}

export function saveData(data: AppData): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // quota exceeded — drop oldest results and retry once
    try {
      const trimmed = { ...data, results: data.results.slice(0, 50) };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      /* give up silently */
    }
  }
}

export function clearData(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

// ---------- personal bests ----------

/** Stable key for PB comparison, e.g. "time 60" / "words 25" / "quote medium:p". */
export function pbKeyFor(r: {
  mode: string;
  modeLabel: string;
  punctuation: boolean;
  numbers: boolean;
}): string {
  const flags = [r.punctuation ? "p" : "", r.numbers ? "n" : ""]
    .filter(Boolean)
    .join("");
  return `${r.modeLabel}${flags ? ":" + flags : ""}`;
}

export interface AddResultOutcome {
  data: AppData;
  isPb: boolean;
  previousPb: PersonalBest | null;
}

/** Pure function: fold a finished result into app data. */
export function addResultToData(
  data: AppData,
  result: ResultRecord,
  sessionKeyStats: Record<string, { c: number; i: number }>
): AddResultOutcome {
  const key = pbKeyFor(result);
  const previousPb = data.pbs[key] ?? null;
  const isPb = result.wpm > 0 && (!previousPb || result.wpm > previousPb.wpm);

  const results = [result, ...data.results].slice(0, MAX_RESULTS);

  const keyStats: AppData["keyStats"] = { ...data.keyStats };
  for (const [ch, s] of Object.entries(sessionKeyStats)) {
    const cur = keyStats[ch] ?? { c: 0, i: 0 };
    keyStats[ch] = { c: cur.c + s.c, i: cur.i + s.i };
  }

  const day = localDay(result.at);
  const prevAct = data.activity[day] ?? { count: 0, seconds: 0 };
  const activity = {
    ...data.activity,
    [day]: {
      count: prevAct.count + 1,
      seconds: prevAct.seconds + Math.round(result.durationSec),
    },
  };

  const pbs = { ...data.pbs };
  if (isPb) {
    pbs[key] = { wpm: result.wpm, acc: result.acc, at: result.at };
  }

  const next: AppData = {
    ...data,
    results,
    keyStats,
    activity,
    pbs,
    streak: computeStreak(activity, data.streak),
  };
  return { data: next, isPb, previousPb };
}

// ---------- export / import ----------

export function exportToFile(data: AppData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const d = new Date();
  const stamp = `${d.getFullYear()}${`${d.getMonth() + 1}`.padStart(2, "0")}${`${d.getDate()}`.padStart(2, "0")}`;
  a.href = url;
  a.download = `typeflow-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function parseImport(text: string): AppData {
  const parsed = JSON.parse(text);
  return migrate(parsed);
}
