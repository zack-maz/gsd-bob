# Phase 10: Documentation - Context

**Gathered:** 2026-07-04
**Status:** Ready for planning
**Mode:** `--auto` (Claude selected the recommended option for every gray area; each is logged in `10-DISCUSSION-LOG.md`)

<domain>
## Phase Boundary

Document the gsd-bob adapter to a standard a gsd-core maintainer could review — written **only now that the final 28-command set and model-neutralization behavior exist**. Deliver four artifacts, no more:

1. **DOCS-01 — Expanded `README.md`**: install, scope/modes, the **full 28-command list sourced from the generated `SUPPORT-ROSTER.md`** (no hand-invented commands or flags), and flagged gaps. Verified by doc-conformance against the roster.
2. **DOCS-02 — Per-command reference**: briefly explains each of the 28 emitted commands, verified to cover **exactly** the roster set (no missing/extra entries).
3. **DOCS-03 — Architecture doc**: explains the Bob adapter design versus traditional open-gsd — converter/descriptor model, capability-map gate, backend-neutrality, and `.planning/` interchange — reviewable as a standalone maintainer artifact.
4. **DOCS-04 — `MAINTAINING` runbook**: the repeatable gsd-core version-bump procedure with concrete steps, **sourced from the actual 1.5.0 → 1.6.1 re-vendor performed in Phase 7** (the roadmap mandate: reflect the real dance, not an aspirational one).

**In scope:** authoring/expanding the four docs above + a hermetic doc-conformance test that keeps the command lists honest against the generated roster.

**Out of scope (own phases / explicitly excluded):**
- Device-runnable acceptance steps for the new commands + neutrality invariant → Phase 11 (ACCEPT-*).
- Any change to the converter, installer, gate, or neutralization *machinery* — this phase writes docs, it does not touch emit logic.
- Regenerating or changing the roster contents — DOCS **consumes** `SUPPORT-ROSTER.md`; it is not re-derived here (Phase 9 already produced the 28-entry roster).
- The still-deferred long-tail commands (`transition`, `ai-integration-phase`, autonomy cluster, full ~70-skill parity) — documentation covers exactly the 28 emitted, matching the roster.

**Cross-cutting invariants (carried forward, must stay true):** backend-neutral (docs describe Bob-routes-the-model; zero model-brand literals asserted by the code, echoed by the docs), `.planning/` root-anchored, capability-map flag-gap contract (docs must present the conservative lower-bound defaults faithfully), test-deferred (doc-conformance is a hermetic test against the roster — no live Bob), and generated-not-hand-edited discipline (command lists/blurbs sourced from generated artifacts, never hand-typed).

</domain>

<decisions>
## Implementation Decisions

### Doc layout & naming
- **D-01 — Keep all four docs flat at the repo root**, matching the existing convention (`README.md`, `UPSTREAM.md`, `SUPPORT-ROSTER.md` already live at root). New/edited files: `README.md` (expand in place), `COMMANDS.md` (per-command reference, DOCS-02), `ARCHITECTURE.md` (DOCS-03), `MAINTAINING.md` (DOCS-04). Root is the maintainer-conventional home for README/MAINTAINING/CONTRIBUTING and keeps cross-links simple. *(Recommended default, `--auto`. Alternative: a `docs/` subdirectory for `ARCHITECTURE.md`/`COMMANDS.md`; planner may collapse there if it prefers — but the flat-root default matches the current repo.)*

### Sourcing & drift-proofing (the load-bearing decision — mirrors Phase 5/9 discipline)
- **D-02 — Command lists and per-command blurbs are sourced from generated artifacts, never hand-authored.** The 28-command list in both `README.md` (DOCS-01) and `COMMANDS.md` (DOCS-02) is derived from `SUPPORT-ROSTER.md` (itself generated from the `commands/gsd/` sources). Each command's one-line explanation in `COMMANDS.md` is sourced from that command's pristine frontmatter `description:` in `commands/gsd/<name>.md` — the single source of truth — so the reference can never silently drift from what installs. This extends the Phase 5 "README skill list sourced from generated `SUPPORT-ROSTER.md`" and Phase 9 "generated-not-hand-edited" patterns. *(Recommended default, `--auto`. Planner decides whether `COMMANDS.md` is produced by a small generator script — e.g. `scripts/generate-command-reference.cjs` — or authored-then-guarded; either way the blurbs trace to source frontmatter, not invention.)*

