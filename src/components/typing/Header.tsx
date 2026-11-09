"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { THEMES } from "@/lib/typing/themes";
import type { Settings } from "@/lib/typing/types";

export type View = "test" | "stats" | "settings";

interface HeaderProps {
  view: View;
  onViewChange: (v: View) => void;
  settings: Settings;
  onSettingsChange: (patch: Partial<Settings>) => void;
  refocusTyping?: () => void;
}

function ThemeSwatches({
  active,
  onPick,
  columns = 3,
}: {
  active: string;
  onPick: (id: string) => void;
  columns?: number;
}) {
  return (
    <div
      className="grid gap-2 p-1"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {THEMES.map((t) => (
        <button
          key={t.id}
          onClick={() => onPick(t.id)}
          aria-label={`Theme: ${t.name}`}
          title={t.name}
          className={cn(
            "group relative flex flex-col items-center gap-1.5 rounded-lg p-2 transition-colors",
            active === t.id ? "bg-primary/15" : "hover:bg-secondary/70"
          )}
        >
          <span
            className="flex h-9 w-full items-center justify-center gap-1 overflow-hidden rounded-md border border-border/60 shadow-inner"
            style={{ background: t.swatch.bg }}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.swatch.sub }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.swatch.text }} />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.swatch.accent }} />
          </span>
          <span
            className={cn(
              "w-full truncate text-center text-[11px] leading-tight",
              active === t.id ? "text-primary font-medium" : "text-muted-foreground"
            )}
          >
            {t.name}
          </span>
        </button>
      ))}
    </div>
  );
}

export function Header({ view, onViewChange, settings, onSettingsChange, refocusTyping }: HeaderProps) {
  const [themeOpen, setThemeOpen] = useState(false);

  const navItems: { id: View; label: string; icon: React.ElementType }[] = [
    { id: "test", label: "Test", icon: KeyboardIcon },
    { id: "stats", label: "Stats", icon: ChartIcon },
    { id: "settings", label: "Settings", icon: SlidersIcon },
  ];

  return (
    <TooltipProvider delayDuration={250}>
      <header className="relative z-20 flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <button
          onClick={() => onViewChange("test")}
          className="flex items-center gap-2.5 outline-none"
          aria-label="TypeFlow home"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <KeyboardIcon className="size-5" />
          </span>
          <span
            className="text-xl font-semibold tracking-tight text-foreground"
            style={{ fontFamily: "var(--font-grotesk), sans-serif" }}
          >
            Type<span className="text-primary">Flow</span>
          </span>
        </button>

        <nav className="flex items-center gap-1" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onViewChange(item.id)}
                    aria-label={item.label}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex size-10 items-center justify-center rounded-xl transition-colors",
                      active
                        ? "text-primary bg-primary/12"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                    )}
                  >
                    <Icon className="size-[18px]" />
                    {active && (
                      <span className="absolute -bottom-[3px] h-[3px] w-5 rounded-full bg-primary" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}

          <span className="mx-1 h-6 w-px bg-border" aria-hidden />

          {/* theme picker lives inside Settings, so hide it here while in Settings */}
          {view !== "settings" && (
            <Popover open={themeOpen} onOpenChange={setThemeOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <button
                      aria-label="Change theme"
                      className="flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground"
                    >
                      <PaletteIcon className="size-[18px]" />
                    </button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Themes
                </TooltipContent>
              </Tooltip>
              <PopoverContent
                align="end"
                className="w-72 p-2"
                onCloseAutoFocus={(e) => {
                  e.preventDefault();
                  refocusTyping?.();
                }}
              >
                <p className="px-2 pb-2 pt-1 text-xs font-medium text-muted-foreground">
                  Pick a theme · {THEMES.length} available
                </p>
                <div className="max-h-80 overflow-y-auto">
                  <ThemeSwatches
                    active={settings.theme}
                    onPick={(id) => onSettingsChange({ theme: id })}
                  />
                </div>
              </PopoverContent>
            </Popover>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onSettingsChange({ soundEnabled: !settings.soundEnabled })}
                aria-label={settings.soundEnabled ? "Mute sounds" : "Enable sounds"}
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl transition-colors",
                  settings.soundEnabled
                    ? "text-primary bg-primary/12"
                    : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                )}
              >
                {settings.soundEnabled ? (
                  <VolumeIcon className="size-[18px]" />
                ) : (
                  <VolumeOffIcon className="size-[18px]" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {settings.soundEnabled ? "Sound on" : "Sound off"}
            </TooltipContent>
          </Tooltip>
        </nav>
      </header>
    </TooltipProvider>
  );
}

// --- inline icons (lucide wrappers kept minimal for tree-shaking) ---
import { Keyboard, BarChart3, SlidersHorizontal, Palette, Volume2, VolumeX } from "lucide-react";

const KeyboardIcon = Keyboard;
const ChartIcon = BarChart3;
const SlidersIcon = SlidersHorizontal;
const PaletteIcon = Palette;
const VolumeIcon = Volume2;
const VolumeOffIcon = VolumeX;

export { ThemeSwatches };
