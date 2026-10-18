---
name: test-cases
description: Generate atomic, low-level manual test cases (one check per case, not end-to-end scenarios) from a requirements/spec file, a section of one, or a whole documentation folder, written as Markdown with ID, Doc ref, Priority, Preconditions, optional Test data, Steps and Expected result, filed into one file per module. Use this whenever the user asks for test cases, test checks, boundary/negative cases, "cover this rule/section/endpoint with tests", or wants to turn docs, business rules, API contracts or UI specs into executable manual checks — even if they just point at a file or section. Not for test plans, automated test code, or bug reports.
---

# Atomic test cases

Turn documentation into small, independent manual test cases that a tester can execute in any order and that fail for exactly one reason. One case = one check: a single condition and the single observable result that proves it. This is what makes a failed case directly reportable as a bug, and what makes coverage measurable rule by rule.

Expected results always come from the **docs**, never from the implementation. If code or developer tests disagree with the docs, the docs still define the expected result; the mismatch is a finding (see step 8).

## 1. Read the input and the project rules

The user gives a **file**, a **section** of a file, or a **folder**.

- Read the target fully. For a single file or section, also skim the docs it references (glossary, clarifications, open questions, data model) so expected results and precedence are right — but only write cases for the target.
- Read the project's `CLAUDE.md` and follow its rules on document precedence, read-only folders, open/unresolved items and output location. Project rules win over this skill's defaults.
- For a folder (or anything spanning more than ~3 modules), first reply with the modules you'd touch and a rough case count per module, and ask which to start with. Hundreds of cases in one go are hard to review; module by module keeps each batch checkable.

## 2. Load the module index

Test cases live in `test-cases/`, one file per module, described by `test-cases/README.md`. That README is the project-specific part: module names, file names, module codes, which docs feed each module, and the test levels in use. Read it before writing anything.

**If the README doesn't exist** (new project), propose one: derive modules from the docs and the system's structure (API resource groups, rule groups, UI areas — e.g. `app/api/*` folders, `lib/*` components, portal pages), with a short uppercase code for each. Show the table to the user and write the README only after they confirm. Use the README template at the end of this skill.

**Assigning a case to a module:** a case goes in the module whose behaviour it checks, not every module it touches. E.g. "a customer's loyalty tier shown on their profile" belongs to the customers module; "a discount is refused because the tier is too low" belongs to the discount-rules module that refuses it. This prevents the same check being written twice. If a case fits no module, propose a new one and add it to the README once the user agrees.

## 3. Check what already exists

- **Existing cases** in the target module files: read them so you don't duplicate checks, and continue numbering from the highest existing number. Never renumber or reuse an ID — bug reports and test runs reference them; a removed case's number stays retired.
- **A test plan** (e.g. in `test-plan/`): if one covers this input, use its risks for priority (step 6) and its out-of-scope list to skip things deliberately excluded.

## 4. Agree how many cases to write

Before writing, ask the user how many **positive** and how many **negative** cases they want — unless the request already says (e.g. "10 positive, 20 negative", "just the happy paths", "as many as needed"). The right volume depends on what they're doing (a quick smoke set vs full coverage), and only they know that.

- **Positive** = valid input or a permitted action, the system accepts it and behaves as documented (including boundary values that are still valid, e.g. exactly at a limit).
- **Negative** = invalid, missing or forbidden input or action, the system refuses it as documented (including values just outside a limit, wrong roles, illegal transitions).

Make the question easy to answer: after reading the docs, state how many checks you found for full coverage, split into positive and negative, and offer that as the default, e.g. *"Registration has about 6 positive and 14 negative checks. How many of each do you want? (default: all 6 + 14)"*. For a folder, ask this together with the module question from step 1, per module.

Then honour the numbers:
- **Fewer than full coverage:** pick by priority — High first, then Medium — so the most important rules are covered. List the checks you left out in the reply so the gap is visible.
- **More than the docs justify:** don't pad with near-duplicates or invented rules. Write the meaningful ones and say how many more would have been filler.
- Count Blocked / Not specified / Needs clarification cases within the type they test.

## 5. Derive atomic cases

Go rule by rule through the target. For each rule, apply the technique that fits, and emit one case per resulting check:

- **Boundary value analysis** for thresholds and limits: one case per value — on the boundary, and just outside it (e.g. for "max 2,000 characters", 2,000 and 2,001 characters are two cases). Add just-inside only when the boundary is exclusive or unclear.
- **Equivalence partitioning** for enums and input classes: one valid representative per class, and one case per invalid class (wrong value, wrong type, missing, empty).
- **Decision tables** for combined conditions: one case per rule row, each varying the one condition that row is about while the others hold.
- **State transitions**: one case per legal transition, and one case per illegal transition the docs single out (or a representative per source state if the docs say "everything else is illegal").
- **Error contracts**: for each documented error status/body, a case that triggers exactly that error.

