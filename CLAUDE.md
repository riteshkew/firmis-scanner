# Firmis Scanner — Claude Code Rules (Public Repo)

## Repo Structure

This is the **PUBLIC open-source** repo. It contains M0 + M1 code only.

| Folder | Remote | Repo | Visibility | Content |
|--------|--------|------|------------|---------|
| `~/github/firmis-scanner/` (this) | `origin` → `riteshkew/firmis-scanner` | **PUBLIC** | M0 + M1 only |
| `~/github/firmis-engine/` | `origin` → `riteshkew/firmis-engine` | **PRIVATE** | All code (M0–M5) |

### Rules (MANDATORY, NO EXCEPTIONS)

1. **This repo is PUBLIC.** Every commit is visible to the world.
2. **NEVER add M2+ code here.** No fix engine, pentest engine, rugpull detection, monitor, or cloud code.
3. **NEVER add a remote pointing to `firmis-engine`** in this folder.
4. **All development happens in `~/github/firmis-engine/`.** This repo receives cherry-picked public-safe commits only.
5. **Push normally:** `git push origin main`

### Files That Must NEVER Appear Here

- `src/fix/` — Fix engine
- `src/pentest/` — Pentest engine
- `src/rugpull/` — Rug pull detection
- `src/monitor/` — Runtime monitor
- `src/cloud/` — Cloud/telemetry
- `src/types/fix.ts`, `src/types/pentest.ts`
- `src/cli/commands/fix.ts`, `src/cli/commands/pentest.ts`, `src/cli/commands/monitor.ts`
- `test/unit/fix/`, `test/unit/pentest/`, `test/unit/rugpull/`
- `test/integration/fix-*.test.ts`, `test/integration/pentest-*.test.ts`, `test/integration/rugpull-*.test.ts`
- `test/fixtures/fix-targets/`, `test/fixtures/pentest/`
- `test/helpers/`
- `firmis-lasso-plugin/`

### Verification

After any cherry-pick, always verify:
```bash
ls src/fix src/pentest src/rugpull 2>/dev/null && echo "DANGER: M2 files!" || echo "CLEAN"
```

## Development

- Stack: TypeScript / Node.js ESM / Vitest
- Pre-flight: `npx tsc --noEmit && npx vitest run`
- Max 50 lines/function, max 300 lines/file
- No `any` types, explicit return types on exports

## What's Here

- 8 platform analyzers (claude, mcp, codex, cursor, crewai, autogpt, openclaw, nanobot)
- 209 YAML rules across 17 files, 16 threat categories
- YARA-like pattern matching engine
- Secret detection (60 rules)
- OSV vulnerability scanning
- Discovery + Agent BOM (CycloneDX 1.7)
- CI pipeline command
- Commands: scan, list, validate, discover, bom, ci
