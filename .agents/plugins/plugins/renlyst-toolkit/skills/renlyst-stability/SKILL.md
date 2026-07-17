---
name: renlyst-stability
description: Diagnose Renlyst crashes and regressions with reproducible reductions and privacy-safe local diagnostics.
---

# Renlyst Stability

Read `CODEX_CONTEXT.md`, `MIGRATION_PARITY.md`, `src/diagnostics/`, and `.github/ISSUE_TEMPLATE/bug_report.yml` before working on a crash or reliability report.

## Privacy boundary

Diagnostics may retain only app/build version, platform, normalized route, timestamp, generic error metadata, and component stack. Never capture or transmit drug data, backups, images, API keys, provider configuration, search input, shift/encounter content, or raw exception text. Retain no more than ten local reports. Nothing uploads automatically.

## Workflow

1. Reduce the report to safe, deterministic interface steps.
2. Check root-boundary recovery actions: retry, return home, copy diagnostics, and open the GitHub bug form.
3. Test the pure report serializer and the actual failing path where possible.
4. Treat native process termination as device-log-driven: document the device, OS, and safe reproduction steps; do not imply the JavaScript boundary captured it.
5. Run `pnpm run release:verify` when the change can affect packaging or runtime startup.
