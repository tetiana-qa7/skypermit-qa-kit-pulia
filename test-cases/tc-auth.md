# Operator registration & authentication — test cases

**Module code:** AUTH · **Sources:** `03-api-contract.md` "Authentication & authorisation", "Registry" #1, "Error semantics"; `04-frontend-spec.md` "Operator portal", "Selector stability"; `01-data-model.md` "Operator", "Enumerations"; `05-open-questions.md` §1 · **Last updated:** 2026-10-18

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
| **Doc ref** | 03 "Authentication & authorisation" ("`authorisation_level` is no longer self-service") · 04 "Operator portal" · 01 "Enums" (`L1` < `L2` < `L3`) |
| **Priority** | High |
| **Preconditions** | Logged out; no operator with email `qa.new6@example.test` or national_id `QA-NID-0006` exists |
| **Test data** | `{"email": "qa.new6@example.test", "password": "Qa-Passw0rd!2026", "legal_name": "QA New Six LLC", "national_id": "QA-NID-0006", "authorisation_level": "L3"}` |

**Steps**
1. POST /api/v1/operators with the Test data payload
2. GET /api/v1/auth/me with the session cookie from step 1, if one was set

**Expected result**
**Not specified in docs** — 03 "Authentication & authorisation" says registration always creates `L1`, but not whether a client-sent `authorisation_level` is rejected (`400`) or ignored (gap → requirements finding). Known:
- If step 1 returns `201`: the step 1 response body and the step 2 `GET /auth/me` response both show `authorisation_level = "L1"` (not `L2` or `L3`).
- If step 1 returns `4xx`: no session cookie is set, no operator with email `qa.new6@example.test` or national_id `QA-NID-0006` exists, and `POST /api/v1/auth/login` with these credentials fails.

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

### API-AUTH-008 — valid credentials set a session cookie accepted by /auth/me

| Field | Value |
|---|---|
| **Doc ref** | 03 "Authentication & authorisation" (`POST /auth/login`: "Log in with email + password; sets the session cookie"; `GET /auth/me`) |
| **Priority** | High |
| **Preconditions** | No session cookie held; operator `qa.login1@example.test` is registered with password `Qa-Passw0rd!2026` and `status = ACTIVE` |
| **Test data** | `{"email": "qa.login1@example.test", "password": "Qa-Passw0rd!2026"}` |

**Steps**
1. POST /api/v1/auth/login with the Test data payload; keep the session cookie from the response
2. GET /api/v1/auth/me with that cookie only

**Expected result**
Step 1 succeeds (2xx) and sets a session cookie. Step 2 returns `200` with the operator profile whose `email = "qa.login1@example.test"`. (03 doesn't document the login response's exact success code or body.)

---

### API-AUTH-009 — login session authorises an operator-scoped endpoint

| Field | Value |
|---|---|
| **Doc ref** | 03 "Authentication & authorisation" ("Enforcement — server-derived": operator-scoped endpoints derive `operator_id` from the session) · 03 "Registry" (`GET /pilots` extension) |
| **Priority** | High |
| **Preconditions** | No session cookie held; operator `qa.login1@example.test` is registered with password `Qa-Passw0rd!2026` and `status = ACTIVE` |
| **Test data** | `{"email": "qa.login1@example.test", "password": "Qa-Passw0rd!2026"}` |

**Steps**
1. POST /api/v1/auth/login with the Test data payload; keep the session cookie
2. GET /api/v1/pilots with that cookie only (no `X-Reviewer-Id` header)

**Expected result**
Step 2 returns `200` with a list (not `401`)

---

### API-AUTH-010 — logging in as a second operator switches the session

| Field | Value |
|---|---|
| **Doc ref** | 03 "Authentication & authorisation" (`POST /auth/login` "sets the session cookie"; `GET /auth/me`) |
| **Priority** | High |
| **Preconditions** | Operators `qa.login1@example.test` and `qa.login2@example.test` are both registered with password `Qa-Passw0rd!2026` and `status = ACTIVE`; the client holds a valid session cookie for `qa.login1@example.test` |
| **Test data** | `{"email": "qa.login2@example.test", "password": "Qa-Passw0rd!2026"}` |

