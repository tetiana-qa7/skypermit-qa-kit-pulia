---
name: test-plan
description: Generate a concise one-page test plan (objectives, scope, risks, test strategy with manual vs automated split, environment & test data, Definition of Ready, Definition of Done) from a single requirements/spec file or a whole documentation directory, following ISTQB and ISO/IEC/IEEE 29119-3 practice. Use this whenever the user asks for a test plan, QA plan, test strategy, test approach, "what should we test and how", entry/exit criteria, or DoR/DoD for testing based on docs, specs, requirements, user stories or a feature description — even if they don't say "test plan" explicitly or only point at a file or folder.
---

# One-page test plan

Produce a test plan that a lead, developer or stakeholder can read in a few minutes and act on. It follows the structure recommended by ISTQB (CTFL v4.0, "Test Planning") and ISO/IEC/IEEE 29119-3, compressed to the parts that change decisions: what's in scope, what could go wrong, how we'll test it, and when testing may start and stop.

**Length:** aim for ~500–800 words for a single file, and never exceed **1,000 words** (hard limit, by `wc -w`) even for a whole documentation folder. Write compactly from the first draft — short doc-number citations like (`06` §3), one-line list items — rather than writing long and trimming in several passes. A plan nobody reads in one sitting doesn't get used. When over, compress rather than drop sections: merge related scope rows, keep one line per list item, keep risks to the top 5–7, and summarise test data as categories plus key boundary values. Every line should tell the reader something specific to *these* docs — generic statements like "functional testing will verify the functionality" are the first to cut.

## 1. Read the input

The user gives either a **file** or a **directory**.

- **Directory**: list it, then read every requirements-like document (Markdown, text, specs, ADRs, diagrams-as-text). The whole set is in scope unless the user narrows it.
- **Single file**: that file defines the scope. Still skim sibling docs it references (glossary, clarifications, open questions, data model) so expected behaviour and precedence are right — but don't widen scope to them.

Check the project's `CLAUDE.md` (and any README in the docs folder) for rules about document precedence, read-only folders, open/blocked items, or where output goes. Those project rules win over defaults in this skill.

While reading, collect:
- Features / components / rules, and how they're grouped (these become scope items and risk areas).
- Explicit thresholds, state machines, error codes, enums, calculations — good candidates for automation and for boundary/decision-table techniques.
- UI/portal behaviour, workflows with human judgement, wording/UX — good candidates for manual and exploratory testing.
- Open questions, contradictions, superseded or proposal-only sources, ambiguous rules. These don't get their own section; they feed **Risks** (as project/requirement risks) and **Definition of Ready** (resolution as an entry condition). Never invent an expected result for an unresolved item — mark the affected area as blocked.

## 2. Look for existing automated tests

The manual/automated split should reflect what already exists, otherwise the plan duplicates work or misses gaps. Look for test directories near the documented system (e.g. `tests/`, `__tests__/`, `*.test.*`, `*.spec.*`, `e2e/`, `playwright/`, `cypress/`) and note which areas they appear to cover, judging from file names and a quick look at `describe`/test titles. Read only — don't run or modify anything. If there's no codebase available, say so in one line under Strategy and decide from heuristics alone.

Don't read application source code by default — docs and test titles are enough to plan. A test title that clearly contradicts the docs (e.g. "rejects … with 400" where the docs say `422`) is already enough to report as a finding. Open a source file only when a suspected mismatch can't be judged from docs and test titles, and keep it to that file. Anything confirmed this way goes into the findings list in your reply, not the plan.

## 3. Decide manual vs automated

Present the result as two lists of features or areas, one for automated and one for manual testing. Tag every item with the risk it addresses (e.g. "(R2)"); an item that maps to no risk is either a sign a risk is missing or a candidate to cut. Use these heuristics to sort them:

**Automate** (or rely on existing automation) when the check is deterministic, repeatable and data-heavy: business-rule thresholds and boundaries, state-transition legality, API status codes and response bodies, validation, calculations/derived fields, regression of anything already fixed.

**Test manually** when it needs judgement or is cheap to look at but expensive to script: exploratory sessions on new features, end-to-end workflows across roles, UI/UX and wording, reviewer/approval decisions, error-message clarity, anything still changing or blocked by open questions (automating an unstable spec wastes effort).

