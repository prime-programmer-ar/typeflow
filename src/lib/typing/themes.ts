// Theme registry — full palettes live in globals.css as [data-theme] blocks.
// This registry powers the theme picker UI (swatches, names) and provides
// literal colors for charts (recharts needs real values, not CSS vars).

export interface ThemeSwatch {
  bg: string;
  surface: string;
  text: string;
  sub: string;
  accent: string;
  accent2: string;
  error: string;
}

export interface ThemeMeta {
  id: string;
  name: string;
  dark: boolean;
  swatch: ThemeSwatch;
}

export const THEMES: ThemeMeta[] = [
  {
    id: "ember",
    name: "Ember",
    dark: true,
    swatch: { bg: "#141210", surface: "#1d1a17", text: "#ece7df", sub: "#8b8479", accent: "#ffb454", accent2: "#ff8e6e", error: "#e5484d" },
  },
  {
    id: "carbon",
    name: "Carbon",
    dark: true,
    swatch: { bg: "#101010", surface: "#1a1a1a", text: "#f0f0f0", sub: "#7a7a7a", accent: "#f5f5f5", accent2: "#b8b8b8", error: "#ff5c5c" },
  },
  {
    id: "matrix",
    name: "Matrix",
    dark: true,
    swatch: { bg: "#0b0f0c", surface: "#121a13", text: "#d2f0da", sub: "#4f7a5c", accent: "#2bd66f", accent2: "#8ee6a8", error: "#ff5f56" },
  },
  {
    id: "dracula",
    name: "Dracula",
    dark: true,
    swatch: { bg: "#282a36", surface: "#343746", text: "#f8f8f2", sub: "#6272a4", accent: "#bd93f9", accent2: "#ff79c6", error: "#ff5555" },
  },
  {
    id: "nord",
    name: "Nord",
    dark: true,
    swatch: { bg: "#2e3440", surface: "#353c4a", text: "#eceff4", sub: "#4c566a", accent: "#88c0d0", accent2: "#a3be8c", error: "#bf616a" },
  },
  {
    id: "tokyo-night",
    name: "Tokyo Night",
    dark: true,
    swatch: { bg: "#1a1b26", surface: "#1f2335", text: "#c0caf5", sub: "#565f89", accent: "#7aa2f7", accent2: "#bb9af7", error: "#f7768e" },
  },
  {
    id: "gruvbox",
    name: "Gruvbox",
    dark: true,
    swatch: { bg: "#282828", surface: "#32302f", text: "#ebdbb2", sub: "#928374", accent: "#fabd2f", accent2: "#8ec07c", error: "#fb4934" },
  },
  {
    id: "rose-pine",
    name: "Rosé Pine",
    dark: true,
    swatch: { bg: "#191724", surface: "#1f1d2e", text: "#e0def4", sub: "#6e6a86", accent: "#ebbcba", accent2: "#c4a7e7", error: "#eb6f92" },
  },
  {
    id: "catppuccin",
    name: "Catppuccin",
    dark: true,
    swatch: { bg: "#1e1e2e", surface: "#262637", text: "#cdd6f4", sub: "#6c7086", accent: "#cba6f7", accent2: "#f5c2e7", error: "#f38ba8" },
  },
  {
    id: "solar-dark",
    name: "Solarized Dark",
    dark: true,
    swatch: { bg: "#002b36", surface: "#073642", text: "#93a1a1", sub: "#586e75", accent: "#b58900", accent2: "#2aa198", error: "#dc322f" },
  },
  {
    id: "everforest",
    name: "Everforest",
    dark: true,
    swatch: { bg: "#2d353b", surface: "#343e44", text: "#d3c6aa", sub: "#859289", accent: "#a7c080", accent2: "#dbbc7f", error: "#e67e80" },
  },
  {
    id: "kanagawa",
    name: "Kanagawa",
    dark: true,
    swatch: { bg: "#1f1f28", surface: "#272730", text: "#dcd7ba", sub: "#727169", accent: "#d27e99", accent2: "#6a9589", error: "#e46876" },
  },
  {
    id: "synthwave",
    name: "Synthwave",
    dark: true,
    swatch: { bg: "#16101f", surface: "#1e1730", text: "#eae2f8", sub: "#6d5a8f", accent: "#ff7edb", accent2: "#36f9f6", error: "#fe4450" },
  },
  {
    id: "paper",
    name: "Paper",
    dark: false,
    swatch: { bg: "#f6f3ec", surface: "#efeade", text: "#33302b", sub: "#a29b8e", accent: "#b45309", accent2: "#0d9488", error: "#dc2626" },
  },
  {
    id: "solar-light",
    name: "Solarized Light",
    dark: false,
    swatch: { bg: "#fdf6e3", surface: "#f5eed8", text: "#586e75", sub: "#93a1a1", accent: "#b58900", accent2: "#268bd2", error: "#dc322f" },
  },
];

export const DEFAULT_THEME = "ember";

export function themeById(id: string): ThemeMeta {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}
