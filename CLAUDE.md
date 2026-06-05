# Claude Code Rules

Follow the project rules in `AGENTS.md`. This file exists so Claude Code can discover the same repository guidance.

## Claude-Specific Notes

- Read `AGENTS.md` before making code changes.
- Use `pnpm` commands only; do not introduce npm, Yarn, or Bun lockfiles.
- Keep Material Web behind Aoi wrapper components in `app/components/aoi/`.
- Prefer small, verifiable edits and preserve unrelated working-tree changes.
- Run `pnpm typecheck` after code changes when practical, and report any skipped checks.
- Reply in Simplified Chinese when the user writes in Chinese, unless they request another language.
