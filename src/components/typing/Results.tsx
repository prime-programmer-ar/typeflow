"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { prettyModeLabel } from "@/lib/typing/engine";
import type { KeyStats, ResultRecord } from "@/lib/typing/types";
import { LiveChart } from "./LiveChart";
import { KeyboardHeatmap } from "./KeyboardHeatmap";
import { RotateCcw, Sparkles, Trophy, Zap, Target, Activity, Clock, Type } from "lucide-react";

interface ResultsProps {
  record: ResultRecord;
  sessionKeyStats: KeyStats;
  theme: string;
  isPb: boolean;
  pbWpm: number | null;
  quoteSource?: string;
  onNext: () => void;
  onRepeat: () => void;
}

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25, ease: "easeOut" }}
      className="flex flex-col gap-1.5 rounded-xl border border-border/60 bg-card/60 px-4 py-3"
    >
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </span>
      <span className="font-mono text-xl font-semibold text-foreground">{value}</span>
      {sub && <span className="text-[11px] text-muted-foreground">{sub}</span>}
    </motion.div>
  );
}

export function Results({
  record,
  sessionKeyStats,
  theme,
  isPb,
  pbWpm,
  quoteSource,
  onNext,
  onRepeat,
}: ResultsProps) {
  const chars = `${record.correct}/${record.incorrect}/${record.extra}/${record.missed}`;

  return (
    <motion.section
      aria-label="Test results"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mx-auto w-full max-w-3xl"
    >
      {/* headline */}
      <div className="mb-8 flex flex-col items-center gap-2 text-center">
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.05, duration: 0.25, ease: "easeOut" }}
          className="flex items-end gap-3"
        >
          <span className="font-mono text-7xl font-bold leading-none tracking-tight text-primary sm:text-8xl">
            {Math.round(record.wpm)}
          </span>
          <span className="pb-2 text-lg font-medium text-muted-foreground">wpm</span>
        </motion.div>

        <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
          <span className="rounded-full border border-border/60 bg-secondary/40 px-3 py-1">
            {prettyModeLabel(record.modeLabel)}
            {record.punctuation && " · punct"}
            {record.numbers && " · num"}
          </span>
          {isPb ? (
            <motion.span
              initial={{ scale: 0.8 }}
              animate={{ scale: [0.9, 1.06, 1] }}
              transition={{ duration: 0.45 }}
              className="flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 font-medium text-primary"
            >
              <Sparkles className="size-3.5" />
              New personal best!
            </motion.span>
          ) : pbWpm != null ? (
            <span className="flex items-center gap-1.5 rounded-full border border-border/60 px-3 py-1">
              <Trophy className="size-3.5" />
              PB {Math.round(pbWpm)} wpm
            </span>
          ) : null}
        </div>
        {quoteSource && (
          <p className="text-sm italic text-muted-foreground">— {quoteSource}</p>
        )}
      </div>

      {/* stats grid */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile icon={Zap} label="raw" value={Math.round(record.raw)} sub="all keystrokes" delay={0.1} />
        <StatTile icon={Target} label="accuracy" value={`${Math.round(record.acc)}%`} sub={`${record.incorrect + record.extra} mistakes`} delay={0.15} />
        <StatTile icon={Activity} label="consistency" value={`${record.consistency}%`} sub="rhythm stability" delay={0.2} />
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="cursor-help">
                <StatTile icon={Type} label="characters" value={chars} sub="cor/inc/ext/miss" delay={0.25} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {record.correct} correct · {record.incorrect} incorrect · {record.extra} extra · {record.missed} missed
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <StatTile icon={Clock} label="time" value={`${record.durationSec}s`} sub={`${Math.round(record.wpm * record.durationSec / 12)} chars/min`} delay={0.3} />
        <StatTile icon={Trophy} label="peak" value={peakWpm(record)} sub="best second" delay={0.35} />
      </div>

      {/* chart */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="mb-6 rounded-xl border border-border/60 bg-card/60 p-4"
      >
        <p className="mb-2 text-xs font-medium text-muted-foreground">wpm / raw / errors over time</p>
        <LiveChart samples={record.samples} theme={theme} />
      </motion.div>

      {/* heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.3 }}
        className="mb-8 rounded-xl border border-border/60 bg-card/60 p-4"
      >
        <KeyboardHeatmap keyStats={sessionKeyStats} theme={theme} title="Keys this test" />
      </motion.div>

      {/* actions */}
      <div className="flex items-center justify-center gap-3">
        <Button
          onClick={onNext}
          className="gap-2 rounded-xl px-5"
          aria-label="Next test (Tab)"
        >
          Next test
          <kbd className="rounded border border-primary-foreground/30 px-1.5 py-0.5 text-[10px] opacity-80">tab</kbd>
        </Button>
        <Button
          onClick={onRepeat}
          variant="outline"
          className="gap-2 rounded-xl px-5"
          aria-label="Repeat test (Esc)"
        >
          <RotateCcw className="size-4" />
          Repeat
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">esc</kbd>
        </Button>
      </div>
    </motion.section>
  );
}

function peakWpm(r: ResultRecord): number {
  if (r.samples.length === 0) return Math.round(r.wpm);
  const best = r.samples.reduce((acc, s) => (s.raw > acc ? s.raw : acc), 0);
  return Math.round(best);
}
