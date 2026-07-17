# Design

> Source of truth for Renlyst typography, color, motion, layout, and component behavior.
> Read this before changing UI. Do not rewrite these decisions to excuse a drifting implementation.

## Aesthetic direction

Editorial clinical momentum: the visible progress and satisfying state changes of a learning app, the breathing room and typography of a premium journal, and the precision of a clinical reference.

No mascot is used. Progress visualizes the learner's real mastery, streak, and due-review state; Renlyst does not invent XP, hearts, gems, or leaderboards.

## Dials

- DESIGN_VARIANCE: 8 / 10
- MOTION_INTENSITY: 6 / 10
- VISUAL_DENSITY: 4 / 10

## Type stack

- Display: Newsreader, weights 500–700, reserved for Today titles and drug names.
- Body and controls: Manrope, weights 400–800.
- Arabic: Noto Sans Arabic, weights 400–800, with native RTL shaping.
- Data numerals: Manrope with tabular numerals where supported.
- At most two Latin families appear on one screen. Arabic replaces, never joins, the Latin body face.

Banned: Inter, Roboto, Arial, decorative serif body copy, all-caps sentences, and centered long-form clinical text.

## Color tokens

The palette is warm stone plus three semantically constrained product colors:

| Token    | Light     | Dark      | Use                                     |
| -------- | --------- | --------- | --------------------------------------- |
| canvas   | `#F7F3EC` | `#101A24` | App background                          |
| surface  | `#FCFAF6` | `#172432` | Raised/selected regions                 |
| ink      | `#142B46` | `#EDF3F4` | Primary text                            |
| mutedInk | `#536477` | `#A9B7C0` | AA-compliant secondary text             |
| line     | `#D8D3C9` | `#2B3C49` | Dividers and boundaries                 |
| coral    | `#BF4533` | `#E36B58` | Primary action and active progress      |
| aqua     | `#17797E` | `#55B8B9` | Clinical information and verified state |
| saffron  | `#C68A21` | `#E8B653` | Due, attention, and streak state        |
| success  | `#237A54` | `#52B788` | Correct/completed state                 |
| danger   | `#AA3945` | `#E86A76` | Destructive and unsafe state            |

Coral is the dominant action accent. Aqua and saffron are semantic, not decorative accents.

Banned: pure black/white, pharmacy green as brand color, purple/cyan gradients, gray-on-color text, glassmorphism, and confetti.

## Shadows and shape

- Primary surfaces use a 1 px tinted boundary and a low-opacity ink-blue diffusion shadow.
- Radius scale: 10, 16, 24, and 32. Pills are reserved for filters, status, and compact actions.
- Cards exist only when a boundary improves comprehension. Rows and whitespace carry most library and clinical structure.
- No nested cards deeper than one level.

## Motion

- Tap spring: stiffness 400, damping 30.
- Standard spring: stiffness 100, damping 20.
- Page/hero spring: stiffness 60, damping 18.
- Animate transform and opacity only; do not animate layout dimensions.
- Haptics are limited to capture, answer commitment, completion, destructive confirmation, and backup completion.
- Every animation uses `ReduceMotion.System`; Reduce Motion produces immediate state changes without lost meaning.
- No bounce, elastic, perpetual decoration, or celebratory particles.

## Layout

- One-handed iPhone-first composition; all primary actions remain in the lower reachable region when practical.
- Minimum horizontal gutter: 20 pt phone, 32 pt tablet.
- Minimum touch target: 44 × 44 pt with at least 8 pt between adjacent targets.
- Today is an asymmetric vertical learning path with one dominant next action.
- Library is an editorial index: search, scope, summary, and divided rows—not a dashboard grid.
- Clinical profiles use one continuous page with topic destinations and precise data sections.
- Sheets are used for Capture, Add, filters, short editors, and confirmations.
- Large Text may reflow and stack controls; no fixed-height text containers.

## Component inventory

- Custom: `AppText`, `Screen`, `PressableScale`, `PrimaryButton`, `IconButton`, `LearningPath`, `DrugRow`, `TopicRow`, `ClinicalValue`, `EmptyState`, `InlineError`, `SkeletonBlock`, `ConfirmSheet`.
- Native composition references: shadcn semantic state patterns and Magic UI motion discipline, translated into React Native controls without web runtime dependencies.
- Icons: isolated platform-symbol wrapper with meaningful accessibility labels; no emoji icons.

## Brand voice

- Calm, specific, and encouraging without childishness.
- Prefer direct verbs: “Review furosemide,” “Capture a package,” “Export complete backup.”
- Clinical uncertainty is explicit. Educational tools never imply diagnosis or individualized prescribing.
- Banned copy: elevate, unleash, seamless, next-gen, revolutionary, gamify your journey.

## Accessibility floor

- WCAG 2.2 AA contrast for body text and UI boundaries.
- Dynamic Type / font scaling without clipping through accessibility sizes.
- VoiceOver names, values, hints, roles, and logical traversal on every workflow.
- English LTR and Arabic RTL are first-class layouts, not mirrored afterthoughts.
- State is never communicated by color alone.
- Loading, empty, error, offline, denied-permission, and destructive states are designed inline.

## Last updated

2026-07-17: validated the dark/light and English/Arabic web fallbacks; decorative web icons are hidden from tab accessibility names while native platform symbols remain the iOS/Android source of truth.

2026-07-17 — established the Expo rebuild design system and approved mixed visual direction.
