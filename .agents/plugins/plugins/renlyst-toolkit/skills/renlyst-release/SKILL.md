---
name: renlyst-release
description: Validate, build, inspect, package, and publish a Renlyst unsigned preview through GitHub Actions.
---

# Renlyst Release

Read `CODEX_CONTEXT.md`, `MIGRATION_PARITY.md`, `.github/workflows/quality-and-unsigned-ios.yml`, and `VENDORED_SKILLS.md` before a release.

Use `../../vendor/github/`, `../../vendor/gh-fix-ci/`, and `../../vendor/yeet/` as the version-pinned GitHub workflow references.

1. Confirm the release target is a committed, pushed Expo branch and run `pnpm run release:verify` locally.
2. Trigger or wait for the GitHub macOS unsigned-iOS workflow from that final commit; do not reuse an IPA made before the release commit.
3. Download the IPA, inspect that it contains `Payload/*.app/Info.plist`, and calculate a SHA-256 file beside it.
4. Publish a GitHub prerelease with the IPA and its checksum. Notes must state the preview bundle ID, unsigned/sideload requirement, and non-production status.
5. Do not publish secrets, local `artifacts/`, or device diagnostics. Record validation limits truthfully.
