// Common English words (frequency-ordered top ~500) used for random tests.

export const COMMON_WORDS: string[] = [
  "the", "of", "and", "a", "to", "in", "is", "you", "that", "it", "he", "was",
  "for", "on", "are", "as", "with", "his", "they", "I", "at", "be", "this",
  "have", "from", "or", "one", "had", "by", "word", "but", "not", "what",
  "all", "were", "we", "when", "your", "can", "said", "there", "use", "an",
  "each", "which", "she", "do", "how", "their", "if", "will", "up", "other",
  "about", "out", "many", "then", "them", "these", "so", "some", "her", "would",
  "make", "like", "him", "into", "time", "has", "look", "two", "more", "write",
  "go", "see", "number", "no", "way", "could", "people", "my", "than", "first",
  "water", "been", "call", "who", "oil", "its", "now", "find", "long", "down",
  "day", "did", "get", "come", "made", "may", "part", "over", "new", "sound",
  "take", "only", "little", "work", "know", "place", "year", "live", "me",
  "back", "give", "most", "very", "after", "thing", "our", "just", "name",
  "good", "sentence", "man", "think", "say", "great", "where", "help", "through",
  "much", "before", "line", "right", "too", "mean", "old", "any", "same",
  "tell", "boy", "follow", "came", "want", "show", "also", "around", "form",
  "three", "small", "set", "put", "end", "does", "another", "well", "large",
  "must", "big", "even", "such", "because", "turn", "here", "why", "ask",
  "went", "men", "read", "need", "land", "different", "home", "move", "try",
  "kind", "hand", "picture", "again", "change", "off", "play", "spell", "air",
  "away", "animal", "house", "point", "page", "letter", "mother", "answer",
  "found", "study", "still", "learn", "should", "world", "high", "every",
  "near", "add", "food", "between", "own", "below", "country", "plant",
  "last", "school", "father", "keep", "tree", "never", "start", "city",
  "earth", "eye", "light", "thought", "head", "under", "story", "saw", "left",
  "few", "while", "along", "might", "close", "something", "seem", "next",
  "hard", "open", "example", "begin", "life", "always", "those", "both",
  "paper", "together", "got", "group", "often", "run", "important", "until",
  "children", "side", "feet", "car", "mile", "night", "walk", "white", "sea",
  "began", "grow", "took", "river", "four", "carry", "state", "once", "book",
  "hear", "stop", "without", "second", "later", "miss", "idea", "enough",
  "eat", "face", "watch", "far", "really", "almost", "let", "above", "girl",
  "sometimes", "mountain", "cut", "young", "talk", "soon", "list", "song",
  "being", "leave", "family", "body", "music", "color", "stand", "sun",
  "question", "fish", "area", "mark", "dog", "horse", "birds", "problem",
  "complete", "room", "knew", "since", "ever", "piece", "told", "usually",
  "friend", "easy", "heard", "order", "red", "door", "sure", "become", "top",
  "ship", "across", "today", "during", "short", "better", "best", "however",
  "low", "hours", "black", "products", "happened", "whole", "measure",
  "remember", "early", "waves", "reached", "listen", "wind", "rock", "space",
  "weather", "warm", "bring", "field", "deep", "strong", "voice", "green",
  "street", "oops", "whole", "town", "past", "fast", "least", "checked",
  "simply", "pattern", "typed", "quick", "brown", "fox", "jumps", "lazy",
  "dog", "keyboard", "speed", "accuracy", "practice", "rhythm", "flow",
  "focus", "calm", "steady", "progress", "improve", "muscle", "memory",
  "finger", "position", "posture", "relax", "breathe", "smooth", "silent",
  "gentle", "crisp", "clean", "neat", "swift", "brisk", "slow", "rapid",
  "pace", "tempo", "beat", "sync", "fluent", "effort", "skill", "talent",
  "habit", "daily", "routine", "session", "minute", "seconds", "hours",
  "wpm", "score", "record", "result", "chart", "graph", "trend", "peak",
  "average", "median", "stable", "variable", "range", "value", "count",
  "total", "sum", "rate", "ratio", "level", "tier", "rank", "medal", "goal",
  "target", "aim", "plan", "method", "system", "process", "structure",
  "design", "layout", "theme", "color", "shade", "tone", "hue", "palette",
  "contrast", "bright", "dim", "glossy", "matte", "vivid", "pale", "deep",
  "warm", "cool", "neutral", "bold", "soft", "sharp", "round", "square",
  "angle", "curve", "line", "point", "dot", "grid", "cell", "row", "column",
  "table", "index", "label", "title", "header", "footer", "panel", "widget",
  "button", "icon", "image", "photo", "video", "audio", "text", "font",
  "style", "size", "width", "height", "margin", "border", "radius", "shadow",
];

const SHUFFLE_CACHE: Record<string, string[]> = {};

/** Fisher-Yates shuffle of a copy of the list. */
export function shuffledWords(): string[] {
  const arr = [...COMMON_WORDS];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Random word generator with low immediate repetition. */
export function makeWordStream(): () => string {
  let bag: string[] = [];
  let lastWord = "";
  return () => {
    if (bag.length === 0) {
      bag = shuffledWords();
    }
    let w = bag.pop()!;
    if (w === lastWord && bag.length > 1) {
      w = bag.pop()!;
      bag.push(w === lastWord ? w : w); // keep bag healthy
    }
    lastWord = w;
    return w;
  };
}

const PUNCT_TAILS: string[] = [
  ".", ".", ".", ",", ",", ",", "!", "?", ";", ":", "...", "—",
  "'", "\"", ")", "\"",
];

const PUNCT_HEADS: string[] = ["\"", "'", "(", "\"", "'"];

/** Apply monkeytype-like random punctuation to a word. */
export function applyPunctuation(word: string, isFirst: boolean, isLast: boolean, rnd = Math.random): string {
  let w = word;
  // occasional quote / paren wrapping
  if (rnd() < 0.06) {
    const head = PUNCT_HEADS[Math.floor(rnd() * PUNCT_HEADS.length)];
    const tail = head === "(" ? ")" : head === "\"" ? "\"" : head === "'" ? (rnd() < 0.5 ? "'" : "s") : "";
    if (head === "'" && tail === "s") {
      w = w + "'s";
    } else {
      w = head + w + tail;
    }
  } else if (rnd() < 0.05) {
    // hyphenated compound
    w = w + "-" + COMMON_WORDS[Math.floor(rnd() * COMMON_WORDS.length)];
  }
  // capitalization: sentence starts or random proper-ish
  if (isFirst || rnd() < 0.08) {
    w = w.charAt(0).toUpperCase() + w.slice(1);
  }
  // tail punctuation
  if (isLast || rnd() < 0.22) {
    const tail = PUNCT_TAILS[Math.floor(rnd() * PUNCT_TAILS.length)];
    // avoid double punctuation
    if (!/[.,!?;:—]$/.test(w)) w = w + tail;
  }
  return w;
}

/** Random number "word" of 1-4 digits. */
export function randomNumberWord(rnd = Math.random): string {
  const len = 1 + Math.floor(rnd() * 4);
  let s = "";
  for (let i = 0; i < len; i++) s += Math.floor(rnd() * 10);
  return s;
}
