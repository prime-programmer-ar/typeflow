# Contributing to TypeFlow

Thanks for your interest in improving TypeFlow! 🎉

## Getting set up

```bash
bun install        # or npm install
bun run dev        # or npm run dev
```

The dev server runs at <http://localhost:3000>.

## Before opening a PR

1. **Fork & branch** — create a branch named after your change
   (`feature/pace-caret`, `fix/theme-flash`, …).
2. **Keep it typed** — the project typechecks with `bunx tsc --noEmit`.
3. **Lint** — `bun run lint` must pass.
4. **Test manually** — run a typing test end-to-end (words mode + real-world mode)
   and check the result screen and stats view still work.
5. **Small diffs** — one logical change per pull request.

## Ideas that would be great contributions

- New themes (add them in `src/lib/typing/themes.ts` + `globals.css`)
- More sentence banks / languages for Real World mode
- Leaderboard via an optional anonymous device-link code
- Static-export build for GitHub Pages

## Reporting bugs

Open an issue with:
- what you did, what you expected, what happened
- your browser + OS
- console output (F12), if any

Thanks! ⌨️
