---
name: cover-gaps
description: Find SkyPermit gate business rules (06-business-rules.md §6 rule_reference values, with 07 clarifications applied) that have no test case yet, write cases for them with the test-cases skill, have the tc-verifier subagent check every new case, delete cases that don't match the docs, log doc-silent cases as open questions, and return a JSON summary. Use when the user asks to cover missing/uncovered business rules or rule gaps, or runs /cover-gaps.
argument-hint: "[max-rules=3] [gate=all|PILOT|AIRCRAFT|ZONE|TIME_WINDOW]"
disable-model-invocation: true
---

# Cover rule gaps

Covers SkyPermit gate rules that have no test case yet, in three steps: find the gaps (script), write the cases (`test-cases` skill), verify them (`tc-verifier` subagent). Only verified cases are kept. Follow the project `CLAUDE.md` throughout; in particular, `../skypermit` is read-only.

## 0. Arguments

`$ARGUMENTS` = `[max] [gate]`, both optional, in either order:
- **max**: a positive integer, or `all`. Default `3`. The maximum number of **rules** to cover this run, not cases.
- **gate**: `PILOT`, `AIRCRAFT`, `ZONE`, `TIME_WINDOW` or `all` (case-insensitive). Default `all`.

Anything else: stop and show the accepted values. Don't guess.

## 1. Find the gaps

Run:

```bash
node scripts/uncovered-rules.mjs --max <max> --gate <gate>
```

- **Exit code 1:** the docs no longer match the script's assumptions. Stop and report the error. Don't work around it by reading the docs yourself; the script (its `OVERRIDES` or `OPEN_QUESTION_LINKS` lists) needs updating first.
- **`selected` is empty:** nothing to do. Go straight to step 4 with empty lists.
- Otherwise, work through `selected` in order. Each entry gives `gate`, `condition`, `rule_reference`, `doc_section` (where the rule text is in 06), `gate_file`, and `blocked_by` (an open question in `05`, or `null`).

What the script already handles, so don't redo it: the 07 gate reassignments (weight band → `AIRCRAFT`, item 1), excluding the registration row `OH-1 §3` (not a gate), and gate-scoped coverage (`ZC-2026.1 §2` is shared by `AIRCRAFT` and `ZONE`, so it's counted per gate file).

## 2. Write cases for each rule

For each selected rule, one at a time:

1. Note the `### <ID>` headings already in `gate_file` (if it exists), and its **Retired IDs** line if there is one.
2. Invoke the **`test-cases`** skill (Skill tool) with arguments stating:
   - **Target:** `../skypermit/docs/06-business-rules.md` `<doc_section>`, only the rule "`<condition>`" (`<rule_reference>`). Write cases for this rule only.
   - **Module file:** `<gate_file>`.
   - **Counts are pre-approved:** full coverage of this rule, positive and negative, including boundaries. Don't ask the user for counts or modules.
   - **Doc ref** of every case must contain `<rule_reference>` exactly as written. The gap script uses it to detect coverage.
   - **Numbering:** continue from the highest of the existing **and** retired IDs in the file. Never reuse a retired number.
   - If `blocked_by` is set: the expected result for the open part starts with `**Blocked** — <blocked_by>`, then states what is known. Don't assert the open item.
3. Diff the headings against step 2.1. The new IDs are this rule's cases. If none were written, record the rule as `not_covered` with the reason and move on.

## 3. Verify every new case

For each rule, spawn the **`tc-verifier`** subagent (Agent tool, `subagent_type: "tc-verifier"`) once, with all of that rule's new IDs. Wait for its report before acting on it. Apply each case's verdict:

| Verdict | Action |
|---|---|
| **Matches** | Keep. |
| **Doesn't match** | Delete the case from `gate_file`: the `### <ID>` block through its trailing `---`. Add the ID to a `**Retired IDs:**` line under the file header (create the line if missing). Record the verifier's **Why** in the summary. |
| **Documentation is silent (handled correctly)** | Keep the case (it carries the right label). Add an open-question entry for it to `test-cases/open-questions.md` (format below). |
| **Documentation is silent (asserted as fact)** | Treat as **Doesn't match**: the case invents a result, which CLAUDE.md forbids. Delete and retire it, and record it in the summary. |

Don't edit a case to make it pass. Fixing it is a new case for a later run. If the verifier's report is missing a case, or the verdict is unreadable, keep the case and list it under `unverified`.

After all rules, re-run `node scripts/uncovered-rules.mjs --max all --gate <gate>`. Every selected rule should now appear under `covered`. A rule whose cases were all deleted is still a gap; report it as `still_uncovered`.

### `test-cases/open-questions.md`

Create it if missing, with this header:

```markdown
# Open questions from test design

Questions found while writing test cases, where `../skypermit/docs` doesn't define the expected behaviour. Canonical project status stays in `../skypermit/docs/05-open-questions.md`; raise these with the rules owner.

---
```

Append one entry per case, numbering `OQ-NNN` from the highest existing number:

```markdown
### OQ-001 — <the undefined behaviour, phrased as a question>

| Field | Value |
|---|---|
| **Case** | <ID> in `<gate_file>` |
| **Rule** | <gate> · <condition> · `<rule_reference>` |
| **Where the answer belongs** | <doc + section the verifier named> |
| **Verifier note** | <the verifier's Why, 1–2 sentences> |
| **Raised** | <YYYY-MM-DD> by /cover-gaps |
| **Status** | Open |

---
```

If an open entry already covers the same question, add the case ID to that entry instead of creating a duplicate.

## 4. JSON summary

Print this as the final message's JSON block, and save it to `reports/ws2/cover-gaps-<YYYY-MM-DD>-<HHMM>.json`:

```json
{
  "run": { "date": "YYYY-MM-DD", "args": { "max": 3, "gate": "all" } },
  "gaps_before": 12,
  "gaps_after": 9,
  "rules": [
    {
      "id": "ZONE:OH-1 §4:Operator authorisation level too low",
      "gate": "ZONE",
      "rule_reference": "OH-1 §4",
      "gate_file": "test-cases/tc-gate-zone.md",
      "blocked_by": null,
      "status": "covered | still_uncovered | not_covered",
      "cases": {
        "kept": ["API-GZON-001"],
        "open_question": [{ "case": "API-GZON-003", "oq": "OQ-002" }],
        "deleted": [{ "case": "API-GZON-002", "verdict": "Doesn't match", "why": "..." }],
        "unverified": []
      }
    }
  ],
  "totals": { "rules_selected": 3, "rules_covered": 3, "cases_written": 9, "kept": 6, "open_questions": 1, "deleted": 2, "unverified": 0 },
  "candidate_bugs": [{ "case": "API-GZON-001", "code": "lib/gates/zone-gate.ts:26", "note": "..." }],
  "files_changed": ["test-cases/tc-gate-zone.md", "test-cases/open-questions.md"]
}
```

`gaps_before` and `gaps_after` are `totals.uncovered` from the step 1 and step 3 script runs. `candidate_bugs` collects the verifier's **Code** lines that report a difference. Above the JSON block, give at most three lines of plain-language summary. Don't commit; leave that to the user.
