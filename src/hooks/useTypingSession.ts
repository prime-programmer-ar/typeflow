"use client";

// The typing session engine: a reducer-driven state machine that tracks
// words, keystrokes, live samples, and produces finished results.

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import {
  buildTest,
  computeStats,
  extendWords,
  type TestConfig,
} from "@/lib/typing/engine";
import type {
  KeyStats,
  ResultRecord,
  Sample,
  SessionCounters,
  SessionStatus,
  Settings,
  WordState,
} from "@/lib/typing/types";

import { playClick, playError } from "@/lib/typing/sound";

const EXTRA_CHAR_CAP = 8;
const FINITE_MODES = ["words", "quote", "realworld", "custom"];

interface EngineState {
  words: WordState[];
  index: number;
  input: string;
  status: SessionStatus;
  startedAt: number | null;
  endedAt: number | null;
  counters: SessionCounters;
  keyStats: KeyStats;
  samples: Sample[];
  errorsSinceSample: number;
  charsSinceSample: number;
  lastSampleSecond: number;
  config: TestConfig;
  sessionKey: number;
  record: ResultRecord | null;
}

type Action =
  | { type: "INIT"; words: string[]; config: TestConfig }
  | { type: "RESET" }
  | { type: "KEY"; char: string; now: number; stopOnError: boolean }
  | { type: "EXTEND"; words: string[] }
  | { type: "TICK"; now: number }
  | { type: "MANUAL_FINISH"; now: number };

function emptyWord(): WordState {
  return { word: "", typed: "", submitted: false, wasCorrect: false, missedAtSubmit: 0 };
}

function toWordStates(words: string[]): WordState[] {
  return words.map((w) => ({
    word: w,
    typed: "",
    submitted: false,
    wasCorrect: false,
    missedAtSubmit: 0,
  }));
}

function freshCounters(): SessionCounters {
  return { correct: 0, incorrect: 0, extra: 0, missed: 0, spaces: 0 };
}

function initState(): EngineState {
  return {
    words: [],
    index: 0,
    input: "",
    status: "idle",
    startedAt: null,
    endedAt: null,
    counters: freshCounters(),
    keyStats: {},
    samples: [],
    errorsSinceSample: 0,
    charsSinceSample: 0,
    lastSampleSecond: 0,
    config: { mode: "time", amount: 30, label: "time 30", punctuation: false, numbers: false },
    sessionKey: 0,
    record: null,
  };
}

function pushSample(s: EngineState, now: number, tOverride?: number): EngineState {
  if (!s.startedAt) return s;
  const elapsedMs = now - s.startedAt;
  const elapsedSec = elapsedMs / 1000;
  const t = tOverride ?? Math.floor(elapsedSec);
  const deltaSec = Math.max(0.1, t - s.lastSampleSecond);
  const sample: Sample = {
    t: Math.round(t * 10) / 10,
    wpm: Math.round(((s.counters.correct + s.counters.spaces) / 5 / (elapsedMs / 60000)) * 10) / 10,
    raw: Math.round((s.charsSinceSample / 5 / (deltaSec / 60)) * 10) / 10,
    errors: s.errorsSinceSample,
  };
  return {
    ...s,
    samples: [...s.samples, sample],
    lastSampleSecond: t,
    errorsSinceSample: 0,
    charsSinceSample: 0,
  };
}

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

function finishState(s: EngineState, now: number): EngineState {
  if (s.status === "done") return s;
  let next = s;
  const startedAt = next.startedAt ?? now;
  const elapsedSec = (now - startedAt) / 1000;
  if (next.startedAt && elapsedSec - next.lastSampleSecond >= 0.4) {
    next = pushSample(next, now, Math.round(elapsedSec * 10) / 10);
  }
  const stats = computeStats(next.counters, next.samples, startedAt, now);
  const record: ResultRecord = {
    id: makeId(),
    at: now,
    mode: next.config.mode,
    modeLabel: next.config.label,
    wpm: Math.round(stats.wpm * 10) / 10,
    raw: Math.round(stats.raw * 10) / 10,
    acc: Math.round(stats.acc * 10) / 10,
    consistency: Math.round(stats.consistency),
    correct: next.counters.correct,
    incorrect: next.counters.incorrect,
    extra: next.counters.extra,
    missed: next.counters.missed,
    durationSec: Math.round((now - startedAt) / 100) / 10,
    punctuation: next.config.punctuation,
    numbers: next.config.numbers,
    samples: next.samples,
  };
  return { ...next, status: "done", endedAt: now, record };
}

