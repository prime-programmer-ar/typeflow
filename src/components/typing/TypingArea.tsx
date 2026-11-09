"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  memo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { cumulativeWpm } from "@/lib/typing/engine";
import type { Settings, WordState } from "@/lib/typing/types";
import type { TypingSession } from "@/hooks/useTypingSession";
import { LiveChart } from "./LiveChart";
import { RotateCcw, CheckCircle2 } from "lucide-react";

// ---------- word rendering ----------

interface WordProps {
  wi: number;
  word: string;
  typed: string;
  blind: boolean;
  zen: boolean;
  flaw: "none" | "flawed" | "flawless";
}

const Word = memo(function Word({ wi, word, typed, blind, zen, flaw }: WordProps) {
  const target = word;
  const letters = target.split("");
  const extras = typed.length > target.length ? typed.slice(target.length) : "";

  return (
    <span
      data-w={wi}
      className={cn(
        "tf-word",
        flaw === "flawed" && !blind && "flawed",
        flaw === "flawless" && "flawless"
      )}
    >
      {letters.map((ch, li) => {
        const typedChar = li < typed.length ? typed[li] : null;
        let cls = "tf-lt";
        if (typedChar !== null) {
          if (blind || zen) cls += " tf-lt-correct";
          else cls += typedChar === ch ? " tf-lt-correct" : " tf-lt-incorrect";
        }
        return (
          <span key={li} data-pos={`${wi}:${li}`} className={cls}>
            {ch}
          </span>
        );
      })}
      {extras.split("").map((ch, i) => (
        <span
          key={`e${i}`}
          data-pos={`${wi}:${target.length + i}`}
          className={cn("tf-lt", blind || zen ? "tf-lt-correct" : "tf-lt-extra")}
        >
          {ch}
        </span>
      ))}
    </span>
  );
});

// ---------- helpers ----------

interface Pos {
  x: number;
  y: number;
  w: number;
  h: number;
}

function locateCharCount(words: WordState[], count: number): { wi: number; li: number } {
  let remaining = count;
  for (let i = 0; i < words.length; i++) {
    const len = words[i].word.length + 1;
    if (remaining < len) return { wi: i, li: remaining };
    remaining -= len;
  }
  const last = words.length - 1;
  return { wi: last, li: Math.max(0, words[last]?.word.length ?? 0) };
}

// ---------- component ----------

interface TypingAreaProps {
  session: TypingSession;
  settings: Settings;
  paceWpm: number | null;
  focusRef?: React.RefObject<(() => void) | null>;
}