### Conformance verification (DOCS-01/DOCS-02 explicitly require it)
- **D-03 — Add one hermetic doc-conformance test** (e.g. `test/docs-conformance.test.cjs`) asserting, against the generated `SUPPORT-ROSTER.md` Supported set: (a) the `README.md` 28-command list equals the roster exactly, and (b) `COMMANDS.md` covers exactly the 28 roster entries — no missing, no extra — and fails loud on any drift. This is literally the DOCS-01 "verified by doc-conformance against the roster" and DOCS-02 "covers exactly the roster set with no missing or extra entries" gate, and it fits the project's test-deferred, generated-artifact posture. *(Recommended default, `--auto`.)*

### README expansion scope (DOCS-01)
- **D-04 — Expand `README.md` in place; do not rewrite it.** Keep the existing Install / Scope / Modes / Verification-posture sections intact. Grow the "Supported skills" section from the current 10 to the full **28** (grouped by cluster for readability — core loop, quality gates, milestone lifecycle, planning aids, context & maintenance — with the actual command names sourced per D-02/D-03), keep the flagged-gaps section (`gsd-autonomous`, `gsd-parallel-fanout`), and add a Documentation section linking the new `COMMANDS.md` / `ARCHITECTURE.md` / `MAINTAINING.md`. *(Recommended default, `--auto`.)*

### Architecture doc scope (DOCS-03)
- **D-05 — `ARCHITECTURE.md` explains the Bob adapter vs traditional open-gsd along the four axes the requirement names**, each grounded in a real code/artifact anchor:
  1. **Converter/descriptor model** — vendor-as-source, transform-at-emit; the `bob` runtime descriptor + the two vendored Bob converters (`gsd-core/bin/lib/runtime-artifact-conversion.cjs`) + the roster-agnostic staging loop (`src/installer/stage.cjs`).
  2. **Capability-map gate** — the conservative lower-bound defaults (no isolated subagents → sequential-inline; no structured prompts → `text_mode`), embodied in `gateArtifact`/`buildSupportRoster` in `src/bob-adapter.cjs`.
  3. **Backend-neutrality** — the model-neutralization pass (`neutralizeModelReferences`) + the NEUTRAL-03 zero-literal invariant; Bob owns model routing.
  4. **`.planning/` interchange** — the byte-compatible artifact contract that keeps Bob and Claude Code runtimes interchangeable.
  Reference `UPSTREAM.md` for the "move, not rewrite" framing. **NOTE — the original `CAPABILITY-MAP.md` no longer exists as a live file** (it was in `.planning/phases/01-bob-capability-mapping/` and was deleted in the v2.0-start cleanup, commit `459d992`). The gate section must source its rationale from `src/bob-adapter.cjs` + `SUPPORT-ROSTER.md` + the ROADMAP/PROJECT decision records (and, if a primary-source quote is wanted, `git show 459d992~1:.planning/phases/01-bob-capability-mapping/CAPABILITY-MAP.md`) — **do not cite a live `CAPABILITY-MAP.md` path**. *(Recommended default, `--auto`.)*

### MAINTAINING runbook scope (DOCS-04)
- **D-06 — Distill `07-REVENDOR-NOTES.md` into a repeatable, numbered `MAINTAINING.md` runbook** that reflects the real 1.5.0 → 1.6.1 dance (roadmap mandate). The procedure, in order: (1) capture the pre-vendor provenance anchor (git SHA, current `gsd-core/VERSION`, target version) + record the test baseline; (2) `npm pack @<target>` immutable-tarball fetch; (3) nuke-and-restage the curated `gsd-core/` subset; (4) re-inject the six Bob deltas via `scripts/apply-bob-patches.cjs` and prove idempotency; (5) re-sync any drifted `commands/gsd/*.md` sources to the target version (the Phase 9 lesson); (6) regenerate `SUPPORT-ROSTER.md` via `scripts/generate-support-roster.cjs`; (7) run the full suite, updating any golden with a recorded justification, treating pre-existing environmental failures as out of scope; (8) bump `gsd-core/VERSION` + update `UPSTREAM.md`'s targeted version and re-verify its file:line pointers. Cite the actual scripts and the Phase 7 artifacts as provenance. *(Recommended default, `--auto`.)*

### Packaging
- **D-07 — Ship only `README.md` in the npm tarball** (the existing `package.json` `files` allowlist already covers it). `ARCHITECTURE.md`, `COMMANDS.md`, and `MAINTAINING.md` are maintainer/GitHub-facing docs — leave them **out** of the `files` allowlist to keep the published package lean. *(Recommended default, `--auto`. If the planner judges `COMMANDS.md` belongs in the shipped package for end users, add it to the allowlist explicitly rather than by accident.)*