**Steps**
1. POST /api/v1/auth/login with the Test data payload, sending the existing `qa.login1` cookie; keep the cookie set by the response
2. GET /api/v1/auth/me with the cookie from step 1

**Expected result**
Step 2 returns `200` with `email = "qa.login2@example.test"`, not `qa.login1@example.test`

---

### API-AUTH-011 — wrong password is refused

| Field | Value |
|---|---|
| **Doc ref** | 03 "Authentication & authorisation" (`POST /auth/login`) · 03 "Error semantics" |
| **Priority** | High |
| **Preconditions** | No session cookie held; operator `qa.login1@example.test` is registered with password `Qa-Passw0rd!2026` and `status = ACTIVE` |
| **Test data** | `{"email": "qa.login1@example.test", "password": "Wrong-Passw0rd!2026"}` |

**Steps**
1. POST /api/v1/auth/login with the Test data payload; keep any cookie from the response
2. GET /api/v1/auth/me with that cookie (or no cookie if none was set)

**Expected result**
**Not specified in docs** — 03 defines no status for failed login (`401` in "Error semantics" is described as "no operator session", not bad credentials). Known: step 1 does not succeed (not 2xx), and step 2 returns `401`.

---

### API-AUTH-012 — unregistered email is refused

| Field | Value |
|---|---|
| **Doc ref** | 03 "Authentication & authorisation" (`POST /auth/login`) · 03 "Error semantics" |
| **Priority** | High |
| **Preconditions** | No session cookie held; no operator with email `qa.nobody@example.test` exists |
| **Test data** | `{"email": "qa.nobody@example.test", "password": "Qa-Passw0rd!2026"}` |

**Steps**
1. POST /api/v1/auth/login with the Test data payload; keep any cookie from the response
2. GET /api/v1/auth/me with that cookie (or no cookie if none was set)

**Expected result**
**Not specified in docs** — 03 defines no status for failed login, nor whether an unknown email must be indistinguishable from a wrong password. Known: step 1 does not succeed (not 2xx), and step 2 returns `401`.

---

### API-AUTH-013 — login without email returns 400

| Field | Value |
|---|---|
| **Doc ref** | 03 "Authentication & authorisation" (`POST /auth/login`: "email + password") · 03 "Error semantics" (`400` Malformed request body) |
| **Priority** | Medium |
| **Preconditions** | No session cookie held |
| **Test data** | `{"password": "Qa-Passw0rd!2026"}` (no `email` key) |

**Steps**
1. POST /api/v1/auth/login with the Test data payload

**Expected result**
`400` with a validation detail body; no session cookie is set

---

### API-AUTH-014 — login without password returns 400

| Field | Value |
|---|---|
| **Doc ref** | 03 "Authentication & authorisation" (`POST /auth/login`: "email + password") · 03 "Error semantics" (`400` Malformed request body) |
| **Priority** | Medium |
| **Preconditions** | No session cookie held; operator `qa.login1@example.test` is registered |
| **Test data** | `{"email": "qa.login1@example.test"}` (no `password` key) |

**Steps**
1. POST /api/v1/auth/login with the Test data payload

**Expected result**
`400` with a validation detail body; no session cookie is set

---

### API-AUTH-015 — non-JSON login body returns 400

| Field | Value |
|---|---|
| **Doc ref** | 03 header ("JSON in, JSON out") · 03 "Error semantics" (`400` Malformed request body) |
| **Priority** | Medium |
| **Preconditions** | No session cookie held |
| **Test data** | Header `Content-Type: application/json`; raw body `email=qa.login1@example.test&password=Qa-Passw0rd!2026` |

**Steps**
1. POST /api/v1/auth/login with the raw body from Test data

**Expected result**
`400` with a validation detail body; no session cookie is set

