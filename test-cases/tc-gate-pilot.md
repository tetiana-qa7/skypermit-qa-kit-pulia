# PILOT gate — test cases

**Module code:** GPIL · **Sources:** `06-business-rules.md` §1.1, §2, §4, §6; `03-api-contract.md` "Error semantics" (`422` body), "Gate pipeline"; `02-state-machine.md`; `01-data-model.md` "Pilot", "Zone", "FlightRequest" · **Last updated:** 2026-10-24

All cases submit through `POST /api/v1/flight-requests/{id}/submit`, whose outcomes are documented (`422` body, or the move to `UNDER_REVIEW`). `validate` runs the same gates, but its response shape isn't documented, so it isn't used as the observation point.

---

### API-GPIL-001 — R_BASIC pilot passes the PILOT gate in an OPEN zone

| Field | Value |
|---|---|
| **Doc ref** | 06 §1.1 "Rating covers the zone's class" (`R_BASIC` → `OPEN` only) · `OH-1 §2.1` · 02 transitions (`SUBMITTED` → `UNDER_REVIEW` when gates pass) |
| **Priority** | High |
| **Preconditions** | Logged in as an operator with `authorisation_level = L3`; pilot with `rating = R_BASIC` and `certified_on` = today − 6 months; aircraft with `mtom_grams = 800` (band `C0`); no other `UNDER_REVIEW` or `APPROVED` request for this aircraft |
| **Test data** | `{"pilot_id": "<R_BASIC pilot>", "aircraft_id": "<C0 aircraft>", "zone_code": "DNI-OPN-1", "window_start": "<today + 3 days>T10:00:00Z", "window_end": "<today + 3 days>T11:00:00Z", "requested_altitude_metres": 40, "flight_purpose": "QA GPIL-001"}` |

**Steps**
1. POST /api/v1/flight-requests with the Test data payload
2. POST /api/v1/flight-requests/{id}/submit
3. GET /api/v1/flight-requests/{id}

**Expected result**
Step 2 does not return `422`; step 3 shows `state = "UNDER_REVIEW"` and `failing_gate` empty

---

### API-GPIL-002 — R_ADVANCED pilot passes the PILOT gate in an OPEN zone

| Field | Value |
|---|---|
| **Doc ref** | 06 §1.1 "Rating covers the zone's class" (`R_ADVANCED` → `OPEN`, `CONTROLLED`) · `OH-1 §2.1` · 02 transitions (`SUBMITTED` → `UNDER_REVIEW` when gates pass) |
| **Priority** | High |
| **Preconditions** | Logged in as an operator with `authorisation_level = L3`; pilot with `rating = R_ADVANCED` and `certified_on` = today − 6 months; aircraft with `mtom_grams = 800` (band `C0`); no other `UNDER_REVIEW` or `APPROVED` request for this aircraft |
| **Test data** | `{"pilot_id": "<R_ADVANCED pilot>", "aircraft_id": "<C0 aircraft>", "zone_code": "DNI-OPN-1", "window_start": "<today + 3 days>T10:00:00Z", "window_end": "<today + 3 days>T11:00:00Z", "requested_altitude_metres": 40, "flight_purpose": "QA GPIL-002"}` |

**Steps**
1. POST /api/v1/flight-requests with the Test data payload
2. POST /api/v1/flight-requests/{id}/submit
3. GET /api/v1/flight-requests/{id}

**Expected result**
Step 2 does not return `422`; step 3 shows `state = "UNDER_REVIEW"` and `failing_gate` empty

---

### API-GPIL-003 — R_ADVANCED pilot passes the PILOT gate in a CONTROLLED zone

| Field | Value |
|---|---|
| **Doc ref** | 06 §1.1 "Rating covers the zone's class" (`R_ADVANCED` → `OPEN`, `CONTROLLED`) · `OH-1 §2.1` · 06 §4 (`KBP-CTR-3` is `CONTROLLED`) · 02 transitions |
| **Priority** | High |
| **Preconditions** | Logged in as an operator with `authorisation_level = L3`; pilot with `rating = R_ADVANCED` and `certified_on` = today − 6 months; aircraft with `mtom_grams = 800` (band `C0`); no other `UNDER_REVIEW` or `APPROVED` request for this aircraft |
| **Test data** | `{"pilot_id": "<R_ADVANCED pilot>", "aircraft_id": "<C0 aircraft>", "zone_code": "KBP-CTR-3", "window_start": "<today + 3 days>T10:00:00Z", "window_end": "<today + 3 days>T11:00:00Z", "requested_altitude_metres": 40, "flight_purpose": "QA GPIL-003"}` |

