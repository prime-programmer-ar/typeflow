"use client";

// Per-key accuracy heatmap (session or all-time).

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { KeyStats } from "@/lib/typing/types";
import { themeById } from "@/lib/typing/themes";

const ROWS = ["1234567890", "qwertyuiop", "asdfghjkl", "zxcvbnm"];

interface KeyboardHeatmapProps {
  keyStats: KeyStats;
  theme: string;
  title?: string;
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function KeyboardHeatmap({ keyStats, theme, title }: KeyboardHeatmapProps) {
  const c = themeById(theme).swatch;

  // merge case variants (A -> a)
  const merged: KeyStats = {};
  for (const [ch, s] of Object.entries(keyStats)) {
    const key = ch.toLowerCase();
    const cur = merged[key] ?? { c: 0, i: 0 };
    merged[key] = { c: cur.c + s.c, i: cur.i + s.i };
  }

  const statsFor = (ch: string) => {
    const s = merged[ch];
    if (!s || s.c + s.i === 0) return null;
    const rate = s.i / (s.c + s.i);
    const acc = Math.round((1 - rate) * 100);
    return { ...s, rate, acc };
  };

  const keyStyle = (ch: string): React.CSSProperties => {
    const s = statsFor(ch);
    if (!s) return { background: hexToRgba(c.surface, 0.7), color: c.sub };
    if (s.rate === 0) return { background: hexToRgba(c.accent, 0.16), color: c.text };
    const alpha = 0.15 + Math.min(1, s.rate * 2.2) * 0.75;
    return { background: hexToRgba(c.error, alpha), color: "#fff" };
  };

  const space = statsFor(" ");
  const worst = Object.entries(merged)
    .filter(([ch, s]) => ch !== " " && s.i > 0)
    .map(([ch, s]) => ({ ch, ...s, rate: s.i / (s.c + s.i) }))
    .sort((a, b) => b.i - a.i)
    .slice(0, 6);

  const totalPresses = Object.values(merged).reduce((acc, s) => acc + s.c + s.i, 0);

  return (
    <TooltipProvider delayDuration={120}>
      <div>
        {title && <p className="mb-3 text-sm font-medium text-muted-foreground">{title}</p>}
        <div className="mx-auto flex w-full max-w-[430px] flex-col items-center gap-1.5 sm:gap-2">
          {ROWS.map((row) => (
            <div key={row} className="flex w-full gap-1 sm:gap-1.5">
              {row.split("").map((ch) => {
                const s = statsFor(ch);
                return (
                  <Tooltip key={ch}>
                    <TooltipTrigger asChild>
                      <div
                        className="flex aspect-square flex-1 flex-col items-center justify-center rounded-md text-[11px] font-medium transition-transform hover:scale-105 sm:text-[13px]"
                        style={keyStyle(ch)}
                      >
                        <span className="uppercase leading-none">{ch}</span>
                        {s && (
                          <span className="mt-0.5 text-[8px] leading-none opacity-80 sm:text-[9px]">{s.acc}%</span>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <span className="uppercase">{ch}</span> · {s ? `${s.acc}% accuracy · ${s.c + s.i} presses` : "no data"}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className="mt-1 flex h-8 w-full max-w-[15rem] items-center justify-center rounded-md text-xs font-medium transition-transform hover:scale-[1.02] sm:h-9"
                style={space ? keyStyle(" ") : { background: hexToRgba(c.surface, 0.7), color: c.sub }}
              >
                {space ? `${space.acc}% accuracy` : "space"}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              space · {space ? `${space.acc}% · ${space.c + space.i} presses` : "no data"}
            </TooltipContent>
          </Tooltip>
        </div>

        {totalPresses === 0 && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            No keystrokes recorded yet — finish a test to see your key accuracy.
          </p>
        )}

        {worst.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Keys to practice</p>
            <div className="flex flex-wrap gap-2">
              {worst.map((w) => (
                <span
                  key={w.ch}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/40 px-2.5 py-1.5 text-xs"
                  )}
                >
                  <span className="font-mono text-[13px] uppercase text-foreground">{w.ch}</span>
                  <span className="text-muted-foreground">
                    {Math.round((1 - w.rate) * 100)}% · {w.i} miss{w.i === 1 ? "" : "es"}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