function submitWord(
  s: EngineState,
  input: string,
  now: number,
  stopOnError: boolean
): EngineState {
  if (s.status === "done" || input.length === 0) return s;
  const wi = s.index;
  const w = s.words[wi];
  if (!w) return s;
  const zen = s.config.mode === "zen";
  const isCorrect = zen || input === w.word;
  if (stopOnError && !isCorrect) return s;

  let st = s;
  if (st.status === "idle") st = { ...st, status: "running", startedAt: now };

  const missed = zen ? 0 : Math.max(0, w.word.length - input.length);
  const words = [...st.words];
  words[wi] = {
    ...w,
    typed: input,
    submitted: true,
    wasCorrect: isCorrect,
    missedAtSubmit: missed,
  };
  if (zen && wi === words.length - 1) words.push(emptyWord());

  const counters: SessionCounters = {
    ...st.counters,
    missed: st.counters.missed + missed,
    spaces: isCorrect ? st.counters.spaces + 1 : st.counters.spaces,
  };

  const next: EngineState = {
    ...st,
    words,
    counters,
    input: "",
    index: wi + 1,
    charsSinceSample: st.charsSinceSample + 1,
  };

  if (FINITE_MODES.includes(next.config.mode) && next.index >= words.length) {
    return finishState(next, now);
  }
  return next;
}

function reducer(state: EngineState, action: Action): EngineState {
  switch (action.type) {
    case "INIT": {
      const words =
        action.config.mode === "zen" ? [emptyWord()] : toWordStates(action.words);
      return {
        ...initState(),
        words,
        config: action.config,
        sessionKey: state.sessionKey + 1,
      };
    }
    case "RESET": {
      const words =
        state.config.mode === "zen"
          ? [emptyWord()]
          : state.words.map((w) => ({
              ...w,
              typed: "",
              submitted: false,
              wasCorrect: false,
              missedAtSubmit: 0,
            }));
      return {
        ...initState(),
        words,
        config: state.config,
        sessionKey: state.sessionKey + 1,
      };
    }
    case "EXTEND": {
      if (state.config.mode !== "time") return state;
      return { ...state, words: [...state.words, ...toWordStates(action.words)] };
    }
    case "TICK": {
      if (state.status !== "running" || !state.startedAt) return state;
      const elapsedMs = action.now - state.startedAt;
      let s = state;
      const sec = Math.floor(elapsedMs / 1000);
      if (sec > s.lastSampleSecond) {
        s = pushSample(s, action.now);
      }
      if (
        s.config.mode === "time" &&
        s.config.amount != null &&
        elapsedMs >= s.config.amount * 1000
      ) {
        return finishState(s, action.now);
      }
      return s;
    }
    case "MANUAL_FINISH": {
      if (state.status !== "running") return state;
      return finishState(state, action.now);
    }
    case "KEY": {
      const { char, now, stopOnError } = action;
      if (state.status === "done") return state;

      if (char === "Backspace") {
        if (state.input.length > 0) {
          return { ...state, input: state.input.slice(0, -1) };
        }
        // move back into previous (imperfect) word
        if (state.index === 0) return state;
        const prev = state.words[state.index - 1];
        if (!prev || !prev.submitted) return state;
        if (state.config.mode !== "zen" && prev.wasCorrect) return state;
        const words = [...state.words];
        words[state.index - 1] = { ...prev, submitted: false };
        const counters: SessionCounters = {
          ...state.counters,
          missed: Math.max(0, state.counters.missed - (prev.missedAtSubmit ?? 0)),
        };
        return {
          ...state,
          words,
          counters,
          index: state.index - 1,
          input: prev.typed,
        };
      }

      if (char === " ") {
        return submitWord(state, state.input, now, stopOnError);
      }

      if (char.length !== 1 || /\s/.test(char)) return state;

      let s = state;
      if (s.status === "idle") s = { ...s, status: "running", startedAt: now };

      const wi = s.index;
      const w = s.words[wi];
      if (!w) return s;
      const zen = s.config.mode === "zen";
      const target = w.word;
      const isExtra = !zen && s.input.length >= target.length;
      if (isExtra && s.input.length >= target.length + EXTRA_CHAR_CAP) return s;
      const isCorrect = zen || (!isExtra && char === target[s.input.length]);

      const counters = { ...s.counters };
      const keyStats: KeyStats = { ...s.keyStats };
      const ks = keyStats[char] ?? { c: 0, i: 0 };
      if (isCorrect) {
        counters.correct += 1;
        keyStats[char] = { c: ks.c + 1, i: ks.i };
      } else {
        if (isExtra) counters.extra += 1;
        else counters.incorrect += 1;
        keyStats[char] = { c: ks.c, i: ks.i + 1 };
      }

      const nextInput = s.input + char;

      // auto-finish when the last word of a finite test is completed exactly
      const w2 = s.words[wi];
      const finite = FINITE_MODES.includes(s.config.mode);
      if (
        !zen &&
        finite &&
        wi === s.words.length - 1 &&
        nextInput === w2.word
      ) {
        const withChar: EngineState = {
          ...s,
          counters,
          keyStats,
          input: nextInput,
          charsSinceSample: s.charsSinceSample + 1,
          errorsSinceSample: s.errorsSinceSample + (isCorrect ? 0 : 1),
        };
        return submitWord(withChar, nextInput, now, stopOnError);
      }

      return {
        ...s,
        input: nextInput,
        counters,
        keyStats,
        charsSinceSample: s.charsSinceSample + 1,
        errorsSinceSample: s.errorsSinceSample + (isCorrect ? 0 : 1),
      };
    }
  }
}