### Claude's Discretion
User delegated all areas (`--auto`). Every decision above is Claude's recommended option, logged in `10-DISCUSSION-LOG.md`. Downstream research/planning may refine *how* each is implemented — the exact generator-vs-guarded approach for `COMMANDS.md` (D-02), the precise doc-conformance test shape (D-03), the README cluster groupings (D-04), the architecture doc's depth/diagrams (D-05), and plan/wave batching of the four docs — **as long as the decisions above hold**. Research is explicitly invited to pressure-test: (a) whether frontmatter `description:` blurbs (D-02) are rich enough for DOCS-02's "briefly explains each," or whether a hand-written sentence per command is warranted (still guarded by the D-03 coverage test); and (b) whether the flat-root layout (D-01) or a `docs/` dir reads better at maintainer standard.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap (the phase contract)
- `.planning/ROADMAP.md` §"Phase 10: Documentation" — goal, the four deliverables, and the four success criteria (DOCS-01..04), plus the "written only once the final command set + neutralization exist; MAINTAINING sourced from Phase 7's real re-vendor" ordering.
- `.planning/REQUIREMENTS.md` — DOCS-01, DOCS-02, DOCS-03, DOCS-04 (verbatim requirement text).

### The source-of-truth artifacts docs must consume (D-02, D-03, D-04)
- `SUPPORT-ROSTER.md` (repo root) — the **generated** 28-supported / 2-unsupported roster; the single source for every command list in README (DOCS-01) and COMMANDS.md (DOCS-02). Never hand-edit; regenerate via the script below.
- `scripts/generate-support-roster.cjs` — regenerates the roster from the `commands/gsd/*.md` candidate set; referenced by MAINTAINING (DOCS-04).
- `commands/gsd/*.md` — the 28 pristine command sources; each file's frontmatter `description:` is the source-of-truth blurb for that command in COMMANDS.md (D-02).
- `README.md` (repo root) — expand in place (DOCS-01); currently lists only 10 commands.

### Architecture doc anchors (DOCS-03)
- `src/bob-adapter.cjs` — `gateArtifact` / `buildSupportRoster` (capability-map gate + roster) and `neutralizeModelReferences` (backend-neutrality); the live embodiment of the gate now that CAPABILITY-MAP.md is gone.
- `src/installer/stage.cjs` — the roster-agnostic converter/emit staging loop (converter/descriptor model axis).
- `gsd-core/bin/lib/runtime-artifact-conversion.cjs` — the vendored Bob converters (`convertClaudeCommandToBobCommand`/`Skill`); read-only in the move-not-rewrite story.
- `UPSTREAM.md` (repo root) — the upstream-move inventory + targeted gsd-core version; the "move, not rewrite" framing for the architecture doc, and a DOCS-04 touch-point (version bump).
- `test/model-neutrality.test.cjs` — the NEUTRAL-03 zero-literal invariant referenced by the backend-neutrality axis.
- **Deleted primary source (git-only):** the original `CAPABILITY-MAP.md` — recover with `git show 459d992~1:.planning/phases/01-bob-capability-mapping/CAPABILITY-MAP.md` if a verbatim gate-rationale quote is needed. **No live path exists** — do not link one.

### MAINTAINING runbook source (DOCS-04)
- `.planning/phases/07-gsd-core-1-6-1-sync/07-REVENDOR-NOTES.md` — the live raw log of the real 1.5.0 → 1.6.1 re-vendor; the mandated raw source for the runbook. Reflect this dance, not an aspirational one.
- `scripts/apply-bob-patches.cjs` — the idempotent six-delta re-injection script the runbook centers on.
- `gsd-core/VERSION` — the current targeted version marker (1.6.1) the runbook's version-bump step updates.
- `.planning/phases/07-gsd-core-1-6-1-sync/07-03-SUMMARY.md` / `07-PATTERNS.md` — supporting Phase 7 detail (drift policy, idempotency proof) if the raw notes need context.

