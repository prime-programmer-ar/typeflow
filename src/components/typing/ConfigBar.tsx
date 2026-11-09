"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CATEGORY_META } from "@/lib/typing/sentences";
import type { RealWorldCategory, Settings, TestMode } from "@/lib/typing/types";
import { Clock, Type, Quote as QuoteIcon, Globe2, FileText, Infinity as InfinityIcon, AtSign, Hash, PencilLine } from "lucide-react";

interface ConfigBarProps {
  settings: Settings;
  onSettingsChange: (patch: Partial<Settings>) => void;
  onEditCustom: () => void;
  refocusTyping?: () => void;
  disabled?: boolean;
}

const MODES: { id: TestMode; label: string; icon: React.ElementType }[] = [
  { id: "time", label: "Time", icon: Clock },
  { id: "words", label: "Words", icon: Type },
  { id: "quote", label: "Quote", icon: QuoteIcon },
  { id: "realworld", label: "Real World", icon: Globe2 },
  { id: "custom", label: "Custom", icon: FileText },
  { id: "zen", label: "Zen", icon: InfinityIcon },
];

function Chip({
  active,
  onClick,
  children,
  className,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "tf-chip px-2.5 py-1 text-[13px] font-medium leading-none",
        active && "tf-chip-active",
        className
      )}
    >
      {children}
    </button>
  );
}

function AmountPopover({
  label,
  value,
  min,
  max,
  onApply,
  refocusTyping,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onApply: (v: number) => void;
  refocusTyping?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const apply = () => {
    const n = parseInt(draft, 10);
    if (!Number.isNaN(n)) onApply(Math.max(min, Math.min(max, n)));
    setOpen(false);
  };
  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setDraft(String(value));
      }}
    >
      <PopoverTrigger asChild>
        <button
          title={`Custom ${label}`}
          className={cn(
            "tf-chip px-2 py-1 text-[13px] font-medium leading-none",
            ![15, 30, 60, 120, 10, 25, 50, 100].includes(value) && "tf-chip-active"
          )}
        >
          <PencilLine className="size-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-44 p-3"
        align="center"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          refocusTyping?.();
        }}
      >
        <p className="mb-2 text-xs text-muted-foreground">Custom {label} ({min}–{max})</p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={draft}
            min={min}
            max={max}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && apply()}
            className="h-8 w-full text-sm"
          />
          <Button size="sm" className="h-8 px-3" onClick={apply}>
            OK
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ConfigBar({ settings, onSettingsChange, onEditCustom, refocusTyping, disabled }: ConfigBarProps) {
  const mode = settings.mode;
  const decorateApplies = mode === "time" || mode === "words";

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-3xl flex-wrap items-center justify-center gap-1 rounded-2xl border border-border/70 bg-card/70 px-3 py-2 shadow-sm backdrop-blur-sm transition-opacity",
        disabled && "pointer-events-none opacity-40"
      )}
      role="toolbar"
      aria-label="Test configuration"
    >
      {/* modes */}
      <div className="flex items-center gap-0.5">
        {MODES.map((m) => {
          const Icon = m.icon;
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() =>
                m.id === "custom" ? onEditCustom() : onSettingsChange({ mode: m.id })
              }
              title={m.label}
              aria-pressed={active}
              className={cn(
                "tf-chip flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] font-medium",
                active && "tf-chip-active"
              )}
            >
              <Icon className="size-3.5" />
              <span className="hidden sm:inline">{m.label}</span>
            </button>
          );
        })}
      </div>

      <span className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden />

      {/* amounts depend on mode */}
      <div className="flex items-center gap-0.5">
        {mode === "time" && (
          <>
            {[15, 30, 60, 120].map((s) => (
              <Chip
                key={s}
                active={settings.timeAmount === s}
                onClick={() => onSettingsChange({ timeAmount: s })}
              >
                {s}
              </Chip>
            ))}
            <AmountPopover
              label="seconds"
              value={settings.timeAmount}
              min={1}
              max={3600}
              onApply={(v) => onSettingsChange({ timeAmount: v })}
              refocusTyping={refocusTyping}
            />
          </>
        )}

        {mode === "words" && (
          <>
            {[10, 25, 50, 100].map((n) => (
              <Chip
                key={n}
                active={settings.wordsAmount === n}
                onClick={() => onSettingsChange({ wordsAmount: n })}
              >
                {n}
              </Chip>
            ))}
            <AmountPopover
              label="words"
              value={settings.wordsAmount}
              min={1}
              max={1000}
              onApply={(v) => onSettingsChange({ wordsAmount: v })}
              refocusTyping={refocusTyping}
            />
          </>
        )}

        {mode === "quote" &&
          (["short", "medium", "long", "all"] as const).map((q) => (
            <Chip
              key={q}
              active={settings.quoteLength === q}
              onClick={() => onSettingsChange({ quoteLength: q })}
            >
              {q}
            </Chip>
          ))}

        {mode === "realworld" && (
          <>
            <Select
              value={settings.realWorldCategory}
              onValueChange={(v) =>
                onSettingsChange({ realWorldCategory: v as RealWorldCategory | "mixed" })
              }
            >
              <SelectTrigger className="h-8 w-[120px] rounded-lg border-border/70 bg-secondary/40 text-[13px] text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                onCloseAutoFocus={(e) => {
                  e.preventDefault();
                  refocusTyping?.();
                }}
              >
                {Object.entries(CATEGORY_META).map(([id, meta]) => (
                  <SelectItem key={id} value={id} className="text-[13px]">
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {[10, 25, 50, 100].map((n) => (
              <Chip
                key={n}
                active={settings.realWorldAmount === n}
                onClick={() => onSettingsChange({ realWorldAmount: n })}
              >
                {n}
              </Chip>
            ))}
          </>
        )}

        {mode === "custom" && (
          <Chip onClick={onEditCustom}>
            <span className="flex items-center gap-1.5">
              <PencilLine className="size-3.5" /> Edit text
            </span>
          </Chip>
        )}

        {mode === "zen" && (
          <span className="px-2 text-[13px] text-muted-foreground">Type freely — no end</span>
        )}
      </div>

      {/* punctuation / numbers */}
      {(mode === "time" || mode === "words") && (
        <>
          <span className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden />
          <div className="flex items-center gap-0.5">
            <Chip
              active={settings.punctuation}
              onClick={() => onSettingsChange({ punctuation: !settings.punctuation })}
              title="Punctuation"
            >
              <AtSign className="size-3.5" />
            </Chip>
            <Chip
              active={settings.numbers}
              onClick={() => onSettingsChange({ numbers: !settings.numbers })}
              title="Numbers"
            >
              <Hash className="size-3.5" />
            </Chip>
          </div>
        </>
      )}
    </div>
  );
}
