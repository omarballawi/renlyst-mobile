# Renlyst agent instructions

Read the exact versioned Expo documentation at https://docs.expo.dev/versions/v57.0.0/ before writing Expo or React Native code.

## Durable project context

Before a meaningful change, read `CODEX_CONTEXT.md`. Use `PRODUCT.md` for product decisions, `DESIGN.md` for visual decisions, and `MIGRATION_PARITY.md` for the Swift-to-Expo behavioral/data contract. The Swift repository at `../pharmashift` is read-only evidence only: never modify it, import Swift at runtime, or copy its Graphify output here.

## Project-local Codex toolkit

The repository-local marketplace is `.agents/plugins/marketplace.json`; its `renlyst-toolkit` plugin contains four active wrappers:

- `renlyst-ui` for adaptive React Native UI/UX work.
- `renlyst-graphify` for codebase navigation and graph maintenance.
- `renlyst-stability` for safe crash reduction and diagnostics.
- `renlyst-release` for unsigned preview verification and publishing.

Apply the same constraints even if the plugin is not installed. The vendored sources are version-pinned in `VENDORED_SKILLS.md`. shadcn and Magic UI are reference-only: never install them, Tailwind, Next.js, or any web component runtime into Expo. Translate their semantic-state, composition, accessibility, and motion principles to the existing React Native components.

## Graphify

For codebase questions, first run `graphify query "<question>"` when `graphify-out/graph.json` exists. Use `graphify explain` and `graphify path` for scoped follow-up; use `graphify-out/wiki/index.md` for broad navigation. After source changes, run `graphify update .`. Keep portable RN graph outputs tracked, but do not commit Graphify caches, temporary extraction output, memory, reflections, or run history. Verify the graph names TypeScript/Expo files and no Swift files.

## Privacy and stability

Crash diagnostics are local and privacy-safe. They may contain only app/build version, platform, normalized route, timestamp, generic error metadata, and component stack. They must never contain raw exception text, drug data, backups, images, API keys, provider configuration, searches, or shift/encounter content; retain at most ten reports and never upload automatically. Native process terminations require device logs and safe reproduction steps.

## Verification and releases

Run `pnpm run release:verify` before a release. The final unsigned IPA must be rebuilt from the finalized release commit by `.github/workflows/quality-and-unsigned-ios.yml`, inspected for `Payload/*.app/Info.plist`, accompanied by a SHA-256 file, and published as a prerelease. Preview notes must state `com.renlyst.app.next`, unsigned/sideload-only installation, and non-production status.
