# TIME_WINDOW gate — test cases

**Module code:** GTW · **Sources:** `06-business-rules.md` §1.4, §4, §6; `03-api-contract.md` "Error semantics" (`422` body), "Gate pipeline"; `02-state-machine.md`; `01-data-model.md` "FlightRequest" · **Last updated:** 2026-10-24

All cases submit through `POST /api/v1/flight-requests/{id}/submit`, whose outcomes are documented (`422` body, or the move to `UNDER_REVIEW`). `validate` runs the same gates, but its response shape isn't documented, so it isn't used as the observation point. `TIME_WINDOW` is the last gate, so every case sets up the `PILOT`, `AIRCRAFT` and `ZONE` gates to pass, and uses `DNI-OPN-1` (no curfew) so only the condition under test can fail.

"Now" below means the moment the tester sends the submit call (step 2). Times are UTC.

---

### API-GTW-001 — lead time just over 6 hours passes the TIME_WINDOW gate

| Field | Value |
|---|---|
| **Doc ref** | 06 §1.4 "Minimum lead time" (≥ 6 hours between submission and `window_start`) · `TSD-4 §2.1` · 02 transitions (`SUBMITTED` → `UNDER_REVIEW` when gates pass) |
| **Priority** | High |
| **Preconditions** | Logged in as an operator with `authorisation_level = L3`; pilot with `rating = R_BVLOS` and `certified_on` = today − 6 months; aircraft with `mtom_grams = 800` (band `C0`); no other `UNDER_REVIEW` or `APPROVED` request for this aircraft |
| **Test data** | `{"pilot_id": "<R_BVLOS pilot>", "aircraft_id": "<C0 aircraft>", "zone_code": "DNI-OPN-1", "window_start": "<now + 6 h 02 min>", "window_end": "<now + 7 h 02 min>", "requested_altitude_metres": 40, "flight_purpose": "QA GTW-001"}` — compute the times immediately before step 1 and submit within 1 minute |

**Steps**
1. POST /api/v1/flight-requests with the Test data payload
2. POST /api/v1/flight-requests/{id}/submit
3. GET /api/v1/flight-requests/{id}

**Expected result**
Step 2 does not return `422`; step 3 shows `state = "UNDER_REVIEW"` and `failing_gate` empty

---

### API-GTW-002 — lead time of 24 hours passes the TIME_WINDOW gate

| Field | Value |
|---|---|
| **Doc ref** | 06 §1.4 "Minimum lead time" (≥ 6 hours) · `TSD-4 §2.1` · 02 transitions |
| **Priority** | Medium |
| **Preconditions** | Logged in as an operator with `authorisation_level = L3`; pilot with `rating = R_BVLOS` and `certified_on` = today − 6 months; aircraft with `mtom_grams = 800` (band `C0`); no other `UNDER_REVIEW` or `APPROVED` request for this aircraft |
| **Test data** | `{"pilot_id": "<R_BVLOS pilot>", "aircraft_id": "<C0 aircraft>", "zone_code": "DNI-OPN-1", "window_start": "<now + 24 h>", "window_end": "<now + 25 h>", "requested_altitude_metres": 40, "flight_purpose": "QA GTW-002"}` |

**Steps**
1. POST /api/v1/flight-requests with the Test data payload
2. POST /api/v1/flight-requests/{id}/submit
3. GET /api/v1/flight-requests/{id}

**Expected result**
Step 2 does not return `422`; step 3 shows `state = "UNDER_REVIEW"` and `failing_gate` empty

---

### API-GTW-003 — lead time just under 6 hours is refused

| Field | Value |
|---|---|
| **Doc ref** | 06 §1.4 "Minimum lead time" (≥ 6 hours) · `TSD-4 §2.1` · 06 §6 (`TIME_WINDOW` / lead time too short) · 03 "The `422` body" |
| **Priority** | High |
| **Preconditions** | Logged in as an operator with `authorisation_level = L3`; pilot with `rating = R_BVLOS` and `certified_on` = today − 6 months; aircraft with `mtom_grams = 800` (band `C0`); no other `UNDER_REVIEW` or `APPROVED` request for this aircraft |
| **Test data** | `{"pilot_id": "<R_BVLOS pilot>", "aircraft_id": "<C0 aircraft>", "zone_code": "DNI-OPN-1", "window_start": "<now + 5 h 58 min>", "window_end": "<now + 6 h 58 min>", "requested_altitude_metres": 40, "flight_purpose": "QA GTW-003"}` |