### Prior context (carried forward)
- `.planning/phases/09-command-expansion/09-CONTEXT.md` — the 28-command roster contract, the "generated-not-hand-edited" and roster-derived disciplines DOCS reuses, and the version-consistency lesson feeding MAINTAINING.
- `.planning/phases/08-model-neutralization/08-CONTEXT.md` — the neutralization pass + NEUTRAL-03 invariant the architecture doc's backend-neutrality axis describes.
- `.planning/phases/07-gsd-core-1-6-1-sync/07-CONTEXT.md` — the re-vendor decisions (D-10/D-11, six-delta model) that shape the MAINTAINING runbook.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`SUPPORT-ROSTER.md` + `scripts/generate-support-roster.cjs`** — the roster is already generated and already reflects all 28 supported commands. DOCS consumes it directly; nothing to re-derive.
- **`README.md`** — an established, maintainer-standard structure already exists (Install / Scope / Modes / Supported skills / Flagged gaps / Verification posture / Documentation). Expand within this skeleton rather than starting fresh.
- **`commands/gsd/*.md` frontmatter `description:` fields** — ready-made, source-of-truth one-liners for the per-command reference; no prose invention required.
- **The `test/` hermetic suite conventions** (equivalence/golden/invariant tests) — the doc-conformance test (D-03) slots in as one more hermetic assertion in the same style.
- **`07-REVENDOR-NOTES.md`** — a 298-line as-it-happened log purpose-built to seed MAINTAINING; the runbook is a distillation, not a fresh authoring.

### Established Patterns
- **Generated-not-hand-edited** — every command list/blurb traces to a generated artifact or source frontmatter (Phase 5 README-from-roster, Phase 9 roster regeneration). DOCS extends this so the docs cannot drift from what installs.
- **Doc-conformance-as-test** — DOCS-01/02 name "verified by doc-conformance" / "covers exactly the roster set"; the project's answer to any such contract is a hermetic test (D-03), matching the count==28 / roster-reflects-28 assertions from Phase 9.
- **Move-not-rewrite framing** — `UPSTREAM.md` already frames the adapter as a small isolated move into gsd-core; the architecture doc restates this for a maintainer audience.
- **Reflect-the-real-dance** — the roadmap explicitly forbids an aspirational runbook; MAINTAINING is bound to the recorded Phase 7 steps.

### Integration Points
- **New/edited files:** `README.md` (expand), `COMMANDS.md` (new), `ARCHITECTURE.md` (new), `MAINTAINING.md` (new), `test/docs-conformance.test.cjs` (new), and — if the planner chooses generation — `scripts/generate-command-reference.cjs` (new).
- **No machinery changes:** converter, installer, gate, neutralization pass, and the roster generator are untouched — DOCS reads them, it does not modify them.
- **Packaging:** only `README.md` remains in the `package.json` `files` allowlist (D-07); the other docs stay repo-only.

</code_context>

<specifics>
## Specific Ideas

- **The whole phase is "consume, don't create."** The 28-command roster, the frontmatter blurbs, the neutralization invariant, and the re-vendor log all already exist. Phase 10's real work is *faithful documentation + a drift guard*, not new capability. Plan it as authoring guarded by one conformance test, not as engineering.
- **The drift guard (D-03) is the highest-leverage deliverable** — it's what makes the docs "maintainer standard" durable: the command lists provably cannot rot as the roster evolves. Treat it as a headline gate alongside the four docs.
- **Mind the dead `CAPABILITY-MAP.md` path.** The architecture doc is the one place tempted to cite it; it must instead point at `src/bob-adapter.cjs` (live) and the git-recoverable original. A doc that links a non-existent file would itself be a maintainer-standard failure.
- **MAINTAINING must read like a checklist a maintainer runs, not a narrative retrospective** — numbered steps, exact commands (`npm pack`, `node scripts/apply-bob-patches.cjs`, `node scripts/generate-support-roster.cjs`), and the "prove idempotency" / "treat pre-existing env failures as out of scope" guardrails from the real Phase 7 run.

</specifics>

<deferred>
## Deferred Ideas

- **Device-runnable acceptance steps for the docs / new commands / neutrality invariant** — Phase 11 (ACCEPT-*), insert-only over the frozen v1 AC-01..AC-26. Not authored here.
- **A `CONTRIBUTING.md` / full contributor onboarding guide** — beyond the four DOCS-* deliverables; a plausible future doc, not in this phase's scope.
- **Auto-generating `ARCHITECTURE.md` diagrams or an fully generated COMMANDS.md pipeline** — if the planner opts for hand-authored docs with a coverage guard instead of a generator, a richer generation pipeline is a future enhancement, not a Phase 10 requirement.
- **Documenting the still-deferred long-tail commands** (`transition`, `ai-integration-phase`, autonomy cluster, ~70-skill parity) — they are not emitted, so they are correctly absent from the 28-command docs; documenting them waits until they are vendored.

*(No scope-creep ideas surfaced — discussion stayed within the DOCS-01..04 boundary.)*

</deferred>

---

*Phase: 10-documentation*
*Context gathered: 2026-07-04*