**Steps**
1. POST /api/v1/flight-requests with the Test data payload
2. POST /api/v1/flight-requests/{id}/submit
3. GET /api/v1/flight-requests/{id}

**Expected result**
Step 2 does not return `422`; step 3 shows `state = "UNDER_REVIEW"` and `failing_gate` empty

---

### API-GPIL-004 — R_BVLOS pilot passes the PILOT gate in an OPEN zone

| Field | Value |
|---|---|
| **Doc ref** | 06 §1.1 "Rating covers the zone's class" (`R_BVLOS` → `OPEN`, `CONTROLLED`, `RESTRICTED`) · `OH-1 §2.1` · 02 transitions |
| **Priority** | Medium |
| **Preconditions** | Logged in as an operator with `authorisation_level = L3`; pilot with `rating = R_BVLOS` and `certified_on` = today − 6 months; aircraft with `mtom_grams = 800` (band `C0`); no other `UNDER_REVIEW` or `APPROVED` request for this aircraft |
| **Test data** | `{"pilot_id": "<R_BVLOS pilot>", "aircraft_id": "<C0 aircraft>", "zone_code": "DNI-OPN-1", "window_start": "<today + 3 days>T10:00:00Z", "window_end": "<today + 3 days>T11:00:00Z", "requested_altitude_metres": 40, "flight_purpose": "QA GPIL-004"}` |

**Steps**
1. POST /api/v1/flight-requests with the Test data payload
2. POST /api/v1/flight-requests/{id}/submit
3. GET /api/v1/flight-requests/{id}

**Expected result**
Step 2 does not return `422`; step 3 shows `state = "UNDER_REVIEW"` and `failing_gate` empty

---

### API-GPIL-005 — R_BVLOS pilot passes the PILOT gate in a CONTROLLED zone

| Field | Value |
|---|---|
| **Doc ref** | 06 §1.1 "Rating covers the zone's class" (`R_BVLOS` → `OPEN`, `CONTROLLED`, `RESTRICTED`) · `OH-1 §2.1` · 06 §4 (`KBP-CTR-3` is `CONTROLLED`) · 02 transitions |
| **Priority** | Medium |
| **Preconditions** | Logged in as an operator with `authorisation_level = L3`; pilot with `rating = R_BVLOS` and `certified_on` = today − 6 months; aircraft with `mtom_grams = 800` (band `C0`); no other `UNDER_REVIEW` or `APPROVED` request for this aircraft |
| **Test data** | `{"pilot_id": "<R_BVLOS pilot>", "aircraft_id": "<C0 aircraft>", "zone_code": "KBP-CTR-3", "window_start": "<today + 3 days>T10:00:00Z", "window_end": "<today + 3 days>T11:00:00Z", "requested_altitude_metres": 40, "flight_purpose": "QA GPIL-005"}` |

**Steps**
1. POST /api/v1/flight-requests with the Test data payload
2. POST /api/v1/flight-requests/{id}/submit
3. GET /api/v1/flight-requests/{id}

**Expected result**
Step 2 does not return `422`; step 3 shows `state = "UNDER_REVIEW"` and `failing_gate` empty

---

### API-GPIL-006 — R_BVLOS pilot passes the PILOT gate in a RESTRICTED zone

| Field | Value |
|---|---|
| **Doc ref** | 06 §1.1 "Rating covers the zone's class" (`R_BVLOS` → `OPEN`, `CONTROLLED`, `RESTRICTED`) · `OH-1 §2.1` · 06 §4 (`LVV-RST-2` is `RESTRICTED`, ceiling 60 m, C0–C1, `L3`) · 02 transitions |
| **Priority** | High |
| **Preconditions** | Logged in as an operator with `authorisation_level = L3`; pilot with `rating = R_BVLOS` and `certified_on` = today − 6 months; aircraft with `mtom_grams = 800` (band `C0`); no other `UNDER_REVIEW` or `APPROVED` request for this aircraft |
| **Test data** | `{"pilot_id": "<R_BVLOS pilot>", "aircraft_id": "<C0 aircraft>", "zone_code": "LVV-RST-2", "window_start": "<today + 3 days>T10:00:00Z", "window_end": "<today + 3 days>T11:00:00Z", "requested_altitude_metres": 40, "flight_purpose": "QA GPIL-006"}` |