**Steps**
1. POST /api/v1/flight-requests with the Test data payload
2. POST /api/v1/flight-requests/{id}/submit

**Expected result**
`422` with `failing_gate = "TIME_WINDOW"`, `rule_reference = "TSD-4 §2.1"` and a non-empty `message`

---

### API-GTW-004 — lead time of 1 hour is refused

| Field | Value |
|---|---|
| **Doc ref** | 06 §1.4 "Minimum lead time" (≥ 6 hours) · `TSD-4 §2.1` · 06 §6 (`TIME_WINDOW` / lead time too short) · 03 "The `422` body" |
| **Priority** | Medium |
| **Preconditions** | Logged in as an operator with `authorisation_level = L3`; pilot with `rating = R_BVLOS` and `certified_on` = today − 6 months; aircraft with `mtom_grams = 800` (band `C0`); no other `UNDER_REVIEW` or `APPROVED` request for this aircraft |
| **Test data** | `{"pilot_id": "<R_BVLOS pilot>", "aircraft_id": "<C0 aircraft>", "zone_code": "DNI-OPN-1", "window_start": "<now + 1 h>", "window_end": "<now + 2 h>", "requested_altitude_metres": 40, "flight_purpose": "QA GTW-004"}` |

**Steps**
1. POST /api/v1/flight-requests with the Test data payload
2. POST /api/v1/flight-requests/{id}/submit

**Expected result**
`422` with `failing_gate = "TIME_WINDOW"`, `rule_reference = "TSD-4 §2.1"` and a non-empty `message`

---

### API-GTW-005 — window that already started is refused for lead time

| Field | Value |
|---|---|
| **Doc ref** | 06 §1.4 "Minimum lead time" (≥ 6 hours; a past `window_start` gives a negative lead time) · `TSD-4 §2.1` · 06 §6 (`TIME_WINDOW` / lead time too short) · 03 "The `422` body" |
| **Priority** | Medium |
| **Preconditions** | Logged in as an operator with `authorisation_level = L3`; pilot with `rating = R_BVLOS` and `certified_on` = today − 6 months; aircraft with `mtom_grams = 800` (band `C0`); no other `UNDER_REVIEW` or `APPROVED` request for this aircraft |
| **Test data** | `{"pilot_id": "<R_BVLOS pilot>", "aircraft_id": "<C0 aircraft>", "zone_code": "DNI-OPN-1", "window_start": "<now − 1 h>", "window_end": "<now + 1 h>", "requested_altitude_metres": 40, "flight_purpose": "QA GTW-005"}` (duration 120 min, within 15–240) |

**Steps**
1. POST /api/v1/flight-requests with the Test data payload
2. POST /api/v1/flight-requests/{id}/submit

**Expected result**
`422` with `failing_gate = "TIME_WINDOW"`, `rule_reference = "TSD-4 §2.1"` and a non-empty `message`

---

### API-GTW-006 — lead time is measured at submit, not at creation

| Field | Value |
|---|---|
| **Doc ref** | 06 §1.4 "Minimum lead time" (between **submission** and `window_start`) · `TSD-4 §2.1` · 06 §6 (`TIME_WINDOW` / lead time too short) · 01 "FlightRequest" (`submitted_at`) |
| **Priority** | High |
| **Preconditions** | Logged in as an operator with `authorisation_level = L3`; pilot with `rating = R_BVLOS` and `certified_on` = today − 6 months; aircraft with `mtom_grams = 800` (band `C0`); no other `UNDER_REVIEW` or `APPROVED` request for this aircraft |
| **Test data** | At creation time T: `{"pilot_id": "<R_BVLOS pilot>", "aircraft_id": "<C0 aircraft>", "zone_code": "DNI-OPN-1", "window_start": "<T + 6 h 03 min>", "window_end": "<T + 7 h 03 min>", "requested_altitude_metres": 40, "flight_purpose": "QA GTW-006"}` |

