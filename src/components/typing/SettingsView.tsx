"use client";

import { useRef, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ThemeSwatches } from "./Header";
import { THEMES } from "@/lib/typing/themes";
import type { CaretStyle, Settings, TypingFont } from "@/lib/typing/types";
import { Download, Upload, Trash2, ShieldCheck, Volume2, Palette, MousePointerClick, Keyboard as KeyboardIcon, Database } from "lucide-react";

interface SettingsViewProps {
  settings: Settings;
  onSettingsChange: (patch: Partial<Settings>) => void;
  onExport: () => void;
  onImport: (text: string) => boolean;
  onReset: () => void;
  resultsCount: number;
  memberSince: number;
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border/60 bg-card/60 p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="size-4 text-primary" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-foreground">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

const FONT_OPTIONS: { id: TypingFont; label: string; className: string }[] = [
  { id: "jetbrains", label: "JetBrains Mono", className: "tf-font-jetbrains" },
  { id: "roboto", label: "Roboto Mono", className: "tf-font-roboto" },
  { id: "plex", label: "IBM Plex Mono", className: "tf-font-plex" },
];

export function SettingsView({
  settings,
  onSettingsChange,
  onExport,
  onImport,
  onReset,
  resultsCount,
  memberSince,
}: SettingsViewProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const ok = onImport(text);
      setImportMsg(ok ? "Progress imported successfully." : "That file doesn't look like a TypeFlow backup.");
    } catch {
      setImportMsg("Could not read that file.");
    }
    e.target.value = "";
    setTimeout(() => setImportMsg(null), 4000);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      {/* theme */}
      <Section icon={Palette} title={`Theme · ${THEMES.length} available`}>
        <div className="max-h-72 overflow-y-auto pr-1">
          <ThemeSwatches
            active={settings.theme}
            onPick={(id) => onSettingsChange({ theme: id })}
            columns={4}
          />
        </div>
      </Section>

      {/* appearance */}
      <Section icon={KeyboardIcon} title="Typing & appearance">
        <Row label="Typing font">
          <Select
            value={settings.typingFont}
            onValueChange={(v) => onSettingsChange({ typingFont: v as TypingFont })}
          >
            <SelectTrigger className="h-9 w-[180px] rounded-lg text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((f) => (
                <SelectItem key={f.id} value={f.id} className={f.className}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>

        <div className="py-2.5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[13px] font-medium text-foreground">Font size</p>
            <span className="font-mono text-xs text-muted-foreground">{settings.fontSize}px</span>
          </div>
          <Slider
            value={[settings.fontSize]}
            min={18}
            max={40}
            step={1}
            onValueChange={([v]) => onSettingsChange({ fontSize: v })}
            aria-label="Font size"
          />
          <p className="mt-2 font-mono text-muted-foreground" style={{ fontSize: Math.min(settings.fontSize, 26) }}>
            The quick brown fox jumps over the lazy dog
          </p>
        </div>

        <Row label="Caret style">
          <div className="flex gap-1">
            {(["line", "block", "underline"] as CaretStyle[]).map((s) => (
              <button
                key={s}
                onClick={() => onSettingsChange({ caretStyle: s })}
                className={`tf-chip px-3 py-1.5 text-[13px] font-medium capitalize ${settings.caretStyle === s ? "tf-chip-active" : ""}`}
              >
                {s}
              </button>
            ))}
          </div>
        </Row>

        <div className="border-t border-border/40 pt-1">
          <Row label="Smooth caret" hint="Caret glides between letters">
            <Switch checked={settings.smoothCaret} onCheckedChange={(v) => onSettingsChange({ smoothCaret: v })} />
          </Row>
          <Row label="Live WPM" hint="Show current speed while typing (non-time modes)">
            <Switch checked={settings.showLiveWpm} onCheckedChange={(v) => onSettingsChange({ showLiveWpm: v })} />
          </Row>
          <Row label="Live chart" hint="WPM graph under the words during a test">
            <Switch checked={settings.showLiveChart} onCheckedChange={(v) => onSettingsChange({ showLiveChart: v })} />
          </Row>
          <Row label="Pace caret" hint="Ghost caret racing at your personal best">
            <Switch checked={settings.paceCaret} onCheckedChange={(v) => onSettingsChange({ paceCaret: v })} />
          </Row>
        </div>
      </Section>

      {/* behavior */}
      <Section icon={MousePointerClick} title="Behavior">
        <Row label="Punctuation" hint="Adds capitals, commas & more to random words">
          <Switch checked={settings.punctuation} onCheckedChange={(v) => onSettingsChange({ punctuation: v })} />
        </Row>
        <Row label="Numbers" hint="Sprinkles numbers into word tests">
          <Switch checked={settings.numbers} onCheckedChange={(v) => onSettingsChange({ numbers: v })} />
        </Row>
        <Row label="Stop on error" hint="Can't move on until the word is correct">
          <Switch checked={settings.stopOnError} onCheckedChange={(v) => onSettingsChange({ stopOnError: v })} />
        </Row>
        <Row label="Blind mode" hint="Mistakes are never highlighted — trust your fingers">
          <Switch checked={settings.blindMode} onCheckedChange={(v) => onSettingsChange({ blindMode: v })} />
        </Row>
      </Section>

      {/* sound */}
      <Section icon={Volume2} title="Sound">
        <Row label="Keystroke sounds" hint="Soft synthesized clicks — no downloads">
          <Switch checked={settings.soundEnabled} onCheckedChange={(v) => onSettingsChange({ soundEnabled: v })} />
        </Row>
        <div className="py-2.5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[13px] font-medium text-foreground">Volume</p>
            <span className="font-mono text-xs text-muted-foreground">{settings.volume}%</span>
          </div>
          <Slider
            value={[settings.volume]}
            min={0}
            max={100}
            step={5}
            onValueChange={([v]) => onSettingsChange({ volume: v })}
            aria-label="Volume"
            disabled={!settings.soundEnabled}
          />
        </div>
      </Section>

      {/* data */}
      <Section icon={Database} title="Your data">
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-primary/25 bg-primary/8 p-3.5">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            TypeFlow is <span className="text-foreground">local-first</span>: {resultsCount} saved{" "}
            {resultsCount === 1 ? "test" : "tests"}, streaks and settings live only in this
            browser's storage — no account, no server, no tracking. Export a backup to move your
            progress to another device.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="outline" size="sm" className="gap-2 rounded-lg" onClick={onExport}>
            <Download className="size-4" /> Export backup
          </Button>
          <Button variant="outline" size="sm" className="gap-2 rounded-lg" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" /> Import backup
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleFile}
            aria-label="Import backup file"
          />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="size-4" /> Reset everything
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset all progress?</AlertDialogTitle>
                <AlertDialogDescription>
                  This deletes every saved test, personal best, streak and key statistic from this
                  browser. It cannot be undone — consider exporting a backup first.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep my data</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90">
                  Reset everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        {importMsg && (
          <p className="mt-3 text-xs text-primary" role="status">
            {importMsg}
          </p>
        )}
        <p className="mt-4 text-[11px] text-muted-foreground">
          Practicing with TypeFlow since {new Date(memberSince).toLocaleDateString()} · v1.0
        </p>
      </Section>
    </div>
  );
}
