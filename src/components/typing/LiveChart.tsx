"use client";

// WPM chart shared by the live view and the results screen.

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Sample } from "@/lib/typing/types";
import { themeById } from "@/lib/typing/themes";

interface LiveChartProps {
  samples: Sample[];
  theme: string;
  compact?: boolean;
}

interface TooltipPayloadRow {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadRow[];
  label?: string | number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-border/70 bg-popover/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <p className="mb-1 font-medium text-foreground">{label}s</p>
      {payload.map((row, i) => (
        <p key={i} className="flex items-center gap-1.5 text-muted-foreground">
          <span className="inline-block size-2 rounded-full" style={{ background: row.color }} />
          {row.name}: <span className="font-mono text-foreground">{row.value}</span>
        </p>
      ))}
    </div>
  );
}

export function LiveChart({ samples, theme, compact }: LiveChartProps) {
  const c = themeById(theme).swatch;
  const data = samples.map((s) => ({
    t: s.t,
    wpm: s.wpm,
    raw: s.raw,
    errorAt: s.errors > 0 ? s.raw : null,
    errors: s.errors,
  }));
  const height = compact ? 110 : 240;
  const hasErrors = data.some((d) => d.errors > 0);

  if (data.length === 0) return null;

  return (
    <div style={{ width: "100%", height }} aria-label="WPM chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke={c.surface} strokeDasharray="3 6" vertical={false} />
          <XAxis
            dataKey="t"
            type="number"
            domain={["dataMin", "dataMax"]}
            tick={{ fill: c.sub, fontSize: compact ? 10 : 11 }}
            stroke={c.surface}
            tickLine={false}
            axisLine={{ stroke: c.surface }}
            unit="s"
          />
          <YAxis
            tick={{ fill: c.sub, fontSize: compact ? 10 : 11 }}
            stroke={c.surface}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip content={<ChartTooltip />} />
          <Line
            type="monotone"
            dataKey="raw"
            name="raw"
            stroke={c.sub}
            strokeWidth={compact ? 1.5 : 2}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="wpm"
            name="wpm"
            stroke={c.accent}
            strokeWidth={compact ? 2 : 2.5}
            dot={false}
            isAnimationActive={false}
          />
          {hasErrors && (
            <Scatter
              dataKey="errorAt"
              fill={c.error}
              name="errors"
              shape="circle"
              isAnimationActive={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