Where existing tests already cover an area, say so with the full path (e.g. "partly covered by developer tests in `../app/tests/lib/x.test.ts`") rather than re-planning it. Always make ownership clear: a bare "existing tests" or a relative path reads as if QA wrote or ran them.

## 4. Assess risks

Use risk-based testing (ISTQB): list the product risks (what could fail for users) and project risks (what could stop or distort testing — e.g. ambiguous or contradictory docs, open questions, missing environment, superseded sources someone might test against). Rate each **Likelihood** and **Impact** as H/M/L, and let the rating drive priority: high-risk areas get more techniques, earlier testing, and appear first in the strategy. Keep it to the 5–7 risks that matter most.

Keep risks at the level of a **risk area** — "derived values calculated wrongly at boundaries", "docs and schema out of sync" — not specific defects or contradictions you spotted while reading ("doc says 422 but test expects 400"). A plan is written before testing; a concrete mismatch is already a finding or candidate bug, and listing it as a risk makes the plan read like a bug report and date quickly. Name the area and the kind of failure; at most add a short "e.g." pointing to the doc section. Report the concrete findings separately in your reply (see step 6).

## 5. Write the plan

Use this template. Section order is fixed so plans are comparable; adapt row counts to the input. Cite source documents (file and section) wherever a scope item, risk or criterion comes from a specific place — traceability is what makes the plan reviewable.

```markdown
# Test Plan — <system / feature>

**Source:** <file or directory> · **Date:** <YYYY-MM-DD> · **Version:** 0.1 (draft) · **Author:** <user or "QA">

## 1. Objectives
<2–3 bullets: what this testing must demonstrate or find, tied to the docs.>

## 2. Scope
| In scope | Out of scope |
|---|---|
| <feature/rule area> (<doc §>) | <item> — <why: not in docs / proposal only / other team / later phase> |

## 3. Risks
| # | Risk | Type | L | I | Mitigation / test focus |
|---|---|---|---|---|---|
| R1 | <risk area: what could go wrong> (<doc §>) | Product | H | H | <technique / area to prioritise> |
| R2 | <class of spec problem, e.g. open questions leave expected results undefined> | Project | M | H | Affected cases blocked until resolved |

## 4. Strategy
**Test levels & types:** <e.g. component (existing unit tests), API/integration, system E2E, UI; functional, negative, boundary, state-transition, regression, plus any relevant non-functional: security/access, usability, accessibility, performance — only those the docs justify.>
**Techniques:** <equivalence partitioning, BVA, decision tables, state-transition, exploratory — mapped to the areas they fit.>

**Automated testing.** Stable, repeatable, data-heavy checks:
- <feature/area> (<risk #>). <If partly covered: "Partly covered by developer tests in `<path>`."> <What QA adds.>

**Manual testing.** Needs judgement, or the spec isn't stable yet:
- <feature/area> (<risk #>)
- **Blocked:** <area>, until <open question> is resolved (<risk #>)

*<If existing tests were found: one line saying who owns them, where they live, and that QA reviewed their titles/coverage but didn't run them.>*

## 5. Environment & test data
- **Environment:** <where tests run, required services, roles/accounts.>
- **Test data:** <seed entities, boundary values, states needed; note anything that must be created.>

## 6. Definition of Ready
**Testing can start when:**
- <entry criteria: docs baselined, blocking open questions resolved or explicitly deferred, build deployed, env & data available, …>

**A requirement/story is ready for testing when:**
- <per-item DoR: has acceptance criteria and expected results, cites a rule/source, no unresolved conflicts, testable data-testids/endpoints defined, …>

## 7. Definition of Done
**Testing is complete when:**
- <exit criteria: all high-risk areas tested, pass rate, no open critical/high defects, blocked items documented, regression run green, report delivered, …>
```

Make the criteria concrete and checkable ("all R1–R3 test cases executed and passed") rather than vague ("sufficient testing done").

## 6. Save and report

Save to `test-plan/test-plan-<topic>.md` in the current repo, e.g. `test-plan/test-plan-data-model.md`. Produce only the test plan — don't generate test cases or other artefacts unless asked. Then reply with the path, a 2–3 line summary (highest risks, anything blocked), and — as a separate list in the reply, not in the plan — the concrete requirements findings and candidate bugs you noticed while reading (contradictions, doc/code mismatches, untestable rules), each with its doc citation.