What "atomic" means in practice:
- One condition varies; everything else is set up to pass, in Preconditions. If a case could fail for two different reasons, split it.
- The Expected result may list several fields of the **same** response when together they prove the one check (e.g. status `422` + error code + message for one rule failure). Different behaviours (create works *and* list shows it) are different cases.
- Steps are only the actions needed to perform the check — usually 1–4. Setup (state, logged-in role, existing records) belongs in Preconditions; the specific input values being checked belong in Test data when there are more than a step can carry cleanly.
- Be concrete: real endpoints, field names and values, UI element identifiers, roles. "Enter invalid data" is not a step; "POST /users with `age = -1`" is.

**Unresolved or contradictory items:** still write the case so the gap is visible, but never invent the expected result.
- Open question → Expected result starts with `**Blocked** — <open-question ref>`, then states what *is* known (e.g. "must not return 200").
- Docs contradict each other → `**Needs clarification** — <ref A> vs <ref B>`, with both readings in one line.
- Docs don't define the rule at all (no required/optional marking, no status code, no format or limit given) → `**Not specified in docs** — <ref where it would belong>`, then what the docs *do* imply (e.g. "must not succeed"). This is the most common gap: use it instead of guessing from code or common practice.
- Never write a conditional expected result ("if accepted, X; if refused, Y"). Two possible outcomes mean the docs don't decide — use one of the labels above.
- Values from superseded or proposal-only sources are never expected results.

## 6. Set priority

Use **High / Medium / Low**.
- With a test plan: take the impact of the risk the case addresses (H/M/L → High/Medium/Low). Boundary and negative cases of a High-risk rule stay High.
- Without a plan: judge by impact if the check failed — High for safety, security, data integrity, money or legal rules and core flows; Medium for important but recoverable behaviour; Low for cosmetic or rarely used behaviour.

## 7. Write the cases

For a complete, reviewed example of a module file, read `examples/tc-auth-operator-registration.md` (in this skill's folder) before writing: it shows the expected level of concreteness, self-contained test data per case, positive and negative cases, and the **Not specified in docs** label in use. It comes from one specific project — copy its form and level of detail, not its content.

**ID:** `<LEVEL>-<MODULE>-<NNN>` — LEVEL is where the check is observed, MODULE is the README code, NNN a 3-digit number continuing per LEVEL+MODULE.
- Levels: `API` (API response) and `UI` (screen/element). Don't write database-level cases. `E2E` is reserved for multi-step scenarios and is not used by this skill.

Module file layout (create the file with this header if it doesn't exist; append otherwise):

```markdown
# <Module name> — test cases

**Module code:** <CODE> · **Sources:** <docs this module draws on> · **Last updated:** <YYYY-MM-DD>

---

### API-ORD-004 — order total of 100.00 gets free shipping

| Field | Value |
|---|---|
| **Doc ref** | 03-pricing.md §2.1 · Shipping Policy §4 |
| **Priority** | High |
| **Preconditions** | Logged in as customer C-1 |
| **Test data** | Cart: item A × 2 at 30.00, item B × 1 at 40.00 (total 100.00); delivery country = DE |

**Steps**
1. POST /orders with the cart from Test data
2. GET /orders/{id}

**Expected result**
`shipping_fee = 0.00`

---
```

- **Title** after the ID: the check in a few words — readable in a test-run list ("100.00 order gets free shipping", not "Shipping test 3").
- **Doc ref:** doc file/number and section, plus the governing source rule citation when the docs give one. This is the traceability link; every case must have one.
- **Test data** (optional): the concrete input values the case uses — boundary values, payloads, records, files, accounts — so the tester doesn't have to invent them and the case is repeatable. Include it when the check depends on specific values or several inputs; leave the row out when the steps already state the only value (e.g. "POST /users with `age = -1`"). Write the values out in every case that uses them rather than pointing to shared fixtures elsewhere in the file — each case should be executable on its own.
- Keep cases in ID order within the file, separated by `---`. Update **Last updated** when you change the file.

## 8. Save and report

Write only the module files (and the README if confirmed). Don't create plans, automated tests or other artefacts unless asked.

Then reply with:
- files written/updated and the number of new cases in each, split into positive / negative against what the user asked for;
- counts of **Blocked**, **Needs clarification** and **Not specified in docs** cases, with their refs;
- separately, the concrete findings you noticed (contradictions, undefined boundaries, rules that can't be tested through any available interface, doc vs code/test mismatches), each with a doc citation. These are inputs for a requirements review or bug report, not test cases.

## README template (new projects only)

```markdown
# Test cases

One file per module. A case goes in the module whose behaviour it checks.

**ID format:** `<LEVEL>-<MODULE>-<NNN>` — numbering continues per level+module; IDs are never reused.

| Level | Used when the check is observed… |
|---|---|
| `API` | on an API response |
| `UI` | in a screen or UI element |

| Code | File | Module | Main docs |
|---|---|---|---|
| <CODE> | `tc-<module>.md` | <what it covers> | <doc refs> |
```
