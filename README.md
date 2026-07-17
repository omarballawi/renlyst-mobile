# Renlyst Mobile

The independent React Native + Expo + TypeScript rebuild of Renlyst.

## Requirements

- Node.js 22.13 or newer
- pnpm 11.9
- Expo SDK 57-compatible iOS or Android toolchain for native builds

## Local commands

```bash
pnpm install
pnpm start
pnpm typecheck
pnpm lint
pnpm test
pnpm verify
pnpm export:ios
pnpm export:android
pnpm run release:verify
```

## Native iOS packaging

Windows can validate the Expo configuration and export JavaScript bundles, but it cannot generate an iOS native project or build an IPA because that requires Xcode on macOS. The checked-in GitHub workflow is the reproducible macOS path: it runs `expo prebuild`, installs CocoaPods, performs an unsigned `xcodebuild`, packages the app, and uploads `Renlyst-Next-unsigned.ipa` for re-signing through AltStore/AltServer.

With a preview build installed in an iOS Simulator or Android emulator, run the black-box flows with:

```bash
pnpm e2e:maestro
```

The Maestro flows reset only the preview app (`com.renlyst.app.next`) and cover capture/search, five-question practice startup, backup navigation, and live Arabic RTL switching.

The default preview identifiers are `com.renlyst.app.next` on iOS and Android so this app can coexist with the Swift version. Production identifiers are enabled only with `RENLYST_APP_VARIANT=production` after parity acceptance.

User backups and imported clinical data are deliberately gitignored. Provider credentials live in the device secure store and are never exported.

The `Quality, exports, and unsigned iOS` GitHub workflow runs the full quality gate, uploads separate iOS and Android Expo exports, builds the preview iOS target without code signing, verifies the IPA archive, and uploads an unsigned IPA suitable for re-signing through AltStore/AltServer. It deliberately uses the preview bundle identifier and does not switch the production identifier.

See [PRODUCT.md](./PRODUCT.md), [DESIGN.md](./DESIGN.md), and [MIGRATION_PARITY.md](./MIGRATION_PARITY.md) before changing behavior or UI.
