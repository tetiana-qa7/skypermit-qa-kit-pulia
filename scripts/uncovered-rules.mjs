#!/usr/bin/env node
// Lists SkyPermit gate rules that have no test case yet, grouped by gate.
//
//   node scripts/uncovered-rules.mjs [--max N] [--gate PILOT|AIRCRAFT|ZONE|TIME_WINDOW|all]
//
// 1. Rules come from the `rule_reference` table in 06-business-rules.md §6.
// 2. 07-clarifications.md is applied through the explicit OVERRIDES list below
//    (07 is prose and isn't kept current, so it isn't parsed). Open/resolved
//    status comes from 05-open-questions.md, which is canonical.
// 3. A rule is covered when its rule_reference appears in its own gate's file
//    (GATE_FILES). Gate-scoped, because `ZC-2026.1 §2` is shared by AIRCRAFT
//    and ZONE: a ZONE case must not hide an AIRCRAFT gap.
//
// Prints JSON to stdout. Exits 1 when the docs no longer match the
// assumptions here (table changed, override didn't apply), so the caller
// stops instead of working from a wrong gap list.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DOCS = path.resolve(REPO, '../skypermit/docs')
const TEST_CASES = path.join(REPO, 'test-cases')

const GATES = ['PILOT', 'AIRCRAFT', 'ZONE', 'TIME_WINDOW']
const GATE_FILES = {
  PILOT: 'tc-gate-pilot.md',
  AIRCRAFT: 'tc-gate-aircraft.md',
  ZONE: 'tc-gate-zone.md',
  TIME_WINDOW: 'tc-gate-time-window.md',
}
// Where each gate's rule text lives in 06, for the case writer.
const GATE_SECTIONS = { PILOT: '06 §1.1', AIRCRAFT: '06 §1.2', ZONE: '06 §1.3', TIME_WINDOW: '06 §1.4' }

// Decisions from 07-clarifications.md. Each must match exactly one 06 §6 row.
const OVERRIDES = [
  { condition: /weight band/i, rule_reference: 'ZC-2026.1 §2', gate: 'AIRCRAFT', source: '07 item 1 (corpus error in ZC-2026.1 §2 wording)' },
  { condition: /altitude/i, rule_reference: 'ZC-2026.1 §2', gate: 'ZONE', source: '07 item 4' },
  { condition: /authorisation level/i, rule_reference: 'OH-1 §4', gate: 'ZONE', source: '07 item 4' },
]

// Rules tied to a row in 05's status table. While that row's status starts
// with "Open", the rule's cases must be written as Blocked.
const OPEN_QUESTION_LINKS = [
  { condition: /inactive/i, row: '5', ref: '05 §2 (row 5): zone `active` flag citation' },
]

function fail(message) {
  console.error(`uncovered-rules: ${message}`)
  process.exit(1)
}

function parseArgs(argv) {
  const args = { max: 3, gate: 'all' }
  for (let i = 0; i < argv.length; i++) {
    const [flag, inline] = argv[i].split('=')
    const value = inline ?? argv[++i]
    if (flag === '--max') args.max = value === 'all' ? Infinity : Number(value)
    else if (flag === '--gate') args.gate = String(value).toUpperCase() === 'ALL' ? 'all' : String(value).toUpperCase()
    else fail(`unknown argument ${argv[i]}`)
  }
  if (!(args.max >= 1) || (args.max !== Infinity && !Number.isInteger(args.max))) fail('--max must be a positive integer or "all"')
  if (args.gate !== 'all' && !GATES.includes(args.gate)) fail(`--gate must be one of ${GATES.join(', ')} or all`)
  return args
}

const read = (file) => {
  if (!fs.existsSync(file)) fail(`missing ${file}`)
  return fs.readFileSync(file, 'utf8')
}

