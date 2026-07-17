---
name: renlyst-ui
description: Design, build, review, or polish the Renlyst React Native/Expo interface using the repository design system and mobile-native quality checks.
---

# Renlyst UI

Read `PRODUCT.md`, `DESIGN.md`, `MIGRATION_PARITY.md`, and `CODEX_CONTEXT.md` before changing a user-facing flow. Renlyst is an adaptive iOS/Android React Native app, not a web app.

Use `../../vendor/ui-ux-pro-max/`, `../../vendor/impeccable/`, and `../../vendor/frontend-god-mode/` as the version-pinned design references. First choose the applicable mobile guidance and then perform the relevant quality pass: hierarchy and states for a new flow, accessibility and RTL for a refinement, or regression/state review for a fix.

## Runtime constraints

- Preserve the existing Expo/React Native component system, theme tokens, `AppText`, native navigation, safe areas, and Reduce Motion behavior.
- Apply the editorial clinical-momentum direction in `DESIGN.md`: composed, warm, precise, and premium; never mascot-like or gamified decoration.
- Treat Arabic, RTL, large text, dark mode, screen readers, denied permissions, empty/loading/error states, and 44 pt minimum targets as release-quality constraints.
- `../../vendor/shadcn/` and `../../vendor/magic-ui/` are reference-only. Translate their semantic-state, component-composition, accessibility, and purposeful-motion principles into React Native components. Never install shadcn, Tailwind, Magic UI, Next.js, or web runtime dependencies into this Expo app.

## Finish checklist

Run the applicable tests and `pnpm typecheck`. For a visual change, inspect both light/dark and English/Arabic layouts where the affected screen supports them. Record any device-only validation limitation in `MIGRATION_PARITY.md` or `CODEX_CONTEXT.md` instead of claiming it passed.
