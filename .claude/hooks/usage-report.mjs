#!/usr/bin/env node
// SessionEnd hook: summarises token usage of the session that just ended and
// writes reports/ws2/<YYYY-MM-DD>-<session_id>.md.
//
// Transcript facts this relies on (checked against real transcripts, not assumed):
// - One JSON record per line. Usage lives on `type: "assistant"` records in
//   `message.usage`, model in `message.model`.
// - One API response can be written as several lines with the same
//   `message.id` (streaming fragments; output_tokens grows, only the last has
//   stop_reason). We keep the LAST line per message.id, never sum them.
// - `usage.cache_creation` splits cache writes into ephemeral_5m / ephemeral_1h.
// - `output_tokens` already includes thinking tokens.
// - Subagents are NOT in the main transcript: they live in
//   <transcript without .jsonl>/subagents/agent-<id>.jsonl (+ .meta.json with agentType).
// - Compaction = `type: "system", subtype: "compact_boundary"` with
//   `compactMetadata {trigger, preTokens, postTokens, durationMs}`. The
//   compaction call's own usage is not recorded, so it can't be priced.

import fs from 'node:fs'
import path from 'node:path'

// USD per million tokens, Anthropic first-party API list prices (claude-api
// skill model table, cached 2026-09-25). Cache writes = 1.25x input (5m TTL)
// and 2x input (1h TTL). Models missing here are reported with tokens but no
// $ amount. Re-check against the pricing page when models change.
// Shape: { input, output, cacheRead, cacheWrite5m, cacheWrite1h }
const HAIKU_4_5 = { input: 1, output: 5, cacheRead: 0.1, cacheWrite5m: 1.25, cacheWrite1h: 2 }
const PRICES = {
  'claude-opus-5-5': { input: 4, output: 20, cacheRead: 0.2, cacheWrite5m: 5, cacheWrite1h: 8 },
  'claude-sonnet-5-5': { input: 2, output: 10, cacheRead: 0.2, cacheWrite5m: 2.5, cacheWrite1h: 4 },
  'claude-fable-5-1': { input: 10, output: 50, cacheRead: 0.25, cacheWrite5m: 12.5, cacheWrite1h: 20 },
  'claude-haiku-4-5': HAIKU_4_5,
  'claude-haiku-4-5-20251001': HAIKU_4_5,
}

// usage.speed === "fast" (fast mode) is billed at 2x the standard rates
// (Opus 5.5: $8 / $40). Such calls are tallied under "<model> (fast)".
const FAST_SUFFIX = ' (fast)'
const FAST_MULTIPLIER = 2

const TOKEN_FIELDS = ['input', 'output', 'cacheRead', 'cacheWrite5m', 'cacheWrite1h']

function readJsonl(file) {
  const records = []
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue
    try {
      records.push(JSON.parse(line))
    } catch {
      // a half-written last line must not break the report
    }
  }
  return records
}

function emptyTotals() {
  return { calls: 0, input: 0, output: 0, thinking: 0, cacheRead: 0, cacheWrite5m: 0, cacheWrite1h: 0 }
}

// Returns { byModel: {model: totals}, compactions: [...] } for one transcript file.
function summarise(records) {
  const lastById = new Map()
  const compactions = []
  for (const r of records) {
    if (r.type === 'assistant' && r.message?.usage && r.message.model !== '<synthetic>') {
      lastById.set(r.message.id ?? r.uuid, r.message)
    }
    if (r.type === 'system' && r.subtype === 'compact_boundary') {
      const m = r.compactMetadata ?? {}
      compactions.push({ timestamp: r.timestamp, trigger: m.trigger, preTokens: m.preTokens, postTokens: m.postTokens, durationMs: m.durationMs })
    }
  }

  const byModel = {}
  for (const msg of lastById.values()) {
    const u = msg.usage
    const key = u.speed === 'fast' ? msg.model + FAST_SUFFIX : msg.model
    const t = (byModel[key] ??= emptyTotals())
    const write = u.cache_creation_input_tokens ?? 0
    // Without the 5m/1h breakdown, count the whole write as 5m.
    const write1h = u.cache_creation?.ephemeral_1h_input_tokens ?? 0
    const write5m = u.cache_creation ? (u.cache_creation.ephemeral_5m_input_tokens ?? 0) : write
    t.calls += 1
    t.input += u.input_tokens ?? 0
    t.output += u.output_tokens ?? 0
    t.thinking += u.output_tokens_details?.thinking_tokens ?? 0
    t.cacheRead += u.cache_read_input_tokens ?? 0
    t.cacheWrite5m += write5m
    t.cacheWrite1h += write1h
  }
  return { byModel, compactions }
}

function mergeInto(target, byModel) {
  for (const [model, t] of Object.entries(byModel)) {
    const acc = (target[model] ??= emptyTotals())
    for (const k of Object.keys(acc)) acc[k] += t[k]
  }
}

// null when the model has no price entry.
function cost(model, t) {
  const fast = model.endsWith(FAST_SUFFIX)
  const p = PRICES[fast ? model.slice(0, -FAST_SUFFIX.length) : model]
  if (!p) return null
  const base = TOKEN_FIELDS.reduce((sum, k) => sum + (t[k] * (p[k] ?? 0)) / 1_000_000, 0)
  return fast ? base * FAST_MULTIPLIER : base
}

const fmt = (n) => n.toLocaleString('en-US')
const usd = (c) => (c === null ? 'price not set' : `$${c.toFixed(4)}`)

