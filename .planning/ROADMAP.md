# Roadmap: GSD for IBM Bob (gsd-bob)

gsd-bob makes the runtime-neutral GSD planning framework run natively inside IBM Bob, emitting the same `.planning/` artifact contract so Bob and Claude Code stay interchangeable. Backend-neutrality, the capability-map flag-gap contract, `.planning/` root-anchoring, and the test-deferred principle (no live Bob on the dev device; every criterion verified via doc-conformance, golden/unit tests, or Claude-runtime equivalence, with device-runnable steps accruing to one on-device acceptance checklist) hold across every milestone.

## Milestones

- ✅ **v1.0 — Bob Runtime & Core Loop** — Phases 1–6 (shipped 2026-06-19)
- ✅ **v2.0 — 1.6.1 Sync & Command Expansion** — Phases 7–11 (shipped 2026-07-06; npm `@zack-maz/gsd-bob@0.2.1`)
- 📋 **v(next)** — _planning (`/gsd-new-milestone`)_

Full phase detail for shipped milestones is archived under `.planning/milestones/`.

## Phases

<details>
<summary>✅ v1.0 — Bob Runtime & Core Loop (Phases 1–6) — SHIPPED 2026-06-19</summary>

- [x] Phase 1: Bob Capability Mapping (1/1 plans) — completed 2026-06-18
- [x] Phase 2: Runtime Foundation & Artifact Translation (4/4 plans) — completed 2026-06-18
- [x] Phase 3: Installer (4/4 plans) — completed 2026-06-18
- [x] Phase 4: Core-Loop Port (2/2 plans) — completed 2026-06-19
- [x] Phase 5: Quality Gates & Upstream Readiness (3/3 plans) — completed 2026-06-19
- [x] Phase 6: On-Device Acceptance Verification (1/1 plans) — completed 2026-06-19

Detail: v1.0 was carried into v2.0 via `new-milestone` without a separate archive — its full phase detail is captured in the all-11-phase snapshot at [`milestones/v2.0-ROADMAP.md`](./milestones/v2.0-ROADMAP.md).

</details>

<details>
<summary>✅ v2.0 — 1.6.1 Sync & Command Expansion (Phases 7–11) — SHIPPED 2026-07-06</summary>

- [x] Phase 7: gsd-core 1.6.1 Sync (3/3 plans) — completed 2026-07-03
- [x] Phase 8: Model Neutralization (1/1 plans) — completed 2026-07-03
- [x] Phase 9: Command Expansion (2/2 plans) — completed 2026-07-04
- [x] Phase 10: Documentation (3/3 plans) — completed 2026-07-04
- [x] Phase 11: On-Device Acceptance Delta (1/1 plans) — completed 2026-07-04

Detail: [`milestones/v2.0-ROADMAP.md`](./milestones/v2.0-ROADMAP.md)

</details>

### 📋 v(next) — planning

Run `/gsd-new-milestone` to define the next milestone (questioning → research → requirements → roadmap).

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Bob Capability Mapping | v1.0 | 1/1 | Complete | 2026-06-18 |
| 2. Runtime Foundation & Artifact Translation | v1.0 | 4/4 | Complete | 2026-06-18 |
| 3. Installer | v1.0 | 4/4 | Complete | 2026-06-18 |
| 4. Core-Loop Port | v1.0 | 2/2 | Complete | 2026-06-19 |
| 5. Quality Gates & Upstream Readiness | v1.0 | 3/3 | Complete | 2026-06-19 |
| 6. On-Device Acceptance Verification | v1.0 | 1/1 | Complete | 2026-06-19 |
| 7. gsd-core 1.6.1 Sync | v2.0 | 3/3 | Complete | 2026-07-03 |
| 8. Model Neutralization | v2.0 | 1/1 | Complete | 2026-07-03 |
| 9. Command Expansion | v2.0 | 2/2 | Complete | 2026-07-04 |
| 10. Documentation | v2.0 | 3/3 | Complete | 2026-07-04 |
| 11. On-Device Acceptance Delta | v2.0 | 1/1 | Complete | 2026-07-04 |
