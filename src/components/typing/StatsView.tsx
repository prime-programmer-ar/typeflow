"use client";

// Progress dashboard: totals, trends, activity, personal bests, history.

import { useMemo } from "react";
import { format } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { prettyModeLabel } from "@/lib/typing/engine";
import { themeById } from "@/lib/typing/themes";
import type { AppData } from "@/lib/typing/types";
import { KeyboardHeatmap } from "./KeyboardHeatmap";
import { Flame, Timer, Gauge, Crown, Target, CalendarDays, Trash2, TrendingUp } from "lucide-react";

interface StatsViewProps {
  data: AppData;
  theme: string;
  onDeleteResult: (id: string) => void;
  onGoTest: () => void;
}

function Card({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border/60 bg-card/60 px-4 py-3.5">
      <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </span>
      <span className="font-mono text-2xl font-semibold text-foreground">{value}</span>
      {sub && <span className="text-[11px] text-muted-foreground">{sub}</span>}
    </div>
  );
}

export function StatsView({ data, theme, onDeleteResult, onGoTest }: StatsViewProps) {
  const c = themeById(theme).swatch;
  const results = data.results;

  const totals = useMemo(() => {
    const tests = results.length;
    const seconds = results.reduce((a, r) => a + r.durationSec, 0);
    const last10 = results.slice(0, 10);
    const avgWpm = last10.length
      ? Math.round(last10.reduce((a, r) => a + r.wpm, 0) / last10.length)
      : 0;
    const best = results.reduce((a, r) => Math.max(a, r.wpm), 0);
    const avgAcc = last10.length
      ? Math.round(last10.reduce((a, r) => a + r.acc, 0) / last10.length)
      : 0;
    return { tests, seconds, avgWpm, best, avgAcc };
  }, [results]);

  const trend = useMemo(
    () =>
      [...results]
        .slice(0, 60)
        .reverse()
        .map((r, i) => ({
          i: i + 1,
          wpm: Math.round(r.wpm),
          acc: Math.round(r.acc),
          mode: prettyModeLabel(r.modeLabel),
          date: format(new Date(r.at), "MMM d"),
        })),
    [results]
  );

  const activity = useMemo(() => {
    const days: { day: string; count: number }[] = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = format(d, "yyyy-MM-dd");
      days.push({ day: format(d, "d MMM"), count: data.activity[key]?.count ?? 0 });
    }
    return days;
  }, [data.activity]);

  const pbs = useMemo(
    () =>
      Object.entries(data.pbs)
        .map(([key, pb]) => ({ key, ...pb }))
        .sort((a, b) => b.wpm - a.wpm),
    [data.pbs]
  );

  const fmtDuration = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${Math.round(s % 60)}s`;
    return `${Math.round(s)}s`;
  };

  if (results.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/12 text-primary">
          <TrendingUp className="size-7" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-foreground">No stats yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete your first typing test and your progress will appear here —
            stored privately in your browser.
          </p>
        </div>
        <Button onClick={onGoTest} className="rounded-xl">
          Take a test
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* headline cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Card icon={Target} label="tests" value={String(totals.tests)} sub="all time" />
        <Card icon={Timer} label="time typed" value={fmtDuration(totals.seconds)} sub="total practice" />
        <Card icon={Gauge} label="avg wpm" value={String(totals.avgWpm)} sub="last 10 tests" />
        <Card icon={Crown} label="best wpm" value={String(Math.round(totals.best))} sub="personal record" />
        <Card icon={Target} label="avg accuracy" value={`${totals.avgAcc}%`} sub="last 10 tests" />
        <Card
          icon={Flame}
          label="day streak"
          value={String(data.streak.current)}
          sub={`longest ${data.streak.longest}`}
        />
      </div>

      {/* trend + activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-card/60 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <TrendingUp className="size-3.5" />
            wpm · last {trend.length} tests
          </p>
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 6, right: 8, bottom: 0, left: -18 }}>
                <CartesianGrid stroke={c.surface} strokeDasharray="3 6" vertical={false} />
                <XAxis dataKey="i" tick={{ fill: c.sub, fontSize: 10 }} stroke={c.surface} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: c.sub, fontSize: 10 }} stroke={c.surface} tickLine={false} axisLine={false} width={40} domain={["dataMin - 10", "dataMax + 10"]} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload as (typeof trend)[number];
                    return (
                      <div className="rounded-lg border border-border/70 bg-popover/95 px-3 py-2 text-xs shadow-xl">
                        <p className="font-medium text-foreground">#{label} · {p.date}</p>
                        <p className="text-muted-foreground">{p.mode}</p>
                        <p className="font-mono text-foreground">{p.wpm} wpm · {p.acc}%</p>
                      </div>
                    );
                  }}
                />
                <Line type="monotone" dataKey="wpm" stroke={c.accent} strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="acc" stroke={c.accent2} strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/60 p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <CalendarDays className="size-3.5" />
            activity · last 28 days
          </p>
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activity} margin={{ top: 6, right: 8, bottom: 0, left: -22 }}>
                <CartesianGrid stroke={c.surface} strokeDasharray="3 6" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: c.sub, fontSize: 9 }} stroke={c.surface} tickLine={false} axisLine={false} interval={3} />
                <YAxis tick={{ fill: c.sub, fontSize: 10 }} stroke={c.surface} tickLine={false} axisLine={false} width={40} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: c.surface, opacity: 0.5 }}
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded-lg border border-border/70 bg-popover/95 px-3 py-2 text-xs shadow-xl">
                        <p className="font-medium text-foreground">{label}</p>
                        <p className="font-mono text-foreground">{payload[0].value} test{payload[0].value === 1 ? "" : "s"}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="count" fill={c.accent} radius={[4, 4, 0, 0]} maxBarSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* personal bests */}
      {pbs.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card/60 p-4">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Crown className="size-3.5" />
            personal bests
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {pbs.map((pb) => (
              <div
                key={pb.key}
                className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/30 px-3 py-2"
              >
                <div>
                  <p className="text-[13px] font-medium text-foreground">{prettyModeLabel(pb.key)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {format(new Date(pb.at), "MMM d, yyyy")} · {Math.round(pb.acc)}% acc
                  </p>
                </div>
                <span className="font-mono text-lg font-semibold text-primary">{Math.round(pb.wpm)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* history */}
      <div className="rounded-xl border border-border/60 bg-card/60 p-4">
        <p className="mb-3 text-xs font-medium text-muted-foreground">recent tests</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-border/60 text-xs text-muted-foreground">
                <th className="py-2 pr-4 font-medium">when</th>
                <th className="py-2 pr-4 font-medium">mode</th>
                <th className="py-2 pr-4 text-right font-medium">wpm</th>
                <th className="py-2 pr-4 text-right font-medium">raw</th>
                <th className="py-2 pr-4 text-right font-medium">acc</th>
                <th className="py-2 pr-4 text-right font-medium">cons</th>
                <th className="py-2 pr-4 text-right font-medium">time</th>
                <th className="py-2 font-medium sr-only">actions</th>
              </tr>
            </thead>
            <tbody>
              {results.slice(0, 15).map((r) => (
                <tr key={r.id} className={cn("border-b border-border/30 last:border-0")}>
                  <td className="py-2 pr-4 text-muted-foreground">{format(new Date(r.at), "MMM d · HH:mm")}</td>
                  <td className="py-2 pr-4 text-foreground">
                    {prettyModeLabel(r.modeLabel)}
                    {r.punctuation && <span className="ml-1 text-muted-foreground">+p</span>}
                  </td>
                  <td className="py-2 pr-4 text-right font-mono font-semibold text-primary">{Math.round(r.wpm)}</td>
                  <td className="py-2 pr-4 text-right font-mono text-muted-foreground">{Math.round(r.raw)}</td>
                  <td className="py-2 pr-4 text-right font-mono text-muted-foreground">{Math.round(r.acc)}%</td>
                  <td className="py-2 pr-4 text-right font-mono text-muted-foreground">{r.consistency}%</td>
                  <td className="py-2 pr-4 text-right font-mono text-muted-foreground">{r.durationSec}s</td>
                  <td className="py-2 text-right">
                    <button
                      onClick={() => onDeleteResult(r.id)}
                      className="rounded-md p-1.5 text-muted-foreground/60 transition-colors hover:bg-destructive/15 hover:text-destructive"
                      aria-label="Delete result"
                      title="Delete result"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* all-time heatmap */}
      <div className="rounded-xl border border-border/60 bg-card/60 p-4">
        <KeyboardHeatmap keyStats={data.keyStats} theme={theme} title="Keys · all time" />
      </div>
    </div>
  );
}