export interface TypingSession {
  words: WordState[];
  index: number;
  input: string;
  status: SessionStatus;
  counters: SessionCounters;
  samples: Sample[];
  config: TestConfig;
  startedAt: number | null;
  keyStats: KeyStats;
  liveTick: number;
  finished: ResultRecord | null;
  handleKey: (key: string) => void;
  restartSame: () => void;
  newTest: () => void;
  finishManual: () => void;
}

export function useTypingSession(
  settings: Settings,
  customText: string,
  customNonce: number,
  onFinish: (record: ResultRecord, keyStats: KeyStats) => void
): TypingSession {
  const [state, dispatch] = useReducer(reducer, undefined, initState);
  const [liveTick, setLiveTick] = useState(0);
  const finishGuard = useRef(-1);
  const settingsRef = useRef(settings);
  const onFinishRef = useRef(onFinish);

  // keep refs fresh (declared before the effects that read them)
  useEffect(() => {
    settingsRef.current = settings;
    onFinishRef.current = onFinish;
  });

  const newTest = useCallback(() => {
    const { words, config } = buildTest(settingsRef.current, customText);
    finishGuard.current = -1;
    dispatch({ type: "INIT", words, config });
  }, [customText]);

  const restartSame = useCallback(() => {
    finishGuard.current = -1;
    dispatch({ type: "RESET" });
  }, []);

  const finishManual = useCallback(() => {
    dispatch({ type: "MANUAL_FINISH", now: Date.now() });
  }, []);

  // regenerate whenever test-shaping settings change
  const shapeKey = [
    settings.mode,
    settings.timeAmount,
    settings.wordsAmount,
    settings.quoteLength,
    settings.realWorldCategory,
    settings.realWorldAmount,
    settings.punctuation,
    settings.numbers,
  ].join("|");
  const firstShape = useRef(true);
  useEffect(() => {
    if (firstShape.current) {
      firstShape.current = false;
    }
    newTest();
  }, [shapeKey, customText, customNonce]);

  // keep the time-mode word buffer topped up
  useEffect(() => {
    if (
      state.config.mode === "time" &&
      state.status === "running" &&
      state.words.length - state.index < 40
    ) {
      dispatch({
        type: "EXTEND",
        words: extendWords(80, state.config.punctuation, state.config.numbers),
      });
    }
  }, [state.index, state.words.length, state.config, state.status]);

  // the clock: drives timer display, samples, and time-mode finish
  useEffect(() => {
    if (state.status !== "running" || state.startedAt == null) return;
    const tick = () => {
      const now = Date.now();
      setLiveTick(now);
      dispatch({ type: "TICK", now });
    };
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [state.status, state.startedAt]);

  // notify the host app once per finished session (record is built in the reducer)
  useEffect(() => {
    if (state.status !== "done" || !state.record) return;
    if (finishGuard.current === state.sessionKey) return;
    finishGuard.current = state.sessionKey;
    onFinishRef.current(state.record, state.keyStats);
  }, [state.status, state.sessionKey, state.record, state.keyStats]);

  const handleKey = useCallback(
    (key: string) => {
      const s = state;
      const settingsNow = settingsRef.current;

      // sound (approximate correctness purely for audio feedback)
      if (settingsNow.soundEnabled && (key.length === 1 || key === "Backspace")) {
        const w = s.words[s.index];
        const zen = s.config.mode === "zen";
        let ok = true;
        if (key.length === 1 && key !== " ") {
          const target = w?.word ?? "";
          ok = zen || (s.input.length < target.length && key === target[s.input.length]);
        }
        if (ok) playClick(settingsNow.volume);
        else playError(settingsNow.volume);
      }

      if (key.length !== 1 && key !== "Backspace") return;
      dispatch({
        type: "KEY",
        char: key,
        now: Date.now(),
        stopOnError: settingsNow.stopOnError,
      });
    },
    [state]
  );

  return useMemo(
    () => ({
      words: state.words,
      index: state.index,
      input: state.input,
      status: state.status,
      counters: state.counters,
      samples: state.samples,
      config: state.config,
      startedAt: state.startedAt,
      keyStats: state.keyStats,
      liveTick,
      finished: state.record,
      handleKey,
      restartSame,
      newTest,
      finishManual,
    }),
    [state, liveTick, handleKey, restartSame, newTest, finishManual]
  );
}
