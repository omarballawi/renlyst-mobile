# Renlyst

Renlyst is an offline-first pharmacy learning companion for pharmacy students. It turns medicine packages, trusted references, shift observations, and deliberate practice into a private, searchable body of clinical knowledge.

## Platform: adaptive

Renlyst uses React Native and Expo to deliver native-feeling iOS and Android experiences from one TypeScript codebase. Platform conventions are respected while the product, privacy model, offline behavior, bilingual Arabic/English support, and data contract remain identical.

## Product model

An active-ingredient profile owns clinical knowledge. Many marketed brand products may attach to that profile with their own package photo, manufacturer, strength, form, route, leaflet, country, and shelf evidence. Removing a brand does not remove the ingredient profile. Removing a profile follows an explicit Keep History or Erase History policy.

## Core jobs

1. Capture a known or unknown medicine package quickly, then identify or complete it later.
2. Build and maintain rich English and Arabic drug profiles with transparent source quality.
3. Review the most useful item now through mastery-aware spaced repetition.
4. Practice active recall in exactly five-question sessions across every supported mode.
5. Record shifts and privacy-safe encounters, then generate editable training reports.
6. Import, export, and recover all local data without a hosted account.
7. Generate a complete unverified English/Arabic learning profile from a required medicine package image, without manually filling identity fields first.

## Navigation

- Today: one priority action, learning path, weekly rhythm, and recent profiles.
- Library: bilingual search, scopes, sorting, knowledge map, compare, shelf quest, imports, and profile/brand management.
- Practice: Daily Refresh, Mistake Vault, cached AI pack, and all practice modes.
- You: learning record, shifts, encounters, reports, reminders, providers, appearance, accessibility, and Backup & Data.
- Add/Capture is a sheet, not a fifth tab.

## Product principles

- Offline behavior is complete behavior; providers enhance rather than gate the app.
- The Swift schema-v5 complete JSON backup is the rollback contract.
- Every imported value is preserved, including fields the current UI does not yet render.
- Arabic, UTF-8, RTL, accessibility, dark mode, and Reduce Motion are release gates.
- API credentials are protected device settings and are never included in backups.
- Gemini package generation is explicit and photo-first; selected photos are resized before provider transfer, and generated facts remain unverified until reviewed and saved.
- Haptics and subtle local sounds are optional, independently configurable feedback—not learning rewards.
- Renlyst is educational software. Clinical tools show equations, assumptions, sources, and caution states.