export function TypingArea({ session, settings, paceWpm, focusRef }: TypingAreaProps) {
  const { words, index, input, status, config, counters, startedAt, samples, liveTick } = session;
  const innerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);
  const ghostRef = useRef<HTMLSpanElement>(null);
  const blinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [focused, setFocused] = useState(false);

  const isZen = config.mode === "zen";
  const isTime = config.mode === "time";

  // ---------- measurement (direct DOM — no re-render) ----------

  const measureAt = useCallback((wi: number, li: number): Pos | null => {
    const inner = innerRef.current;
    if (!inner) return null;
    const wordEl = inner.querySelector<HTMLElement>(`[data-w="${wi}"]`);
    if (!wordEl) return null;
    const innerRect = inner.getBoundingClientRect();
    const letterEl = inner.querySelector<HTMLElement>(`[data-pos="${wi}:${li}"]`);
    let rect: DOMRect;
    let x: number;
    let w: number;
    if (letterEl) {
      rect = letterEl.getBoundingClientRect();
      x = rect.left - innerRect.left;
      w = rect.width;
    } else {
      rect = wordEl.getBoundingClientRect();
      x = (li === 0 ? rect.left : rect.right) - innerRect.left;
      w = Math.max(8, rect.width / Math.max(1, (wordEl.textContent ?? "x").length));
    }
    return { x, y: rect.top - innerRect.top, w, h: rect.height };
  }, []);

  const lineOffsetFor = useCallback((y: number): number => {
    const inner = innerRef.current;
    if (!inner) return 0;
    const lineHeight = parseFloat(getComputedStyle(inner).lineHeight) || 40;
    const lineIdx = Math.round(y / lineHeight);
    return Math.max(0, lineIdx - 1) * lineHeight;
  }, []);

  const applyCaret = useCallback(() => {
    const caret = caretRef.current;
    const inner = innerRef.current;
    if (!caret || !inner) return;
    const pos = measureAt(index, input.length);
    if (!pos) return;

    const offset = lineOffsetFor(pos.y);
    inner.style.transform = `translateY(-${offset}px)`;

    let width = "3px";
    let height = `${pos.h}px`;
    let yAdjust = 2;
    if (settings.caretStyle === "block") {
      width = `${Math.max(8, pos.w)}px`;
      yAdjust = 1;
    } else if (settings.caretStyle === "underline") {
      width = `${Math.max(10, pos.w * 0.9)}px`;
      height = "3.5px";
      yAdjust = pos.h - 4.5;
    }
    caret.style.width = width;
    caret.style.height = height;
    caret.style.transform = `translate3d(${pos.x}px, ${pos.y - offset + yAdjust}px, 0)`;

    // restart blink idle timer
    caret.classList.remove("idle");
    if (blinkTimer.current) clearTimeout(blinkTimer.current);
    blinkTimer.current = setTimeout(() => caret.classList.add("idle"), 700);
  }, [index, input.length, measureAt, lineOffsetFor, settings.caretStyle]);

  useLayoutEffect(() => {
    applyCaret();
  }, [applyCaret, words.length, settings.typingFont, settings.fontSize, settings.theme]);

  useEffect(() => {
    const bump = () => applyCaret();
    window.addEventListener("resize", bump);
    const ready = document.fonts?.ready?.then(bump).catch(() => {});
    return () => {
      window.removeEventListener("resize", bump);
      void ready;
    };
  }, [applyCaret]);

  useEffect(
    () => () => {
      if (blinkTimer.current) clearTimeout(blinkTimer.current);
    },
    []
  );

  // pace caret ghost (direct DOM)
  useLayoutEffect(() => {
    const el = ghostRef.current;
    if (!el) return;
    const active =
      settings.paceCaret && paceWpm && status === "running" && startedAt && !isZen;
    if (!active) {
      el.style.display = "none";
      return;
    }
    const elapsedMin = Math.max(0, (liveTick - startedAt) / 60000);
    const budget = Math.floor(paceWpm * 5 * elapsedMin);
    const loc = locateCharCount(words, budget);
    const pos = measureAt(loc.wi, loc.li);
    if (!pos) {
      el.style.display = "none";
      return;
    }
    const offset = lineOffsetFor(pos.y);
    el.style.display = "block";
    el.style.width = `${Math.max(8, pos.w)}px`;
    el.style.height = `${pos.h}px`;
    el.style.transform = `translate3d(${pos.x}px, ${pos.y - offset + 1}px, 0)`;
  }, [liveTick, settings.paceCaret, paceWpm, status, startedAt, words, isZen, measureAt, lineOffsetFor]);

  // focus the hidden input
  useEffect(() => {
    inputRef.current?.focus();
  }, [config, status]);

  // expose focus function to parent (used by global shortcuts)
  useEffect(() => {
    if (!focusRef) return;
    focusRef.current = () => inputRef.current?.focus();
    return () => {
      focusRef.current = null;
    };
  }, [focusRef]);

  useEffect(() => {
    const focusInput = () => {
      if (document.activeElement !== inputRef.current) inputRef.current?.focus();
    };
    // real controls that must keep the browser's default focus behavior
    const REAL_CONTROLS =
      "a[href], input:not([data-typing-input]), textarea, select, [contenteditable='true'], [role='dialog'], [role='menu'], [role='listbox'], [role='option'], [data-radix-popper-content-wrapper], [data-no-focus]";
    // elements focus may legitimately rest on after widget closures (steal it back)
    const RECLAIMABLE =
      "input:not([data-typing-input]), textarea, select, [contenteditable='true'], [role='dialog'], [role='menu'], [role='listbox'], [role='option'], [data-radix-popper-content-wrapper], a[href], [data-no-focus]";
    let lastPointerAt = 0;

    // clicking / tapping ANYWHERE on the page focuses the typing input.
    // preventDefault stops the browser from stealing focus to body/buttons,
    // while click events (and therefore all button actions) still fire.
    const onMouseDown = (e: MouseEvent) => {
      lastPointerAt = Date.now();
      if (e.button !== 0) return; // only the primary button
      const t = e.target as HTMLElement;
      if (t.closest?.(REAL_CONTROLS)) return;
      e.preventDefault();
      focusInput();
    };
    // after UI widgets close (radix returns focus to their triggers),
    // hand focus back to the typing input — only for pointer-initiated focus
    const onFocusIn = (e: FocusEvent) => {
      if (Date.now() - lastPointerAt > 500) return; // keyboard nav: leave focus alone
      const t = e.target as HTMLElement;
      if (t === inputRef.current || t.closest?.(RECLAIMABLE)) return;
      focusInput();
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, []);

  // ---------- input handling ----------

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey || e.metaKey || e.altKey) {
      if (e.key === "Enter" && isZen) {
        e.preventDefault();
        session.finishManual();
      }
      return;
    }
    if (
      e.key === "Tab" ||
      e.key === "Escape" ||
      e.key === "Shift" ||
      e.key === "Enter" ||
      e.key === "Control" ||
      e.key === "Meta"
    ) {
      if (e.key === "Enter") e.preventDefault();
      return; // handled globally
    }
    if (e.key.length === 1 || e.key === "Backspace") {
      e.preventDefault();
      session.handleKey(e.key);
    }
  };

  const onBeforeInput = (e: React.FormEvent<HTMLInputElement>) => {
    const ev = e.nativeEvent as InputEvent;
    e.preventDefault();
    if (ev.inputType === "insertText" && ev.data) {
      for (const ch of ev.data) session.handleKey(ch);
    } else if (
      ev.inputType === "deleteContentBackward" ||
      ev.inputType === "deleteWordBackward" ||
      ev.inputType === "deleteContent"
    ) {
      session.handleKey("Backspace");
    }
  };

  // ---------- live displays ----------

  const elapsedMs = startedAt ? liveTick - startedAt : 0;
  const secondsLeft =
    isTime && config.amount
      ? Math.max(0, Math.ceil((config.amount * 1000 - elapsedMs) / 1000))
      : 0;
  const liveWpm = startedAt ? Math.round(cumulativeWpm(counters, elapsedMs)) : 0;

  const fontClass =
    settings.typingFont === "roboto"
      ? "tf-font-roboto"
      : settings.typingFont === "plex"
        ? "tf-font-plex"
        : "tf-font-jetbrains";

  const caretClass = cn(
    "tf-caret",
    `tf-caret--${settings.caretStyle}`,
    settings.smoothCaret && "tf-caret--smooth"
  );

  return (
    <section
      aria-label="Typing test"
      className={cn(
        "relative w-full outline-none",
        !focused && status !== "done" && "tf-unfocused"
      )}
    >
      {/* live timer / wpm */}
      <div className="mb-3 flex h-8 items-center justify-end" aria-live="off">
        {status === "running" && (
          <span
            className={cn(
              "font-mono text-2xl font-semibold tabular-nums text-primary",
              isTime && secondsLeft <= 5 && "animate-pulse"
            )}
          >
            {isTime ? `${secondsLeft}` : settings.showLiveWpm ? `${liveWpm} wpm` : ""}
          </span>
        )}
        {status === "idle" && isZen && (
          <span className="text-sm text-muted-foreground">zen mode — type freely</span>
        )}
      </div>

      {/* words viewport */}
      <div
        className="relative overflow-hidden"
        style={
          {
            "--tf-fs": `${settings.fontSize}px`,
            "--tf-lh": "1.7",
            height: "calc(var(--tf-fs) * var(--tf-lh) * 3)",
          } as React.CSSProperties
        }
      >
        <div
          ref={innerRef}
          className={cn(
            "tf-words flex flex-wrap gap-x-[1ch] gap-y-0 transition-transform duration-150 ease-out",
            fontClass
          )}
          aria-hidden="true"
        >
          {words.map((w, wi) => (
            <Word
              key={wi}
              wi={wi}
              word={w.word}
              typed={wi === index ? input : w.typed}
              blind={settings.blindMode}
              zen={isZen}
              flaw={
                wi < index && !settings.blindMode
                  ? w.wasCorrect
                    ? "flawless"
                    : "flawed"
                  : "none"
              }
            />
          ))}
        </div>

        {/* pace ghost + caret (positioned via refs) */}
        <span ref={ghostRef} className="tf-caret tf-caret--ghost" style={{ display: "none" }} />
        <span ref={caretRef} className={caretClass} />

        {/* invisible input that captures keystrokes (also opens mobile keyboards) */}
        <input
          ref={inputRef}
          data-typing-input
          aria-label="Typing input"
          className="absolute inset-0 z-20 h-full w-full cursor-text bg-transparent text-transparent opacity-0"
          style={{ fontSize: "16px", caretColor: "transparent" }}
          onKeyDown={onKeyDown}
          onBeforeInput={onBeforeInput}
          onInput={(e) => {
            (e.target as HTMLInputElement).value = "";
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          inputMode="text"
          readOnly={status === "done"}
        />

        {/* focus overlay */}
        {!focused && status !== "done" && (
          <button
            className="absolute inset-0 z-30 flex items-center justify-center bg-background/30 backdrop-blur-[1px]"
            onClick={() => inputRef.current?.focus()}
            aria-label="Focus typing area"
          >
            <span className="rounded-lg border border-border/60 bg-card/90 px-4 py-2 text-sm text-muted-foreground shadow-lg">
              Click anywhere or press any key to focus
            </span>
          </button>
        )}
      </div>

      {/* live chart */}
      {status === "running" && settings.showLiveChart && samples.length > 0 && (
        <div className="mt-4 opacity-90">
          <LiveChart samples={samples} theme={settings.theme} compact />
        </div>
      )}

      {/* bottom row */}
      <div className="mt-6 flex items-center justify-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={session.restartSame}
          className="gap-2 text-muted-foreground hover:text-foreground"
          aria-label="Restart test"
        >
          <RotateCcw className="size-4" />
          <span className="text-sm">restart</span>
          <kbd className="ml-1 rounded border border-border bg-secondary/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
            esc
          </kbd>
        </Button>
        <span className="hidden items-center gap-2 text-xs text-muted-foreground/70 sm:flex">
          <kbd className="rounded border border-border bg-secondary/60 px-1.5 py-0.5">tab</kbd>
          new test
        </span>
        {isZen && status === "running" && (
          <Button variant="outline" size="sm" onClick={session.finishManual} className="gap-2">
            <CheckCircle2 className="size-4" />
            finish session
          </Button>
        )}
      </div>
    </section>
  );
}
