# Test Plan — SkyPermit Data Model

**Source:** `../skypermit/docs/01-data-model.md` · **Date:** 2026-10-18 · **Version:** 0.1 (draft) · **Author:** QA

## 1. Objectives
- Show the seven entities' constraints and enums hold in both API and DB (`01`).
- Show currency and weight band are derived at read time, correct at boundaries, never persisted (`01` Derived).
- Find gaps between `01`, migrations `0001`–`0004`, and the rejection/audit fields other docs rely on.

## 2. Scope
| In scope | Out of scope |
|---|---|
| Operator, Pilot, Aircraft: fields, uniques, FKs, enums (`01`) | Gate logic beyond fields it writes (`06` §1) — gates plan |
| Zone as read-only reference data (`01`; `06` §4) | Transition legality (`02`) — state-machine plan |
| FlightRequest: window ordering, `flight_purpose` ≤ 2,000, rejection fields | Portal UI (`04`) |
| ReviewAction, append-only AuditLog (`01`) | `CR-1`, `OH-1` v1.4 — proposal/superseded |
| Derived currency (18 mo) and band C0–C3 (`06` §2–§3) | Performance |
| UTC storage, curfew conversion (`01` Time handling); doc ↔ migration sync | |

## 3. Risks
| # | Risk | Type | L | I | Mitigation / test focus |
|---|---|---|---|---|---|
| R1 | Derived values wrong at boundaries or stale if persisted (`01` Derived) | Product | M | H | BVA; correct an input, re-read |
| R2 | Constraints enforced in one layer only, or not at all, incl. cross-operator ownership (`01`) | Product | M | H | EP/BVA via API plus DB checks |
| R3 | Rejection/decision fields inconsistent across rejection paths (`01` FlightRequest) | Product | M | H | Decision table |
| R4 | Audit trail incomplete or mutable (`01` AuditLog) | Product | M | H | Row per transition; attempt update/delete |
| R5 | UTC vs zone-local time mishandled — DST, midnight curfews (`01` Time handling) | Product | M | M | Boundary times, DST dates |
| R6 | Docs and schema out of sync; types/nullability unspecified | Project | H | M | Static review before execution |
| R7 | Open questions (`05` §1–§2) or superseded sources yield invented expectations | Project | M | H | Block affected cases |

## 4. Strategy
**Test levels & types:** component (developer unit tests), API/integration, DB constraint checks; functional, negative, boundary, data-integrity, access, regression.
**Techniques:** BVA (bands, currency, lengths, windows), EP (enums, uniques), decision tables (R3), static review (R6), exploratory (R5).

**Automated testing.** Stable, repeatable, data-heavy checks:
- Band and currency boundaries (R1). Partly covered by developer tests in `../skypermit/tests/lib/derived.test.ts`; QA adds API reads and a no-stored-column check.
- 30,000 g ceiling (R1, R2). Partly covered by developer tests in `../skypermit/tests/routes/aircraft.test.ts`; QA verifies status code per `06` §3.
- Enums, uniques, `flight_purpose` 1,999/2,000/2,001 in both layers, `window_end` ≤ `window_start` (R2). Validators partly covered in `../skypermit/tests/lib/validation.test.ts`.
- Zone catalogue vs `06` §4 (R6). Covered by developer tests in `../skypermit/tests/business-rules/zone-catalogue.test.ts`.
- Rejection fields per path (R3); AuditLog row per FlightRequest transition (R4).

**Manual testing.** Needs judgement, or the spec isn't stable yet:
- Doc ↔ migration field-by-field review (R6)
- No update/delete path for AuditLog in API or UI (R4)
- Curfew/UTC exploratory session (R5)
- Another operator's pilot/aircraft in a request (R2)
- **Blocked:** suspended-operator writes, until `05` §1 resolves (R7)
- **Blocked:** inactive-zone `rule_reference`, until `05` §2 resolves; rule itself testable (R7)

*Tests in `../skypermit/tests/` are owned by SkyPermit developers; QA reviewed titles only, did not run them.*

## 5. Environment & test data
- **Environment:** isolated SkyPermit + Supabase instance with DB read access; two operator accounts; a reviewer `X-Reviewer-Id`.
- **Test data:** six seeded zones plus one QA-only inactive zone; aircraft at 0/900/901/3,500/3,501/12,000/12,001/30,000/30,001 g; pilots per rating with `window_start` at, ±1 day from the 18-month mark; duplicate `national_id`/`email`/`serial_number`; requests in every state, gate- and reviewer-rejected.

## 6. Definition of Ready
**Testing can start when:**
- `01` and migrations baselined at one commit; R6 review done.
- `05` §1–§2 resolved or deferred with cases marked blocked.
- Environment, accounts and data available.

**A requirement/story is ready for testing when:**
- It cites a `01` section (and `06` rule) with no conflict against `02`/`03`.
- Field type, required/optional and expected error code are stated.
- The endpoint or mechanism to change inputs (e.g. `mtom_grams`) is defined.

## 7. Definition of Done
**Testing is complete when:**
- All R1–R5 cases executed; 100% of R1 boundary cases pass.
- No open critical/high defects on constraints, derived values or audit.
- Doc ↔ migration gaps logged; blocked cases listed against `05` §1/§2.
- Owners report developer suite green; QA summary delivered.
