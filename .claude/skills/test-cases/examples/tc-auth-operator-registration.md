# Operator registration & authentication — test cases

**Module code:** AUTH · **Sources:** `03-api-contract.md` "Authentication & authorisation", "Registry" #1, "Error semantics"; `04-frontend-spec.md` "Operator portal", "Selector stability"; `01-data-model.md` "Operator" · **Last updated:** 2026-10-18

---

### API-AUTH-001 — valid registration creates the operator profile

| Field | Value |
|---|---|
| **Doc ref** | 03 "Authentication & authorisation" (`POST /operators`) · 03 "Registry" #1 · 01 "Operator" |
| **Priority** | High |
| **Preconditions** | Logged out; no operator with email `qa.new1@example.test` or national_id `QA-NID-0001` exists |
| **Test data** | `{"email": "qa.new1@example.test", "password": "Qa-Passw0rd!2026", "legal_name": "QA New One LLC", "national_id": "QA-NID-0001", "phone": "+380441234567", "address_line": "1 Test Street", "city": "Kyiv", "postal_code": "01001"}` |

**Steps**
1. POST /api/v1/operators with the Test data payload as the JSON body

**Expected result**
The request succeeds (2xx) and the body is the new Operator profile: an `id` (UUID), and `legal_name`, `national_id`, `email`, `phone`, `address_line`, `city`, `postal_code` equal to the values sent. (The exact success code isn't documented in 03.)

---

### API-AUTH-002 — a new operator is created at authorisation level L1

| Field | Value |
|---|---|
| **Doc ref** | 03 "Authentication & authorisation" ("Registration always creates an operator at `L1`") · 04 "Operator portal" |
| **Priority** | High |
| **Preconditions** | Logged out; no operator with email `qa.new2@example.test` or national_id `QA-NID-0002` exists |
| **Test data** | `{"email": "qa.new2@example.test", "password": "Qa-Passw0rd!2026", "legal_name": "QA New Two LLC", "national_id": "QA-NID-0002"}` (no `authorisation_level` key) |

**Steps**
1. POST /api/v1/operators with the Test data payload

**Expected result**
`authorisation_level = "L1"` in the response body

---

### API-AUTH-003 — registration signs the caller in

| Field | Value |
|---|---|
| **Doc ref** | 03 "Authentication & authorisation" ("then signs the caller in (session cookie)") · 04 "Operator portal" ("logging the operator in immediately") |
| **Priority** | High |
| **Preconditions** | Logged out; no prior call to `/auth/login`; no operator with email `qa.new3@example.test` or national_id `QA-NID-0003` exists |
| **Test data** | `{"email": "qa.new3@example.test", "password": "Qa-Passw0rd!2026", "legal_name": "QA New Three LLC", "national_id": "QA-NID-0003"}` |

**Steps**
1. POST /api/v1/operators with the Test data payload; keep the session cookie from the response
2. GET /api/v1/auth/me with that cookie only

**Expected result**
Step 2 returns `200` with the operator profile whose `id` equals the `id` returned in step 1

---

### API-AUTH-004 — duplicate email is refused

| Field | Value |
|---|---|
| **Doc ref** | 01 "Operator" (`email` unique) · 03 "Error semantics" |
| **Priority** | High |
| **Preconditions** | Logged out; an operator with email `qa.opa@example.test` and national_id `QA-NID-000A` is already registered; no operator with national_id `QA-NID-0004` exists |
| **Test data** | `{"email": "qa.opa@example.test", "password": "Qa-Passw0rd!2026", "legal_name": "QA Dup Email LLC", "national_id": "QA-NID-0004"}` |

**Steps**
1. POST /api/v1/operators with the Test data payload

**Expected result**
**Not specified in docs** — 01 "Operator" makes `email` unique, but 03 "Error semantics" defines no status for a uniqueness conflict. Known: the request does not succeed (not 2xx), and no second operator with email `qa.opa@example.test` exists.

---

### API-AUTH-005 — duplicate national_id is refused

| Field | Value |
|---|---|
| **Doc ref** | 01 "Operator" (`national_id` unique) · 03 "Error semantics" |
| **Priority** | High |
| **Preconditions** | Logged out; an operator with email `qa.opa@example.test` and national_id `QA-NID-000A` is already registered; no operator with email `qa.new5@example.test` exists |
| **Test data** | `{"email": "qa.new5@example.test", "password": "Qa-Passw0rd!2026", "legal_name": "QA Dup NID LLC", "national_id": "QA-NID-000A"}` |

**Steps**
1. POST /api/v1/operators with the Test data payload

**Expected result**
**Not specified in docs** — 01 "Operator" makes `national_id` unique, but 03 "Error semantics" defines no status for a uniqueness conflict. Known: the request does not succeed (not 2xx), and no second operator with national_id `QA-NID-000A` exists.

---

### API-AUTH-006 — client-sent authorisation_level L3 does not elevate the operator

| Field | Value |
|---|---|
| **Doc ref** | 03 "Authentication & authorisation" ("`authorisation_level` is no longer self-service") · 04 "Operator portal" |
| **Priority** | High |
| **Preconditions** | Logged out; no operator with email `qa.new6@example.test` or national_id `QA-NID-0006` exists |
| **Test data** | `{"email": "qa.new6@example.test", "password": "Qa-Passw0rd!2026", "legal_name": "QA New Six LLC", "national_id": "QA-NID-0006", "authorisation_level": "L3"}` |

**Steps**
1. POST /api/v1/operators with the Test data payload
2. GET /api/v1/auth/me with the session cookie from step 1, if one was set

**Expected result**
**Not specified in docs** — 03 says registration always creates `L1`, but not whether a client-sent `authorisation_level` is rejected (`400`) or ignored. Known: no operator ends up at `L3`.

---

### API-AUTH-007 — client-sent id is not used as the operator id

| Field | Value |
|---|---|
| **Doc ref** | 01 "Operator" `id` ("Set at registration to the Supabase Auth user's own id") · 03 "Enforcement — server-derived, not client-supplied" |
| **Priority** | High |
| **Preconditions** | Logged out; no operator with email `qa.new7@example.test` or national_id `QA-NID-0007` exists |
| **Test data** | `{"email": "qa.new7@example.test", "password": "Qa-Passw0rd!2026", "legal_name": "QA New Seven LLC", "national_id": "QA-NID-0007", "id": "11111111-1111-4111-8111-111111111111"}` |

**Steps**
1. POST /api/v1/operators with the Test data payload

**Expected result**
**Not specified in docs** — 03 "Enforcement" says ids are server-derived, not client-supplied, but not whether a client-sent `id` is rejected (`400`) or ignored. Known: no operator is created with id `11111111-1111-4111-8111-111111111111`.

---

### UI-AUTH-001 — credentials and profile fields are on one form with one submit

| Field | Value |
|---|---|
| **Doc ref** | 04 "Operator portal" ("Registration is a single combined form … in one submit") |
| **Priority** | High |
| **Preconditions** | Logged out |

**Steps**
1. Open `/register`

**Expected result**
One form shows inputs for email, password, `legal_name` and `national_id` (plus the other profile fields), with a single submit button. There is no second step or page.

---

### UI-AUTH-002 — successful registration logs the operator in immediately

| Field | Value |
|---|---|
| **Doc ref** | 04 "Operator portal" ("creating both together and logging the operator in immediately") · 04 "Selector stability" (`operator-session-info`, `operator-logout-button`) |
| **Priority** | High |
| **Preconditions** | Logged out; `/register` open; no operator with email `qa.new8@example.test` or national_id `QA-NID-0008` exists |
| **Test data** | Form inputs: email `qa.new8@example.test`, password `Qa-Passw0rd!2026`, legal name `QA New Eight LLC`, national ID `QA-NID-0008` |

**Steps**
1. Fill the form with the values from Test data
2. Click the form's submit button

**Expected result**
Without visiting `/login`, the header shows `operator-session-info` and `operator-logout-button`, and `operator-register-link` is no longer shown

---

### UI-AUTH-003 — register form has no authorisation_level field

| Field | Value |
|---|---|
| **Doc ref** | 04 "Operator portal" ("`authorisation_level` is not a field on this form") · 03 "Authentication & authorisation" |
| **Priority** | High |
| **Preconditions** | Logged out |

**Steps**
1. Open `/register`
2. Inspect every input, select and radio in the form

**Expected result**
No control for authorisation level: no label, input or option offering `L1`/`L2`/`L3`

---
