# Test cases — SkyPermit

Atomic manual test cases written from `../skypermit/docs/`, one file per module. A case goes in the module whose behaviour it checks, not every module it touches. For example, the band shown by `GET /aircraft` belongs in `tc-aircraft.md`, and a C2 aircraft refused in a C0–C1 zone belongs in `tc-gate-aircraft.md`.

**ID format:** `<LEVEL>-<MODULE>-<NNN>`, e.g. `API-ACFT-003`. Numbering continues per level+module. IDs are never reused, and a deleted case's number stays retired.

| Level | Used when the check is observed… |
|---|---|
| `API` | on an API response (status, body, derived field) |
| `UI` | in a portal screen or element (`data-testid`) |
| `E2E` | reserved for end-to-end scenarios (not atomic cases) |

| Code | File | Module | Main docs |
|---|---|---|---|
| `AUTH` | `tc-auth.md` | Operator registration, login/logout, sessions, 401/403 — incl. the `/register` and `/login` pages and the header register/login/logout elements | 03, 04 |
| `PIL` | `tc-pilots.md` | Pilot registry, derived currency | 01, 03, 06 §2 |
| `ACFT` | `tc-aircraft.md` | Aircraft registry, derived weight band, 30,000 g ceiling | 01, 03, 06 §3 |
| `ZONE` | `tc-zones.md` | Zone catalogue, read-only reference data | 01, 03, 06 §4 |
| `FR` | `tc-flight-requests.md` | Create, list, validate, cancel flight requests | 01, 03 |
| `GPIL` | `tc-gate-pilot.md` | PILOT gate | 06 §1.1, §2 |
| `GACF` | `tc-gate-aircraft.md` | AIRCRAFT gate (weight band vs zone) | 06 §1.2, 07 item 1 |
| `GZON` | `tc-gate-zone.md` | ZONE gate (ceiling, auth level, active flag) | 06 §1.3, 05 §2 |
| `GTW` | `tc-gate-time-window.md` | TIME_WINDOW gate (lead time, booking limit, duration, curfew, overlap) | 06 §1.4 |
| `GORD` | `tc-gate-order.md` | Gate evaluation order, first failure only | 03, 06 |
| `SM` | `tc-state-machine.md` | Legal and illegal transitions, `409` | 02 |
| `REV` | `tc-review.md` | Reviewer approve/reject, `ReviewAction`, `X-Reviewer-Id` | 02, 03 |
| `AUD` | `tc-audit.md` | AuditLog: written per transition, append-only | 01, 02 |
| `OP` | `tc-operator-portal.md` | Operator portal UI and `data-testid`, except the register/login pages and header auth elements (→ `AUTH`) | 04 |
| `RV` | `tc-reviewer-portal.md` | Reviewer portal UI and `data-testid` | 04 |
