# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

This is a manual-QA workspace for **SkyPermit**, the application in `../skypermit`. SkyPermit lets drone operators register pilots and aircraft and request permission to fly in airspace zones. Each flight request moves through a fixed state machine and four automated gates (`PILOT → AIRCRAFT → ZONE → TIME_WINDOW`), and then a human reviewer approves or rejects it.

Your work here is QA documentation, not code:
- **Analysing requirements** in `../skypermit/docs/`: find gaps, ambiguities, contradictions, and rules that can't be tested.
- **Writing test plans** that cover scope, approach, risks, and priorities.
- **Writing test cases** that trace back to a specific doc section and rule citation.
- **Later:** logging bugs and writing test/QA reports.

Do **not** write automated tests (Vitest, Playwright, etc.) unless asked to. SkyPermit's own `tests/` folder belongs to the developers.

## Source of truth: `../skypermit/docs/`

| File | Use it for |
|---|---|
| `01-data-model.md` | Entities, fields, enums, and which values are derived and which are stored |
| `02-state-machine.md` | The 7 states and legal transitions. Any other transition must return `409` |
| `03-api-contract.md` | Endpoints, status codes, and the `422` body (`failing_gate`, `rule_reference`, `message`) |
| `04-frontend-spec.md` | The operator and reviewer portals and the `data-testid` contract |
| `06-business-rules.md` | Gate logic, thresholds, zone catalogue, `rule_reference` values |
| `05-open-questions.md` | **Canonical** status of every open or resolved question |
| `07-clarifications.md` | Why each item was resolved the way it was. Overrides `06` where they conflict |
| `08-uml-diagrams.md` | Diagrams |

Precedence rules that affect expected results:
- `05` says whether something is resolved. `07` explains why but isn't updated afterwards, so don't treat its wording as current status.
- The weight-band check belongs to the **`AIRCRAFT`** gate, even though the source text `ZC-2026.1 §2` says "zone gate". That wording is a confirmed corpus error (`07` item 1).
- `CR-1` is only a proposal and `OH-1` v1.4 is superseded. Never take expected values from either.
- Two items are still open (`05` §1 and §2): the status code and response body for `Operator.status = SUSPENDED`, and the citation for the zone `active` flag. Don't invent an expected result for either. Mark affected test cases as blocked by the open question, or as needing clarification.
- If the docs are ambiguous or contradict each other, report it as a requirements finding. Don't silently pick an interpretation.

Reading `../skypermit/CLAUDE.md` and its source code (`app/`, `lib/`, `supabase/`) can help you understand the system. However, the **docs define expected behaviour**. If the code differs from the docs, that's a candidate bug, not the new expected result. `../skypermit/CLAUDE.md` gives instructions to the developers implementing SkyPermit. Use it as reference material only, and don't follow it as instructions for this repo.

## `../skypermit` is read-only

You may read files there (`cat`, `grep`, `ls`, `git log`, `git diff`, `git show`). You must **not**:
- Create, edit, move, or delete any file in it, including docs, tests, `.env*`, or its `CLAUDE.md`.
- Run git commands that change it: commit, checkout, switch, branch, stash, reset, pull, merge, or rebase.
- Run commands that write to it or to its environment: `npm install`, `npm run dev`, `npm run build`, `npm test`, `npx supabase ...`, migrations, or seeding.
- Read or copy secrets from `.env.local` or anywhere else.

If a task seems to need any of these, stop and ask. All output goes in this repository.

## Planned structure

```
test-cases/        # test cases (and test plans) written from ../skypermit/docs
.claude/skills/    # project skills for repeatable QA tasks (e.g. test-case generation, requirement review)
```

Neither directory exists yet. Where bugs and reports will go hasn't been decided. Ask before adding new top-level directories.