**Steps**
1. At time T, POST /api/v1/flight-requests with the Test data payload (lead time at creation = 6 h 03 min)
2. Wait until at least T + 6 min (lead time now ≤ 5 h 57 min)
3. POST /api/v1/flight-requests/{id}/submit

**Expected result**
Step 3 returns `422` with `failing_gate = "TIME_WINDOW"`, `rule_reference = "TSD-4 §2.1"` and a non-empty `message`

---

### API-GTW-007 — lead-time rejection is stored on the request

| Field | Value |
|---|---|
| **Doc ref** | 06 §1.4 "Minimum lead time" · `TSD-4 §2.1` · 02 transitions (`SUBMITTED` → `REJECTED` when gates fail, `failing_gate`/`rejection_reason` populated) · 01 "FlightRequest" (`rule_reference` populated alongside `failing_gate`) |
| **Priority** | Medium |
| **Preconditions** | Logged in as an operator with `authorisation_level = L3`; pilot with `rating = R_BVLOS` and `certified_on` = today − 6 months; aircraft with `mtom_grams = 800` (band `C0`); no other `UNDER_REVIEW` or `APPROVED` request for this aircraft |
| **Test data** | `{"pilot_id": "<R_BVLOS pilot>", "aircraft_id": "<C0 aircraft>", "zone_code": "DNI-OPN-1", "window_start": "<now + 2 h>", "window_end": "<now + 3 h>", "requested_altitude_metres": 40, "flight_purpose": "QA GTW-007"}` |

**Steps**
1. POST /api/v1/flight-requests with the Test data payload
2. POST /api/v1/flight-requests/{id}/submit
3. GET /api/v1/flight-requests/{id}

**Expected result**
Step 3 shows `state = "REJECTED"`, `failing_gate = "TIME_WINDOW"`, `rule_reference = "TSD-4 §2.1"` and a non-empty `rejection_reason`

---

### API-GTW-008 — window 59 days ahead passes the TIME_WINDOW gate

| Field | Value |
|---|---|
| **Doc ref** | 06 §1.4 "Maximum advance booking" (≤ 60 days before `window_start`) · `TSD-4 §2.2` (restated `OH-1` §5) · 02 transitions (`SUBMITTED` → `UNDER_REVIEW` when gates pass) |
| **Priority** | Medium |
| **Preconditions** | Logged in as an operator with `authorisation_level = L3`; pilot with `rating = R_BVLOS` and `certified_on` = today − 6 months; aircraft with `mtom_grams = 800` (band `C0`); no other `UNDER_REVIEW` or `APPROVED` request for this aircraft |
| **Test data** | `{"pilot_id": "<R_BVLOS pilot>", "aircraft_id": "<C0 aircraft>", "zone_code": "DNI-OPN-1", "window_start": "<now + 59 days>", "window_end": "<now + 59 days + 1 h>", "requested_altitude_metres": 40, "flight_purpose": "QA GTW-008"}` |

**Steps**
1. POST /api/v1/flight-requests with the Test data payload
2. POST /api/v1/flight-requests/{id}/submit
3. GET /api/v1/flight-requests/{id}

**Expected result**
Step 2 does not return `422`; step 3 shows `state = "UNDER_REVIEW"` and `failing_gate` empty

---

### API-GTW-009 — window just under 60 days ahead passes the TIME_WINDOW gate

| Field | Value |
|---|---|
| **Doc ref** | 06 §1.4 "Maximum advance booking" (≤ 60 days before `window_start`) · `TSD-4 §2.2` · 02 transitions |
| **Priority** | High |
| **Preconditions** | Logged in as an operator with `authorisation_level = L3`; pilot with `rating = R_BVLOS` and `certified_on` = today − 6 months; aircraft with `mtom_grams = 800` (band `C0`); no other `UNDER_REVIEW` or `APPROVED` request for this aircraft |
| **Test data** | `{"pilot_id": "<R_BVLOS pilot>", "aircraft_id": "<C0 aircraft>", "zone_code": "DNI-OPN-1", "window_start": "<now + 60 days − 5 min>", "window_end": "<now + 60 days + 55 min>", "requested_altitude_metres": 40, "flight_purpose": "QA GTW-009"}` — compute the times immediately before step 1 and submit within 1 minute |

