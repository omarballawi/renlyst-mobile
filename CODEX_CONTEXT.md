# Renlyst Codex context

This is the durable handoff for the standalone React Native/Expo project at `C:\Users\oooom\Documents\renlyst-mobile`. It replaces hidden conversation memory. Treat it as the practical source of truth alongside the product, design, and migration documents it links to.

## Product and migration contract

- `PRODUCT.md` defines the offline-first pharmacy learning product and `## Platform: adaptive`: one TypeScript codebase, native-feeling iOS and Android behavior.
- `DESIGN.md` is the visual source of truth: an editorial, clinically composed, premium learning tool. It is deliberately not a mascot-heavy clone of Duolingo. The motivating qualities are clarity, momentum, encouragement, and short focused sessions.
- `MIGRATION_PARITY.md` defines the Swift schema-v5 backup and behavioral contract. The old `../pharmashift` repository is read-only migration evidence, never a runtime dependency.
- Preserve every backup field, unknown future field, Arabic/UTF-8 text, image reference, deletion policy, and protected-key exclusion. Offline behavior is complete behavior.

## Technical baseline

- Expo SDK 57, React Native 0.86, TypeScript, Expo Router, SQLite, React Query, and pnpm 11.9.0.
- Preview identity: display name `Renlyst Next`, bundle/package `com.renlyst.app.next`, marketing version `0.3.0`, native build number `3`. A production switch uses `RENLYST_APP_VARIANT=production` and must not happen for a preview. Every published preview must increment both values and use a versioned IPA filename so sideloaded builds cannot be confused.
- Full AI profile generation is photo-first: a saved or newly selected package image is required, Gemini vision through the protected OpenRouter configuration establishes package identity, and every populated clinical/Arabic section remains unverified until the user selects and saves it. New photos append transactionally and never delete existing package evidence.
- Haptics and short local UI sounds are independently configurable on You. Sounds honor silent mode, do not record, do not play in the background, and mix without interrupting other audio.
- Verification: `pnpm run release:verify` runs TypeScript, zero-warning ESLint, Jest, Prettier, Expo Doctor, and fresh iOS/Android bundle exports.
- Device-only limits must be recorded truthfully: physical iPhone install, a real Swift backup on-device, screen-reader/large-text/reduce-motion/denied-permission passes, and Maestro simulator/device execution are not implied by web or CI success.

## Local Codex toolkit

The project-local marketplace is `.agents/plugins/marketplace.json`; its plugin is `.agents/plugins/plugins/renlyst-toolkit`.

- `renlyst-ui` loads the product and design contract, then applies pinned mobile-native UI quality references.
- `renlyst-graphify` queries the RN graph before broad exploration and updates it after source changes.
- `renlyst-stability` uses reproducible reductions and strict privacy-safe diagnostics.
- `renlyst-release` validates, builds, inspects, packages, and publishes an unsigned preview through GitHub Actions.

`VENDORED_SKILLS.md` records all complete, public, version-pinned copies and hashes. They do not refresh automatically. shadcn and Magic UI are reference-only: translate their state, composition, accessibility, and purposeful-motion ideas to React Native; never add their web runtimes, Tailwind, or Next.js to Expo.

To install this non-default marketplace once on a development machine:

```powershell
codex plugin marketplace add C:\Users\oooom\Documents\renlyst-mobile\.agents\plugins
```

Restart Codex, install `renlyst-toolkit` from the `renlyst-local` marketplace, then open a new task and confirm the four wrapper skills are visible. This repository never contains GitHub OAuth, Codex installation state, or connector credentials; those remain machine-level.

## Graphify

`graphify` CLI v0.9.8 is available locally. `graphify-out/` is generated only from this Expo repository; Swift graph output must never be copied in because it would poison TypeScript code queries. Commit portable graph output (`graph.json`, `GRAPH_REPORT.md`, HTML graph, manifest, labels, and wiki) while ignoring cache, temporary extraction, memory, reflections, and local history.

For code questions, run `graphify query "<question>"` first; use `graphify explain`, `graphify path`, and the wiki for focused follow-up. After source changes, run `graphify update .`. A healthy graph points to TypeScript/Expo paths and contains no `.swift` or Swift-reference paths.

## Diagnostics and privacy

`src/diagnostics/AppCrashBoundary.tsx` protects the root UI. The local file store retains no more than ten reports with only timestamp, app/build version, platform, normalized route, generic error class/message, and component stack. The original exception text is intentionally never saved because it may contain private data.

The recovery surface lets a user retry, return home, copy the safe report, or manually open the public GitHub issue form. No telemetry or automatic upload exists. Native process terminations are not JavaScript render errors; investigate them from device logs with only safe reproduction steps.

## Release procedure

1. Make and commit all source, graph, documentation, and plugin changes. Keep `artifacts/` local and ignored.
2. Run `pnpm run release:verify` locally unless the release owner explicitly defers quality and device acceptance to a later pass; record any deferral truthfully in the release notes.
3. Push the final commit and manually dispatch `.github/workflows/quality-and-unsigned-ios.yml`. Quality/export verification stays local; the manual macOS workflow performs only the unsigned device build, archive verification, and artifact upload.
4. Download the IPA from that exact run, verify `Payload/*.app/Info.plist`, and generate its SHA-256 file.
5. Publish a public prerelease with the IPA and checksum. Release notes must say it uses `com.renlyst.app.next`, is unsigned and needs sideloading (for example AltStore), and is non-production/pre-release software.

The earlier successful workflow run `29602770663` is evidence that the workflow works, not an artifact eligible for a new release. Every release must rebuild from its own final commit.
