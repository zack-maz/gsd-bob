# Phase 10: Documentation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-04
**Phase:** 10-documentation
**Areas discussed:** Doc layout & naming, Sourcing & drift-proofing, Conformance verification, README expansion scope, Architecture doc scope, MAINTAINING runbook scope, Packaging
**Mode:** `--auto` — Claude selected the recommended (first / marked) option for every gray area; no interactive prompts were shown.

---

## Doc layout & naming

| Option | Description | Selected |
|--------|-------------|----------|
| Flat at repo root | `README.md` + `COMMANDS.md` + `ARCHITECTURE.md` + `MAINTAINING.md` at root, matching existing `UPSTREAM.md`/`SUPPORT-ROSTER.md` | ✓ |
| `docs/` subdirectory | Move `ARCHITECTURE.md`/`COMMANDS.md` under `docs/`, README + MAINTAINING at root | |

**User's choice:** Flat at repo root (recommended default).
**Notes:** [auto] Doc layout — Q: "Where do the new docs live?" → Selected: "Flat at repo root" (matches current repo convention; simplest cross-links). `docs/` left as a planner-refinable alternative.

---

## Sourcing & drift-proofing

| Option | Description | Selected |
|--------|-------------|----------|
| Sourced from generated artifacts | Command lists from `SUPPORT-ROSTER.md`; per-command blurbs from `commands/gsd/*.md` frontmatter `description:` | ✓ |
| Hand-authored prose | Write all 28 command descriptions by hand | |

**User's choice:** Sourced from generated artifacts / source frontmatter (recommended default).
**Notes:** [auto] Sourcing — Q: "How are the command lists/blurbs produced?" → Selected: "Sourced from the generated roster + source frontmatter" (drift-proof; extends Phase 5/9 generated-not-hand-edited discipline).

---

## Conformance verification

| Option | Description | Selected |
|--------|-------------|----------|
| Add a hermetic doc-conformance test | `test/docs-conformance.test.cjs` asserts README + COMMANDS cover exactly the 28-entry roster, fails loud on drift | ✓ |
| Manual review only | Rely on human review to keep docs in sync with the roster | |

**User's choice:** Add a hermetic doc-conformance test (recommended default).
**Notes:** [auto] Conformance — Q: "How is DOCS-01/02 roster-conformance verified?" → Selected: "Hermetic doc-conformance test" (literally what DOCS-01/02 require; matches test-deferred posture).

---

## README expansion scope

| Option | Description | Selected |
|--------|-------------|----------|
| Expand in place | Keep existing sections; grow Supported skills 10→28 grouped by cluster; add doc links | ✓ |
| Full rewrite | Rewrite README from scratch | |

**User's choice:** Expand in place (recommended default).
**Notes:** [auto] README — Q: "Expand or rewrite the README?" → Selected: "Expand in place" (preserves the maintainer-standard skeleton already present; lower risk).

---

## Architecture doc scope

| Option | Description | Selected |
|--------|-------------|----------|
| Four-axis, code-anchored | Cover converter/descriptor model, capability-map gate, backend-neutrality, `.planning/` interchange — each anchored to live code | ✓ |
| High-level overview only | A short prose summary without code anchors | |

**User's choice:** Four-axis, code-anchored (recommended default).
**Notes:** [auto] Architecture — Q: "What does ARCHITECTURE.md cover?" → Selected: "The four axes the requirement names, each grounded in a real code/artifact anchor." Flagged: the original `CAPABILITY-MAP.md` was deleted in the v2.0 cleanup (commit `459d992`); the gate section must source from `src/bob-adapter.cjs` + git history, not a live path.

---

## MAINTAINING runbook scope

| Option | Description | Selected |
|--------|-------------|----------|
| Distill the real re-vendor log | Numbered, command-exact runbook distilled from `07-REVENDOR-NOTES.md`, citing the actual scripts | ✓ |
| Aspirational generic procedure | A clean idealized version-bump procedure | |

**User's choice:** Distill the real re-vendor log (recommended default).
**Notes:** [auto] MAINTAINING — Q: "How is the version-bump runbook authored?" → Selected: "Distill `07-REVENDOR-NOTES.md` into a repeatable numbered runbook." Honors the roadmap mandate: reflect the real dance, not an aspirational one.

---

## Packaging

| Option | Description | Selected |
|--------|-------------|----------|
| Ship README only | Keep the existing `files` allowlist; maintainer docs stay repo-only | ✓ |
| Ship all docs | Add ARCHITECTURE/COMMANDS/MAINTAINING to the npm tarball | |

**User's choice:** Ship README only (recommended default).
**Notes:** [auto] Packaging — Q: "Which docs ship in the npm package?" → Selected: "README only" (keeps the published tarball lean; maintainer docs are GitHub-facing). Planner may add `COMMANDS.md` explicitly if end users need it.

---

## Claude's Discretion

User delegated all areas via `--auto`. Every decision above is Claude's recommended option. Downstream research/planning retains flexibility on: generator-vs-guarded approach for `COMMANDS.md`, the exact doc-conformance test shape, README cluster groupings, architecture-doc depth/diagrams, and plan/wave batching — as long as the CONTEXT.md decisions hold.

## Deferred Ideas

- Device-runnable acceptance steps for the docs / new commands / neutrality invariant → Phase 11 (ACCEPT-*).
- A `CONTRIBUTING.md` / contributor onboarding guide — beyond the four DOCS-* deliverables.
- A richer auto-generation pipeline for `ARCHITECTURE.md` diagrams or a fully generated `COMMANDS.md` — future enhancement.
- Documenting the still-deferred long-tail commands — waits until they are vendored/emitted.