**Steps**
1. POST /api/v1/flight-requests with the Test data payload
2. POST /api/v1/flight-requests/{id}/submit
3. GET /api/v1/flight-requests/{id}

**Expected result**
Step 2 does not return `422`; step 3 shows `state = "UNDER_REVIEW"` and `failing_gate` empty

---

### API-GTW-010 — window a few minutes over 60 days ahead

| Field | Value |
|---|---|
| **Doc ref** | 06 §1.4 "Maximum advance booking" (≤ 60 days before `window_start`) · `TSD-4 §2.2` · 06 §6 (`TIME_WINDOW` / booked too far in advance) |
| **Priority** | High |
| **Preconditions** | Logged in as an operator with `authorisation_level = L3`; pilot with `rating = R_BVLOS` and `certified_on` = today − 6 months; aircraft with `mtom_grams = 800` (band `C0`); no other `UNDER_REVIEW` or `APPROVED` request for this aircraft |
| **Test data** | `{"pilot_id": "<R_BVLOS pilot>", "aircraft_id": "<C0 aircraft>", "zone_code": "DNI-OPN-1", "window_start": "<now + 60 days + 5 min>", "window_end": "<now + 60 days + 1 h 05 min>", "requested_altitude_metres": 40, "flight_purpose": "QA GTW-010"}` — `window_start` falls on the same calendar date as now + 60 days |

**Steps**
1. POST /api/v1/flight-requests with the Test data payload
2. POST /api/v1/flight-requests/{id}/submit

**Expected result**
**Not specified in docs** — 06 §1.4 / `TSD-4 §2.2` would need to say whether "60 days" means 60 × 24 h (this window is over the limit) or 60 calendar days (this window is on the last allowed date). Known: a refusal under this rule is reported as `failing_gate = "TIME_WINDOW"` with `rule_reference = "TSD-4 §2.2"` (06 §6)

---

### API-GTW-011 — window 61 days ahead is refused

| Field | Value |
|---|---|
| **Doc ref** | 06 §1.4 "Maximum advance booking" (≤ 60 days before `window_start`) · `TSD-4 §2.2` · 06 §6 (`TIME_WINDOW` / booked too far in advance) · 03 "The `422` body" |
| **Priority** | High |
| **Preconditions** | Logged in as an operator with `authorisation_level = L3`; pilot with `rating = R_BVLOS` and `certified_on` = today − 6 months; aircraft with `mtom_grams = 800` (band `C0`); no other `UNDER_REVIEW` or `APPROVED` request for this aircraft |
| **Test data** | `{"pilot_id": "<R_BVLOS pilot>", "aircraft_id": "<C0 aircraft>", "zone_code": "DNI-OPN-1", "window_start": "<now + 61 days + 1 h>", "window_end": "<now + 61 days + 2 h>", "requested_altitude_metres": 40, "flight_purpose": "QA GTW-011"}` (over 60 days under both the 24-hour and the calendar-day reading) |

**Steps**
1. POST /api/v1/flight-requests with the Test data payload
2. POST /api/v1/flight-requests/{id}/submit

**Expected result**
`422` with `failing_gate = "TIME_WINDOW"`, `rule_reference = "TSD-4 §2.2"` and a non-empty `message`

---

### API-GTW-012 — advance limit measured from creation or from submit

