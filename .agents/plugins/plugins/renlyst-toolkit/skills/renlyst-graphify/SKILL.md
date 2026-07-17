---
name: renlyst-graphify
description: Navigate and maintain the fresh Renlyst TypeScript/Expo knowledge graph before codebase investigation or source changes.
---

# Renlyst Graphify

Read `CODEX_CONTEXT.md` and use the portable graph at `graphify-out/`. The Swift repository is read-only migration evidence only; never copy or merge its graph into this project.

Use `../../vendor/graphify/` as the version-pinned Graphify reference.

1. For a codebase question, run `graphify query "<question>"` first when `graphify-out/graph.json` exists.
2. Use `graphify explain "<concept>"` for a focused node and `graphify path "<A>" "<B>"` for relationships before broad source searching.
3. Use `graphify-out/wiki/index.md` for broad orientation. Read `GRAPH_REPORT.md` only when scoped graph commands are insufficient.
4. After source changes, run `graphify update .`; do not commit cache, `memory/`, `reflections/`, temporary extraction, or local run-history output.
5. If a full rebuild is needed, produce the graph from this repository’s TypeScript/Expo sources and verify its file nodes do not include `.swift`, `.xcodeproj`, or the Swift reference directory.

Keep portable outputs (`graph.json`, report, HTML graph, manifest, labels, and wiki) tracked.
