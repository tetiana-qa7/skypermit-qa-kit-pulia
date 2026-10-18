# Test Plan — SkyPermit (full documentation set)

**Source:** `../skypermit/docs/` (01–08) · **Date:** 2026-10-18 · **Version:** 0.1 (draft) · **Author:** QA

## 1. Objectives
- Show that the four gates (`PILOT → AIRCRAFT → ZONE → TIME_WINDOW`) accept and refuse requests exactly per `06` §1–§6 as corrected by `07`, with the right `failing_gate` and `rule_reference` in every `422`.
- Show only `02`'s legal transitions succeed, all other `(from, action)` pairs return `409`, and each change writes `AuditLog`.
- Find defects in operator ownership (`03` "Authentication & authorisation") and the portals/`data-testid` contract (`04`).

## 2. Scope
| In scope | Out of scope |
|---|---|
| Gate logic, order, `422` body (`06` §1–§6, `03`) | `CR-1` values, `OH-1` v1.4 values: proposal / superseded (`06` header) |
| Derived pilot currency and weight band (`01` "Derived", `06` §2–§3) | Zone create/edit: seeded reference data (`03`) |
| State machine, 2-hour cancel deadline, `validate` without side effects (`02`, `03` #13–14) | Raising `authorisation_level`: out-of-band admin action (`03`) |
| Registry, auth, `401`/`403`, reviewer #15–16 (`03`) | Visual design (`04`) |
| Zone catalogue vs seed, A-7 curfews (`06` §4) | Performance/load: no requirement in docs |
| Operator and reviewer portals, unfiltered pickers, `data-testid` (`04`) | `SUSPENDED` handling and zone-`active` citation: tested only as blocked (`05` §1–§2) |
| Uniqueness, 2,000-char purpose, append-only `AuditLog` (`01`) | |

## 3. Risks
| # | Risk | Type | L | I | Mitigation / test focus |
|---|---|---|---|---|---|
| R1 | Gate thresholds wrong at boundaries (lead time, 60 days, duration, 18 months, band edges, ceiling, auth level) (`06` §1–§3) | Product | H | H | BVA and decision tables per condition, run first |
| R2 | Time handling wrong: UTC vs zone-local curfew, midnight crossing, minute-level clipping, overlap boundaries (`06` §1.4, `01` "Time handling") | Product | H | H | Curfew edges, DST dates; overlap vs every state |
| R3 | Illegal transitions allowed, or wrong status code for deadline/conflict (`02`) | Product | M | H | Full state × action matrix |
| R4 | Ownership leaks: an operator reads or changes another operator's data, or a reviewer header is spoofed (`03` "Enforcement") | Product | M | H | Negative access tests per operator-scoped endpoint |
| R5 | Docs contradict each other or the tests, so expected results are unclear (e.g. `03` vs `06` on error codes) | Project | H | M | Log findings; affected cases need clarification before sign-off |
| R6 | Open questions leave expected results undefined (`05` §1–§2) | Project | H | M | Affected cases marked blocked, never guessed |
| R7 | Portal shows misleading gate results or breaks `data-testid` contract (`04`) | Product | M | M | Manual walkthrough, selector inventory |

## 4. Strategy
**Test levels & types:** component (developer tests), API/integration, system E2E; functional, negative, boundary, state-transition, access control, regression.
**Techniques:** BVA and equivalence partitioning for thresholds (R1); decision tables for rating × zone class and band × zone (R1); state-transition testing for `02` (R3); boundary time cases for curfew/overlap (R2); exploratory sessions on portals (R7).

**Automated testing.** Stable, repeatable, data-heavy checks:
- Gate thresholds and `rule_reference` values (R1). Partly covered by developer tests in `../skypermit/tests/lib/gates/*.test.ts` and `../skypermit/tests/lib/derived.test.ts`. QA adds API runs via `submit`/`validate`.
- Gate order, first failure only (R1). Partly covered by developer tests in `../skypermit/tests/lib/gates/pipeline.test.ts`.
- Curfew and overlap (R2). Partly covered by developer tests in `../skypermit/tests/lib/curfew.test.ts` and `time-window-gate.test.ts`. QA adds DST dates and real overlaps.
- State machine and cancel deadline (R3). Partly covered by developer tests in `../skypermit/tests/lib/state-machine.test.ts` and `../skypermit/tests/routes/submit.test.ts`. QA adds approve/reject/cancel via API.
- Zone catalogue vs seed (R1). Covered by developer tests in `../skypermit/tests/business-rules/zone-catalogue.test.ts`.
- `401`/`403` matrix, `X-Reviewer-Id`, field validation, `validate` side-effect free (R4).

**Manual testing.** Needs judgement, or the spec isn't stable yet:
- E2E: register → pilot/aircraft → request → check → submit → review → cancel (R3, R7)
- Per-gate result display, wording of `message` for operators, rejection detail with rule reference (R7)
- Pickers stay unfiltered; `data-testid` inventory incl. login/logout elements (R7)
- Exploratory: role switch, session expiry, URL tampering (R4)
- **Blocked:** suspended-operator create/submit/approve, until `05` §1 is resolved (R6)
- **Needs clarification:** zone-inactive `rule_reference` (`05` §2); cancel from `SUBMITTED`; status codes in conflict between docs and tests (R5)

*Developer tests live in `../skypermit/tests/` (Vitest) and belong to the SkyPermit developers; QA reviewed their titles only and did not run them.*

## 5. Environment & test data
- **Environment:** deployed build, Supabase seeded from `supabase/seed.sql`; operators via `/register`; reviewer via `X-Reviewer-Id`; relative dates for time rules.
- **Test data:**
  - Operators at `L1`, `L2`, `L3` (L2/L3 need admin setup); two operators for ownership tests.
  - Pilots per rating, with `certified_on` at 18 months exactly and +1 day relative to `window_start`.
  - Aircraft at 900/901, 3,500/3,501, 12,000/12,001, 30,000/30,001 g.
  - Windows at 6 h lead ±1 min, 60 days ±1 day, 14/15/240/241 min, curfew edges (22:00/23:00/05:00/06:00 local), touching and overlapping windows.
  - Altitude at ceiling and +1 m; `flight_purpose` at 2,000/2,001 chars; one inactive zone (needs a non-seed record).
  - Requests in every state.

## 6. Definition of Ready
**Testing can start when:**
- Docs 01–08 baselined at a known commit; R5 findings have an owner.
- Build deployed; seed, L2/L3 operators and inactive zone in place.
- `05` §1–§2 are resolved or formally deferred (cases stay blocked).

**A requirement/story is ready for testing when:**
- Cites a doc section and, for gates, a `06` §6 `rule_reference`.
- Expected status and body stated; no open doc conflict.
- Endpoints and `data-testid` values it touches are defined.

## 7. Definition of Done
**Testing is complete when:**
- All R1–R4 cases executed; 100% of these pass or have a logged defect.
- Every `06` §6 row exercised at least once through the API.
- Full state × action matrix executed.
- No open critical/high defects.
- Blocked and clarification items listed with their `05`/finding reference.
- Regression run green; summary report delivered.