| Field | Value |
|---|---|
| **Doc ref** | 06 §1.4 "Maximum advance booking" (≤ 60 days before `window_start`; the start point is not named, unlike "Minimum lead time", which says "between submission and `window_start`") · `TSD-4 §2.2` · 01 "FlightRequest" (`submitted_at`) |
| **Priority** | Medium |
| **Preconditions** | Logged in as an operator with `authorisation_level = L3`; pilot with `rating = R_BVLOS` and `certified_on` = today − 6 months; aircraft with `mtom_grams = 800` (band `C0`); no other `UNDER_REVIEW` or `APPROVED` request for this aircraft |
| **Test data** | At creation time T: `{"pilot_id": "<R_BVLOS pilot>", "aircraft_id": "<C0 aircraft>", "zone_code": "DNI-OPN-1", "window_start": "<T + 61 days>", "window_end": "<T + 61 days + 1 h>", "requested_altitude_metres": 40, "flight_purpose": "QA GTW-012"}` |

**Steps**
1. At time T, POST /api/v1/flight-requests with the Test data payload (61 days ahead at creation)
2. On day T + 2 days, POST /api/v1/flight-requests/{id}/submit (59 days ahead at submit)

**Expected result**
**Not specified in docs** — 06 §1.4 / `TSD-4 §2.2` doesn't say whether the 60 days run from creation (`DRAFT`) or from submission (`submitted_at`), so the outcome of step 2 isn't defined. Known: a refusal under this rule is reported as `failing_gate = "TIME_WINDOW"` with `rule_reference = "TSD-4 §2.2"` (06 §6)

---

### API-GTW-013 — 15-minute window passes the TIME_WINDOW gate

| Field | Value |
|---|---|
| **Doc ref** | 06 §1.4 "Duration" (15–240 minutes, inclusive at both ends) · `TSD-4 §3` · 02 transitions |
| **Priority** | High |
| **Preconditions** | Logged in as an operator with `authorisation_level = L3`; pilot with `rating = R_BVLOS` and `certified_on` = today − 6 months; aircraft with `mtom_grams = 800` (band `C0`); no other `UNDER_REVIEW` or `APPROVED` request for this aircraft |
| **Test data** | `{"pilot_id": "<R_BVLOS pilot>", "aircraft_id": "<C0 aircraft>", "zone_code": "DNI-OPN-1", "window_start": "<today + 3 days>T10:00:00Z", "window_end": "<today + 3 days>T10:15:00Z", "requested_altitude_metres": 40, "flight_purpose": "QA GTW-013"}` (duration exactly 15 min, lower boundary) |

**Steps**
1. POST /api/v1/flight-requests with the Test data payload
2. POST /api/v1/flight-requests/{id}/submit
3. GET /api/v1/flight-requests/{id}

**Expected result**
Step 2 does not return `422`; step 3 shows `state = "UNDER_REVIEW"` and `failing_gate` empty

---

### API-GTW-014 — 240-minute window passes the TIME_WINDOW gate

| Field | Value |
|---|---|
| **Doc ref** | 06 §1.4 "Duration" (15–240 minutes, inclusive at both ends) · `TSD-4 §3` · 02 transitions |
| **Priority** | High |
| **Preconditions** | Logged in as an operator with `authorisation_level = L3`; pilot with `rating = R_BVLOS` and `certified_on` = today − 6 months; aircraft with `mtom_grams = 800` (band `C0`); no other `UNDER_REVIEW` or `APPROVED` request for this aircraft |
| **Test data** | `{"pilot_id": "<R_BVLOS pilot>", "aircraft_id": "<C0 aircraft>", "zone_code": "DNI-OPN-1", "window_start": "<today + 3 days>T10:00:00Z", "window_end": "<today + 3 days>T14:00:00Z", "requested_altitude_metres": 40, "flight_purpose": "QA GTW-014"}` (duration exactly 240 min, upper boundary) |

**Steps**
1. POST /api/v1/flight-requests with the Test data payload
2. POST /api/v1/flight-requests/{id}/submit
3. GET /api/v1/flight-requests/{id}

**Expected result**
Step 2 does not return `422`; step 3 shows `state = "UNDER_REVIEW"` and `failing_gate` empty

---

### API-GTW-015 — 14-minute window is refused

