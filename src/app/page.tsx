"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Header, type View } from "@/components/typing/Header";
import { ConfigBar } from "@/components/typing/ConfigBar";
import { TypingArea } from "@/components/typing/TypingArea";
import { Results } from "@/components/typing/Results";
import { StatsView } from "@/components/typing/StatsView";
import { SettingsView } from "@/components/typing/SettingsView";
import { useTypingSession } from "@/hooks/useTypingSession";
import { themeById } from "@/lib/typing/themes";
import { pbKeyFor } from "@/lib/typing/storage";
import {
  addResultToData,
  clearData,
  defaultData,
  exportToFile,
  loadData,
  parseImport,
  saveData,
} from "@/lib/typing/storage";
import type { AppData, Settings } from "@/lib/typing/types";

const CUSTOM_TEXT_KEY = "typeflow.customText";

function applyTheme(id: string) {
  document.documentElement.dataset.theme = id;
  document.documentElement.classList.toggle("dark", themeById(id).dark);
}

export default function Home() {
  const [data, setData] = useState<AppData | null>(null);
  const [view, setView] = useState<View>("test");
  const [customText, setCustomText] = useState("");
  const [customNonce, setCustomNonce] = useState(0);
  const [customOpen, setCustomOpen] = useState(false);
  const [customDraft, setCustomDraft] = useState("");
  const [resultMeta, setResultMeta] = useState<{ isPb: boolean; pbWpm: number | null }>({
    isPb: false,
    pbWpm: null,
  });
  const focusTypingRef = useRef<(() => void) | null>(null);
  const dataRef = useRef<AppData | null>(null);

  // load persisted data + custom text (deferred one tick to keep hydration stable)
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled) return;
      const loaded = loadData();
      dataRef.current = loaded;
      setData(loaded);
      applyTheme(loaded.settings.theme);
      try {
        const txt = window.localStorage.getItem(CUSTOM_TEXT_KEY);
        if (txt) setCustomText(txt);
      } catch {
        /* ignore */
      }
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  // debounced persistence
  useEffect(() => {
    if (!data) return;
    const t = setTimeout(() => saveData(data), 250);
    return () => clearTimeout(t);
  }, [data]);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    if (patch.theme) applyTheme(patch.theme);
    const prev = dataRef.current;
    if (!prev) return;
    const next = { ...prev, settings: { ...prev.settings, ...patch } };
    dataRef.current = next;
    setData(next);
  }, []);

  const settings: Settings = data?.settings ?? defaultData().settings;

  const refocusTyping = useCallback(() => focusTypingRef.current?.(), []);

  const handleFinish = useCallback(
    (record: Parameters<typeof addResultToData>[1], keyStats: Parameters<typeof addResultToData>[2]) => {
      const prev = dataRef.current;
      if (!prev) return;
      const outcome = addResultToData(prev, record, keyStats);
      dataRef.current = outcome.data;
      setData(outcome.data);
      setResultMeta({ isPb: outcome.isPb, pbWpm: outcome.previousPb?.wpm ?? null });
      if (outcome.isPb && record.wpm > 0) {
        toast({
          title: `New personal best — ${Math.round(record.wpm)} wpm`,
          description: "Keep the streak going.",
        });
      }
    },
    []
  );

  const session = useTypingSession(settings, customText, customNonce, handleFinish);

  const paceWpm =
    data?.pbs[
      pbKeyFor({
        mode: session.config.mode,
        modeLabel: session.config.label,
        punctuation: session.config.punctuation,
        numbers: session.config.numbers,
      })
    ]?.wpm ?? null;

  // global keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (customOpen) return;
      const t = e.target as HTMLElement | null;
      const target = t ?? document.body;
      const inField =
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable) &&
        !target.hasAttribute("data-typing-input");
      if (inField || (typeof target.closest === "function" && target.closest("[role='dialog']"))) return;

      if (view !== "test") return;

      if (e.key === "Tab") {
        e.preventDefault();
        session.newTest();
        focusTypingRef.current?.();
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        session.restartSame();
        focusTypingRef.current?.();
        return;
      }
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        if (session.config.mode === "zen") {
          e.preventDefault();
          session.finishManual();
        }
        return;
      }
      if (
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        !e.defaultPrevented &&
        (e.key.length === 1 || e.key === "Backspace")
      ) {
        e.preventDefault();
        focusTypingRef.current?.();
        session.handleKey(e.key);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [view, session, customOpen]);

  const openCustomDialog = useCallback(() => {
    setCustomDraft(customText || "");
    setCustomOpen(true);
  }, [customText]);

  const startCustomTest = useCallback(() => {
    const trimmed = customDraft.trim();
    if (trimmed.length === 0) return;
    setCustomText(trimmed);
    setCustomNonce((n) => n + 1);
    try {
      window.localStorage.setItem(CUSTOM_TEXT_KEY, trimmed);
    } catch {
      /* ignore */
    }
    updateSettings({ mode: "custom" });
    setCustomOpen(false);
    setView("test");
    setTimeout(() => focusTypingRef.current?.(), 50);
  }, [customDraft, updateSettings]);

  const handleExport = useCallback(() => {
    if (dataRef.current) exportToFile(dataRef.current);
  }, []);

  const handleImport = useCallback((text: string): boolean => {
    try {
      const imported = parseImport(text);
      dataRef.current = imported;
      setData(imported);
      applyTheme(imported.settings.theme);
      return true;
    } catch {
      return false;
    }
  }, []);

  const handleReset = useCallback(() => {
    clearData();
    const fresh = defaultData();
    dataRef.current = fresh;
    setData(fresh);
    applyTheme(fresh.settings.theme);
    toast({ title: "All progress reset", description: "Starting fresh." });
  }, []);

  const deleteResult = useCallback((id: string) => {
    const prev = dataRef.current;
    if (!prev) return;
    const next = { ...prev, results: prev.results.filter((r) => r.id !== id) };
    dataRef.current = next;
    setData(next);
  }, []);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">loading your progress…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="tf-glow" aria-hidden />
      <Header view={view} onViewChange={setView} settings={settings} onSettingsChange={updateSettings} refocusTyping={refocusTyping} />

      <main className="relative z-10 w-full flex-1 px-4 pb-20 pt-2 sm:px-6">
        <AnimatePresence mode="wait">
          {view === "test" && (
            <motion.div
              key="test"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="mx-auto flex w-full max-w-4xl flex-col gap-7 pt-2 sm:pt-6"
            >
              <ConfigBar
                settings={settings}
                onSettingsChange={updateSettings}
                onEditCustom={openCustomDialog}
                refocusTyping={refocusTyping}
              />

              {session.finished ? (
                <Results
                  record={session.finished}
                  sessionKeyStats={session.keyStats}
                  theme={settings.theme}
                  isPb={resultMeta.isPb}
                  pbWpm={resultMeta.pbWpm}
                  quoteSource={session.config.quoteSource}
                  onNext={() => {
                    session.newTest();
                    setTimeout(() => focusTypingRef.current?.(), 50);
                  }}
                  onRepeat={() => {
                    session.restartSame();
                    setTimeout(() => focusTypingRef.current?.(), 50);
                  }}
                />
              ) : (
                <TypingArea
                  session={session}
                  settings={settings}
                  paceWpm={paceWpm}
                  focusRef={focusTypingRef}
                />
              )}
            </motion.div>
          )}

          {view === "stats" && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <StatsView
                data={data}
                theme={settings.theme}
                onDeleteResult={deleteResult}
                onGoTest={() => setView("test")}
              />
            </motion.div>
          )}

          {view === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <SettingsView
                settings={settings}
                onSettingsChange={updateSettings}
                onExport={handleExport}
                onImport={handleImport}
                onReset={handleReset}
                resultsCount={data.results.length}
                memberSince={data.firstUse}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-10 mt-auto border-t border-border/40 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 text-[11px] text-muted-foreground/80 sm:flex-row">
          <p>
            TypeFlow · your progress lives in this browser only — no account, no tracking.
          </p>
          <p className="flex items-center gap-3">
            <span>
              <kbd className="rounded border border-border/70 bg-secondary/50 px-1.5 py-0.5">tab</kbd> new test
            </span>
            <span>
              <kbd className="rounded border border-border/70 bg-secondary/50 px-1.5 py-0.5">esc</kbd> restart
            </span>
          </p>
        </div>
      </footer>

      {/* custom text dialog */}
      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent
          className="max-w-lg"
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            refocusTyping();
          }}
        >
          <DialogHeader>
            <DialogTitle>Custom text</DialogTitle>
            <DialogDescription>
              Paste anything you want to practice on — a poem, code, lyrics, your own writing.
              Whitespace splits into words; up to 500 words are used.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={customDraft}
            onChange={(e) => setCustomDraft(e.target.value)}
            placeholder="Paste or type your practice text here…"
            className="min-h-40 font-mono text-sm"
            autoFocus
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <span className="mr-auto text-xs text-muted-foreground">
              {customDraft.trim() ? customDraft.trim().split(/\s+/).length : 0} words
            </span>
            <Button
              onClick={() => setCustomOpen(false)}
              variant="ghost"
            >
              Cancel
            </Button>
            <Button onClick={startCustomTest} disabled={!customDraft.trim()}>
              Start typing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