// "OH-1 §2.1", "OH-1 § 2.1" and "OH-1 §2.1" in backticks all compare equal.
const normRef = (s) => s.replace(/`/g, '').replace(/\s*§\s*/g, ' §').replace(/\s+/g, ' ').trim()

// Rows of the first Markdown table after `heading`, as arrays of cell text.
function tableAfter(markdown, heading) {
  const start = markdown.search(heading)
  if (start < 0) fail(`heading ${heading} not found`)
  const rows = []
  let inTable = false
  for (const line of markdown.slice(start).split('\n').slice(1)) {
    if (line.startsWith('|')) {
      inTable = true
      const cells = line.split('|').slice(1, -1).map((c) => c.trim())
      if (!cells.every((c) => /^:?-+:?$/.test(c))) rows.push(cells)
    } else if (inTable) break
    else if (line.startsWith('## ')) break
  }
  return rows.slice(1) // drop header row
}

function loadRules() {
  const rows = tableAfter(read(path.join(DOCS, '06-business-rules.md')), /^## 6\. `rule_reference` values/m)
  if (!rows.length) fail('06 §6 rule_reference table is empty or moved')

  const rules = []
  const excluded = []
  for (const [gateCell, condition, refCell] of rows) {
    const gate = gateCell.match(/`([A-Z_]+)`/)?.[1]
    const rule_reference = normRef(refCell.match(/`([^`]+)`/)?.[1] ?? '')
    const note = refCell.replace(/`[^`]+`/, '').replace(/[*_()]/g, '').trim() || null
    if (!GATES.includes(gate)) {
      excluded.push({ condition, rule_reference, reason: `not a gate rule (06 §6 gate column: ${gateCell.replace(/[*_]/g, '')})` })
      continue
    }
    rules.push({ gate, condition, rule_reference, note_06: note })
  }

  const overrides_applied = []
  for (const o of OVERRIDES) {
    const hits = rules.filter((r) => o.condition.test(r.condition) && r.rule_reference === normRef(o.rule_reference))
    if (hits.length !== 1) fail(`07 override "${o.condition}" matched ${hits.length} rows in 06 §6; update OVERRIDES`)
    const [rule] = hits
    overrides_applied.push({ condition: rule.condition, rule_reference: rule.rule_reference, gate_in_06: rule.gate, gate: o.gate, changed: rule.gate !== o.gate, source: o.source })
    rule.gate = o.gate
  }

  const openRows = new Map(
    tableAfter(read(path.join(DOCS, '05-open-questions.md')), /^# Open Questions/m).map(([num, , status]) => [num, status])
  )
  for (const link of OPEN_QUESTION_LINKS) {
    const hits = rules.filter((r) => link.condition.test(r.condition))
    if (hits.length !== 1) fail(`open-question link "${link.condition}" matched ${hits.length} rows in 06 §6`)
    const status = openRows.get(link.row)
    if (status === undefined) fail(`05 status table has no row ${link.row}`)
    if (/^\**\s*open/i.test(status)) hits[0].blocked_by = link.ref
  }

  return { rules, excluded, overrides_applied }
}

function coverage(rule) {
  const file = path.join(TEST_CASES, GATE_FILES[rule.gate])
  if (!fs.existsSync(file)) return []
  const ids = []
  for (const block of fs.readFileSync(file, 'utf8').split(/\n---\n/)) {
    const id = block.match(/^### (\S+)/m)?.[1]
    if (id && normRef(block).includes(rule.rule_reference)) ids.push(id)
  }
  return ids
}

const args = parseArgs(process.argv.slice(2))
const { rules, excluded, overrides_applied } = loadRules()

const covered = []
const gaps = []
for (const rule of rules) {
  const entry = {
    id: `${rule.gate}:${rule.rule_reference}:${rule.condition}`,
    gate: rule.gate,
    condition: rule.condition,
    rule_reference: rule.rule_reference,
    doc_section: GATE_SECTIONS[rule.gate],
    gate_file: `test-cases/${GATE_FILES[rule.gate]}`,
    blocked_by: rule.blocked_by ?? null,
    note_06: rule.note_06,
  }
  const ids = coverage(rule)
  if (ids.length) covered.push({ ...entry, case_ids: ids })
  else gaps.push(entry)
}

const inScope = gaps
  .filter((g) => args.gate === 'all' || g.gate === args.gate)
  .sort((a, b) => GATES.indexOf(a.gate) - GATES.indexOf(b.gate))
const gapsByGate = Object.fromEntries(GATES.map((g) => [g, gaps.filter((x) => x.gate === g)]))

console.log(
  JSON.stringify(
    {
      args: { max: args.max === Infinity ? 'all' : args.max, gate: args.gate },
      totals: { rules: rules.length, covered: covered.length, uncovered: gaps.length, in_scope: inScope.length, selected: Math.min(inScope.length, args.max) },
      selected: inScope.slice(0, args.max),
      gaps_by_gate: gapsByGate,
      covered,
      excluded,
      overrides_applied,
    },
    null,
    2
  )
)