| Field | Value |
|---|---|
| **Doc ref** | 06 §1.4 "Duration" (15–240 minutes, inclusive at both ends) · `TSD-4 §3` · 06 §6 (`TIME_WINDOW` / duration out of range) · 03 "The `422` body" |
| **Priority** | High |
| **Preconditions** | Logged in as an operator with `authorisation_level = L3`; pilot with `rating = R_BVLOS` and `certified_on` = today − 6 months; aircraft with `mtom_grams = 800` (band `C0`); no other `UNDER_REVIEW` or `APPROVED` request for this aircraft |
| **Test data** | `{"pilot_id": "<R_BVLOS pilot>", "aircraft_id": "<C0 aircraft>", "zone_code": "DNI-OPN-1", "window_start": "<today + 3 days>T10:00:00Z", "window_end": "<today + 3 days>T10:14:00Z", "requested_altitude_metres": 40, "flight_purpose": "QA GTW-015"}` (duration 14 min) |

**Steps**
1. POST /api/v1/flight-requests with the Test data payload
2. POST /api/v1/flight-requests/{id}/submit

**Expected result**
`422` with `failing_gate = "TIME_WINDOW"`, `rule_reference = "TSD-4 §3"` and a non-empty `message`

---

### API-GTW-016 — 241-minute window is refused

| Field | Value |
|---|---|
| **Doc ref** | 06 §1.4 "Duration" (15–240 minutes, inclusive at both ends) · `TSD-4 §3` · 06 §6 (`TIME_WINDOW` / duration out of range) · 03 "The `422` body" |
| **Priority** | High |
| **Preconditions** | Logged in as an operator with `authorisation_level = L3`; pilot with `rating = R_BVLOS` and `certified_on` = today − 6 months; aircraft with `mtom_grams = 800` (band `C0`); no other `UNDER_REVIEW` or `APPROVED` request for this aircraft |
| **Test data** | `{"pilot_id": "<R_BVLOS pilot>", "aircraft_id": "<C0 aircraft>", "zone_code": "DNI-OPN-1", "window_start": "<today + 3 days>T10:00:00Z", "window_end": "<today + 3 days>T14:01:00Z", "requested_altitude_metres": 40, "flight_purpose": "QA GTW-016"}` (duration 241 min) |

**Steps**
1. POST /api/v1/flight-requests with the Test data payload
2. POST /api/v1/flight-requests/{id}/submit

**Expected result**
`422` with `failing_gate = "TIME_WINDOW"`, `rule_reference = "TSD-4 §3"` and a non-empty `message`

---

### API-GTW-017 — window one second short of 15 minutes is refused

| Field | Value |
|---|---|
| **Doc ref** | 06 §1.4 "Duration" (15–240 minutes, inclusive at both ends) · `TSD-4 §3` · 06 §6 (`TIME_WINDOW` / duration out of range) · 03 "The `422` body" |
| **Priority** | Medium |
| **Preconditions** | Logged in as an operator with `authorisation_level = L3`; pilot with `rating = R_BVLOS` and `certified_on` = today − 6 months; aircraft with `mtom_grams = 800` (band `C0`); no other `UNDER_REVIEW` or `APPROVED` request for this aircraft |
| **Test data** | `{"pilot_id": "<R_BVLOS pilot>", "aircraft_id": "<C0 aircraft>", "zone_code": "DNI-OPN-1", "window_start": "<today + 3 days>T10:00:00Z", "window_end": "<today + 3 days>T10:14:59Z", "requested_altitude_metres": 40, "flight_purpose": "QA GTW-017"}` (duration 14 min 59 s) |

**Steps**
1. POST /api/v1/flight-requests with the Test data payload
2. POST /api/v1/flight-requests/{id}/submit

**Expected result**
`422` with `failing_gate = "TIME_WINDOW"`, `rule_reference = "TSD-4 §3"` and a non-empty `message`

---

### API-GTW-018 — window one second over 240 minutes is refused