---

### API-AUTH-016 — SUSPENDED operator logs in

| Field | Value |
|---|---|
| **Doc ref** | 01 "Enumerations" (`Operator.status`: `ACTIVE`, `SUSPENDED`) · 05 §1 · 03 "Authentication & authorisation" (`POST /auth/login`) |
| **Priority** | Medium |
| **Preconditions** | No session cookie held; operator `qa.susp@example.test` is registered with password `Qa-Passw0rd!2026` and has `status = SUSPENDED` (set out-of-band — no documented API changes `status`) |
| **Test data** | `{"email": "qa.susp@example.test", "password": "Qa-Passw0rd!2026"}` |

**Steps**
1. POST /api/v1/auth/login with the Test data payload

**Expected result**
**Not specified in docs** — 05 §1 makes `SUSPENDED` a precondition on write operations (create, submit, approve) only, and its status/body there is still open; no doc says whether login itself is allowed. Record the actual status and whether a session cookie is set.

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

### UI-AUTH-004 — logged-out header shows the login link

| Field | Value |
|---|---|
| **Doc ref** | 04 "Selector stability" (`operator-login-link`, `operator-register-link` "shown when logged out"; `operator-session-info` / `operator-logout-button` "shown when logged in") |
| **Priority** | Medium |
| **Preconditions** | No operator session (fresh browser profile, cookies cleared); header role switcher set to operator |

**Steps**
1. Open the app's home page `/`
2. Inspect the header

**Expected result**
`operator-login-link` is visible; `operator-session-info` and `operator-logout-button` are not present

---

### UI-AUTH-005 — valid login on /login shows the logged-in header

| Field | Value |
|---|---|
| **Doc ref** | 04 "Operator portal" (Login page `/login`) · 04 "Selector stability" (`operator-session-info`, `operator-logout-button`, `operator-login-link`) |
| **Priority** | High |
| **Preconditions** | No operator session; header role switcher set to operator; operator `qa.login1@example.test` is registered with password `Qa-Passw0rd!2026` and `status = ACTIVE` |
| **Test data** | Form inputs: email `qa.login1@example.test`, password `Qa-Passw0rd!2026` |

**Steps**
1. Open `/login`
2. Fill email and password with the values from Test data
3. Click the form's submit button

**Expected result**
The header shows `operator-session-info` and `operator-logout-button`, and `operator-login-link` is no longer shown

---

### UI-AUTH-006 — wrong password on /login leaves the user logged out

| Field | Value |
|---|---|
| **Doc ref** | 04 "Operator portal" (Login page `/login`) · 04 "Selector stability" · 03 "Authentication & authorisation" (`POST /auth/login`) |
| **Priority** | High |
| **Preconditions** | No operator session; header role switcher set to operator; operator `qa.login1@example.test` is registered with password `Qa-Passw0rd!2026` |
| **Test data** | Form inputs: email `qa.login1@example.test`, password `Wrong-Passw0rd!2026` |

**Steps**
1. Open `/login`
2. Fill email and password with the values from Test data
3. Click the form's submit button

**Expected result**
The header still shows `operator-login-link`, and `operator-session-info` / `operator-logout-button` are not shown. (04 doesn't specify an error message or its `data-testid` for a failed login.)

---

### UI-AUTH-007 — operator portal page opened while logged out

| Field | Value |
|---|---|
| **Doc ref** | 04 "Operator portal" ("Requires login") |
| **Priority** | High |
| **Preconditions** | No operator session (cookies cleared); operator `qa.login1@example.test` has at least one registered pilot |

**Steps**
1. Open the operator pilots registry page directly by URL (`/operator/pilots` in the current build — 04 doesn't name portal routes)

**Expected result**
**Not specified in docs** — 04 says the operator portal "Requires login" but not whether a logged-out visitor is redirected to `/login`, shown a message, or something else. Known: no operator's pilot data is shown, and the pilot create form can't be submitted successfully.

---
