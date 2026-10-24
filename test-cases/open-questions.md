# Open questions from test design

Questions found while writing test cases, where `../skypermit/docs` doesn't define the expected behaviour. Canonical project status stays in `../skypermit/docs/05-open-questions.md`; raise these with the rules owner.

---

### OQ-001 — Does "60 days" in the advance-booking limit mean 60 × 24 hours or 60 calendar days?

| Field | Value |
|---|---|
| **Case** | API-GTW-010 in `test-cases/tc-gate-time-window.md` |
| **Rule** | TIME_WINDOW · Booked too far in advance · `TSD-4 §2.2` |
| **Where the answer belongs** | 06 §1.4 "Maximum advance booking" row (`TSD-4 §2.2`), with a new item in 05 |
| **Verifier note** | The only text is "≤ 60 days before `window_start`"; the docs fix UTC but not how a day is counted. The implementation uses 60 × 24 h with a strict `>`, which is an undocumented choice. |
| **Raised** | 2026-10-24 by /cover-gaps |
| **Status** | Open |

---

### OQ-002 — Is the 60-day advance-booking limit measured from request creation or from submission?

| Field | Value |
|---|---|
| **Case** | API-GTW-012 in `test-cases/tc-gate-time-window.md` |
| **Rule** | TIME_WINDOW · Booked too far in advance · `TSD-4 §2.2` |
| **Where the answer belongs** | 06 §1.4 "Maximum advance booking" row (`TSD-4 §2.2`), with a new item in 05 |
| **Verifier note** | Lead time says "between submission and `window_start`", but advance booking names no start point. The docs imply submission (gates run only at submit; 01 has no `created_at`) but don't state it. |
| **Raised** | 2026-10-24 by /cover-gaps |
| **Status** | Open |

---

### OQ-003 — Is a window with `window_end` ≤ `window_start` refused at create (and with what status), or by the TIME_WINDOW gate at submit?

| Field | Value |
|---|---|
| **Case** | API-GTW-019, API-GTW-020 in `test-cases/tc-gate-time-window.md` |
| **Rule** | TIME_WINDOW · Duration out of range · `TSD-4 §3` |
| **Where the answer belongs** | 03 "Error semantics" (create-time status, e.g. whether `400` covers it) and/or 01 "FlightRequest"; optionally 06 §1.4 / §6 (whether this is a gate outcome) |
| **Verifier note** | 01 states a field constraint and 06 §1.4 puts "strictly after" in the TIME_WINDOW gate; neither says where or with what status it is refused. The implementation refuses at create with `400` (plus a DB check), so the documented `TSD-4 §3` gate outcome is unreachable for this input. |
| **Raised** | 2026-10-24 by /cover-gaps |
| **Status** | Open |

---