| Field | Value |
|---|---|
| **Doc ref** | 06 §1.4 "Duration" (15–240 minutes, inclusive at both ends) · `TSD-4 §3` · 06 §6 (`TIME_WINDOW` / duration out of range) · 03 "The `422` body" |
| **Priority** | Medium |
| **Preconditions** | Logged in as an operator with `authorisation_level = L3`; pilot with `rating = R_BVLOS` and `certified_on` = today − 6 months; aircraft with `mtom_grams = 800` (band `C0`); no other `UNDER_REVIEW` or `APPROVED` request for this aircraft |
| **Test data** | `{"pilot_id": "<R_BVLOS pilot>", "aircraft_id": "<C0 aircraft>", "zone_code": "DNI-OPN-1", "window_start": "<today + 3 days>T10:00:00Z", "window_end": "<today + 3 days>T14:00:01Z", "requested_altitude_metres": 40, "flight_purpose": "QA GTW-018"}` (duration 240 min 1 s) |

**Steps**
1. POST /api/v1/flight-requests with the Test data payload
2. POST /api/v1/flight-requests/{id}/submit

**Expected result**
`422` with `failing_gate = "TIME_WINDOW"`, `rule_reference = "TSD-4 §3"` and a non-empty `message`

---

### API-GTW-019 — window_end equal to window_start

| Field | Value |
|---|---|
| **Doc ref** | 06 §1.4 "Duration" (15–240 minutes, `window_end` strictly after `window_start`) · `TSD-4 §3` · 01 "FlightRequest" (`window_end` must be after `window_start`) |
| **Priority** | High |
| **Preconditions** | Logged in as an operator with `authorisation_level = L3`; pilot with `rating = R_BVLOS` and `certified_on` = today − 6 months; aircraft with `mtom_grams = 800` (band `C0`); no other `UNDER_REVIEW` or `APPROVED` request for this aircraft |
| **Test data** | `{"pilot_id": "<R_BVLOS pilot>", "aircraft_id": "<C0 aircraft>", "zone_code": "DNI-OPN-1", "window_start": "<today + 3 days>T10:00:00Z", "window_end": "<today + 3 days>T10:00:00Z", "requested_altitude_metres": 40, "flight_purpose": "QA GTW-019"}` (duration 0) |

**Steps**
1. POST /api/v1/flight-requests with the Test data payload
2. POST /api/v1/flight-requests/{id}/submit (only if step 1 created the request)

**Expected result**
**Not specified in docs** — 03 "Error semantics" / 01 "FlightRequest" would need to say whether a window with `window_end = window_start` is refused at create (step 1, as a data-model constraint, status not given) or by the `TIME_WINDOW` gate at submit (`422`, `rule_reference = "TSD-4 §3"`). Known: the request must not reach `UNDER_REVIEW` (06 §1.4, `TSD-4 §3`)

---

### API-GTW-020 — window_end before window_start

| Field | Value |
|---|---|
| **Doc ref** | 06 §1.4 "Duration" (15–240 minutes, `window_end` strictly after `window_start`) · `TSD-4 §3` · 01 "FlightRequest" (`window_end` must be after `window_start`) |
| **Priority** | High |
| **Preconditions** | Logged in as an operator with `authorisation_level = L3`; pilot with `rating = R_BVLOS` and `certified_on` = today − 6 months; aircraft with `mtom_grams = 800` (band `C0`); no other `UNDER_REVIEW` or `APPROVED` request for this aircraft |
| **Test data** | `{"pilot_id": "<R_BVLOS pilot>", "aircraft_id": "<C0 aircraft>", "zone_code": "DNI-OPN-1", "window_start": "<today + 3 days>T10:00:00Z", "window_end": "<today + 3 days>T09:00:00Z", "requested_altitude_metres": 40, "flight_purpose": "QA GTW-020"}` (`window_end` 60 min before `window_start`) |

**Steps**
1. POST /api/v1/flight-requests with the Test data payload
2. POST /api/v1/flight-requests/{id}/submit (only if step 1 created the request)

**Expected result**
**Not specified in docs** — 03 "Error semantics" / 01 "FlightRequest" would need to say whether a window with `window_end` before `window_start` is refused at create (step 1, as a data-model constraint, status not given) or by the `TIME_WINDOW` gate at submit (`422`, `rule_reference = "TSD-4 §3"`). Known: the request must not reach `UNDER_REVIEW` (06 §1.4, `TSD-4 §3`)

---