**Steps**
1. POST /api/v1/flight-requests with the Test data payload
2. POST /api/v1/flight-requests/{id}/submit
3. GET /api/v1/flight-requests/{id}

**Expected result**
Step 2 does not return `422`; step 3 shows `state = "UNDER_REVIEW"` and `failing_gate` empty

---

### API-GPIL-007 — R_BASIC pilot is refused in a CONTROLLED zone

| Field | Value |
|---|---|
| **Doc ref** | 06 §1.1 "Rating covers the zone's class" (`R_BASIC` → `OPEN` only) · `OH-1 §2.1` · 06 §6 (`PILOT` / rating doesn't cover zone class) · 03 "The `422` body" |
| **Priority** | High |
| **Preconditions** | Logged in as an operator with `authorisation_level = L3`; pilot with `rating = R_BASIC` and `certified_on` = today − 6 months; aircraft with `mtom_grams = 800` (band `C0`); no other `UNDER_REVIEW` or `APPROVED` request for this aircraft |
| **Test data** | `{"pilot_id": "<R_BASIC pilot>", "aircraft_id": "<C0 aircraft>", "zone_code": "KBP-CTR-3", "window_start": "<today + 3 days>T10:00:00Z", "window_end": "<today + 3 days>T11:00:00Z", "requested_altitude_metres": 40, "flight_purpose": "QA GPIL-007"}` |

**Steps**
1. POST /api/v1/flight-requests with the Test data payload
2. POST /api/v1/flight-requests/{id}/submit

**Expected result**
`422` with `failing_gate = "PILOT"`, `rule_reference = "OH-1 §2.1"` and a non-empty `message`

---

### API-GPIL-008 — R_BASIC pilot is refused in a RESTRICTED zone

| Field | Value |
|---|---|
| **Doc ref** | 06 §1.1 "Rating covers the zone's class" (`R_BASIC` → `OPEN` only) · `OH-1 §2.1` · 06 §6 (`PILOT` / rating doesn't cover zone class) · 03 "The `422` body" |
| **Priority** | High |
| **Preconditions** | Logged in as an operator with `authorisation_level = L3`; pilot with `rating = R_BASIC` and `certified_on` = today − 6 months; aircraft with `mtom_grams = 800` (band `C0`); no other `UNDER_REVIEW` or `APPROVED` request for this aircraft |
| **Test data** | `{"pilot_id": "<R_BASIC pilot>", "aircraft_id": "<C0 aircraft>", "zone_code": "LVV-RST-2", "window_start": "<today + 3 days>T10:00:00Z", "window_end": "<today + 3 days>T11:00:00Z", "requested_altitude_metres": 40, "flight_purpose": "QA GPIL-008"}` |

**Steps**
1. POST /api/v1/flight-requests with the Test data payload
2. POST /api/v1/flight-requests/{id}/submit

**Expected result**
`422` with `failing_gate = "PILOT"`, `rule_reference = "OH-1 §2.1"` and a non-empty `message`

---

### API-GPIL-009 — R_ADVANCED pilot is refused in a RESTRICTED zone

| Field | Value |
|---|---|
| **Doc ref** | 06 §1.1 "Rating covers the zone's class" (`R_ADVANCED` → `OPEN`, `CONTROLLED`) · `OH-1 §2.1` · 06 §6 (`PILOT` / rating doesn't cover zone class) · 03 "The `422` body" |
| **Priority** | High |
| **Preconditions** | Logged in as an operator with `authorisation_level = L3`; pilot with `rating = R_ADVANCED` and `certified_on` = today − 6 months; aircraft with `mtom_grams = 800` (band `C0`); no other `UNDER_REVIEW` or `APPROVED` request for this aircraft |
| **Test data** | `{"pilot_id": "<R_ADVANCED pilot>", "aircraft_id": "<C0 aircraft>", "zone_code": "LVV-RST-2", "window_start": "<today + 3 days>T10:00:00Z", "window_end": "<today + 3 days>T11:00:00Z", "requested_altitude_metres": 40, "flight_purpose": "QA GPIL-009"}` |

**Steps**
1. POST /api/v1/flight-requests with the Test data payload
2. POST /api/v1/flight-requests/{id}/submit

**Expected result**
`422` with `failing_gate = "PILOT"`, `rule_reference = "OH-1 §2.1"` and a non-empty `message`

---