function modelTable(byModel) {
  const rows = [
    '| Model | Calls | Input | Output (thinking) | Cache read | Cache write 5m | Cache write 1h | Cost |',
    '|---|---:|---:|---:|---:|---:|---:|---:|',
  ]
  for (const [model, t] of Object.entries(byModel)) {
    rows.push(`| \`${model}\` | ${t.calls} | ${fmt(t.input)} | ${fmt(t.output)} (${fmt(t.thinking)}) | ${fmt(t.cacheRead)} | ${fmt(t.cacheWrite5m)} | ${fmt(t.cacheWrite1h)} | ${usd(cost(model, t))} |`)
  }
  if (rows.length === 2) rows.push('| — | 0 | | | | | | |')
  return rows.join('\n')
}

function totalCost(byModel) {
  let sum = 0
  let unpriced = []
  for (const [model, t] of Object.entries(byModel)) {
    const c = cost(model, t)
    if (c === null) unpriced.push(model)
    else sum += c
  }
  return { sum, unpriced }
}

function readSubagents(transcriptPath) {
  const dir = path.join(transcriptPath.replace(/\.jsonl$/, ''), 'subagents')
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((f) => /^agent-.+\.jsonl$/.test(f))
    .sort()
    .map((f) => {
      const agentId = f.replace(/^agent-|\.jsonl$/g, '')
      let meta = {}
      try {
        meta = JSON.parse(fs.readFileSync(path.join(dir, `agent-${agentId}.meta.json`), 'utf8'))
      } catch {
        // meta file is optional
      }
      return { agentId, meta, ...summarise(readJsonl(path.join(dir, f))) }
    })
}

function render({ sessionId, input, main, subagents, date }) {
  const all = {}
  mergeInto(all, main.byModel)
  for (const s of subagents) mergeInto(all, s.byModel)
  const total = totalCost(all)
  const compactions = [...main.compactions.map((c) => ({ ...c, where: 'main' })), ...subagents.flatMap((s) => s.compactions.map((c) => ({ ...c, where: s.agentId })))]

  const out = []
  out.push(`# Usage report — ${date}`, '')
  out.push(`- **Session:** \`${sessionId}\``)
  out.push(`- **End reason:** ${input.reason ?? 'n/a'}`)
  out.push(`- **Transcript:** \`${input.transcript_path}\``)
  const pricedCount = Object.keys(all).length - total.unpriced.length
  const unpricedNote = total.unpriced.length ? ` (excludes unpriced: ${total.unpriced.map((m) => `\`${m}\``).join(', ')})` : ''
  out.push(`- **Total cost:** ${pricedCount ? usd(total.sum) + unpricedNote : 'price not set'}`)
  out.push(`- **Subagents:** ${subagents.length} · **Compactions:** ${compactions.length}`, '')

  out.push('## Total by model (main + subagents)', '', modelTable(all), '')
  out.push('## Main session', '', modelTable(main.byModel), '')

  out.push('## Subagents', '')
  if (!subagents.length) out.push('None.', '')
  for (const s of subagents) {
    const c = totalCost(s.byModel)
    out.push(`### \`${s.agentId}\` — ${s.meta.agentType ?? 'unknown type'}`, '')
    if (s.meta.description) out.push(`${s.meta.description} · cost ${usd(c.unpriced.length ? null : c.sum)}`, '')
    out.push(modelTable(s.byModel), '')
  }

  out.push('## Compactions', '')
  if (!compactions.length) out.push('None.', '')
  else {
    out.push('| When | Where | Trigger | Tokens before → after | Duration |', '|---|---|---|---|---:|')
    for (const c of compactions) {
      out.push(`| ${c.timestamp ?? ''} | ${c.where} | ${c.trigger ?? ''} | ${c.preTokens != null ? fmt(c.preTokens) : '?'} → ${c.postTokens != null ? fmt(c.postTokens) : '?'} | ${c.durationMs != null ? `${(c.durationMs / 1000).toFixed(1)}s` : ''} |`)
    }
    out.push('', '_The compaction call itself is not recorded in the transcript, so its cost is not included._', '')
  }

  out.push('---', 'Costs are API list-price equivalents (what these tokens would cost on the Anthropic API), not a subscription bill. Thinking tokens are already included in Output. Streaming fragments are de-duplicated by `message.id`.', '')
  return out.join('\n')
}

async function main() {
  let raw = ''
  for await (const chunk of process.stdin) raw += chunk
  const input = JSON.parse(raw)
  const { transcript_path: transcriptPath, session_id: sessionId } = input
  if (!transcriptPath || !sessionId || !fs.existsSync(transcriptPath)) {
    console.error(`usage-report: no transcript for session ${sessionId ?? '?'}`)
    return
  }

  const now = new Date()
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const report = render({
    sessionId,
    input,
    main: summarise(readJsonl(transcriptPath)),
    subagents: readSubagents(transcriptPath),
    date,
  })

  const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd()
  const outDir = path.join(projectDir, 'reports', 'ws2')
  fs.mkdirSync(outDir, { recursive: true })
  const outFile = path.join(outDir, `${date}-${sessionId}.md`)
  fs.writeFileSync(outFile, report)
  console.error(`usage-report: wrote ${outFile}`)
}

// A reporting hook must never break session shutdown.
main().catch((err) => {
  console.error(`usage-report: ${err?.stack ?? err}`)
  process.exit(0)
})
