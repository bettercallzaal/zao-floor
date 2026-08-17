# zao-floor - the ZAO harness fork

Fork of munder-difflin (Chaitanya Giri, MIT - see LICENSE + NOTICE). An Electron
multi-agent office where agents are visible characters on a floor. This fork
rethemes and rewires it for The ZAO: the floor becomes the real ZAO fleet, the
tasks become the real cowork board, and the agents follow the same rules the
terminal sessions do.

Decided by Zaal 2026-08-17 (quick-grill in the zaoos-infra lane). All four
scopes approved for v1.

## Scope 1 - ZAO theme + naming

- Dark navy background `#0a1628`, gold accent `#f5a623` (ZAO dark theme,
  matches ZAOOS `.claude/rules/components.md`).
- App name: ZAO Floor. Window title, package.json name, About.
- The office floor is the ZAO office. Keep the pixel-art style.
- Agent characters named for the REAL lanes: ZOE (boss/orchestrator seat -
  replaces "Michael"), zaostock, zaoresearch, wavewarz, audos, ignite-radio,
  zao-fractaldata, zaoos-infra.
- No emojis anywhere in UI copy. No em dashes. Text labels only.
- Brand spellings exact: WaveWarZ, The ZAO, ZABAL, ZAOstock (glossary in
  ZAOOS CLAUDE.md).

## Scope 2 - Cowork board integration (READ-ONLY v1)

- The tasks tab reads the live ZAOcowork Supabase `tasks` table instead of
  local-only tasks.
- Read-only in v1: display open tasks grouped by brand/project with priority
  (P1/P2/P3), effort (metadata.effort: quick|focus|heavy|capital), owner,
  due date, overdue state. 432 open / 144 overdue as of 2026-08-17 - the whole
  point is making that pile workable by agents.
- Credentials via env only (`.env`, gitignored). NEVER commit keys. NEVER put
  the service-role key in renderer code - reads go through the main process or
  use the anon key with RLS. This repo is PUBLIC.
- v2 (NOT this build): agents claim and work board tasks. Design for it, do
  not build it.

## Scope 3 - Fleet mirror

- The floor characters mirror the REAL tmux lanes on this Mac, not just
  harness-spawned agents.
- State source: `tmux list-sessions` + the WAITING/WORKING state from
  `zao-cc-state.sh` (in ~/zaal-dotfiles/bin - read-only shell-outs from the
  Electron main process).
- A lane that is WORKING shows at its desk typing; WAITING shows idle with a
  "needs you" bubble; a dead/absent lane shows an empty desk.
- Clicking a lane character shows its recent pane output
  (`tmux capture-pane -p -t <lane>`), read-only.

## Scope 4 - Rules + memory wiring

- Harness-spawned Claude agents get the ZAO discipline: pass
  `--append-system-prompt` or working-dir selection so ZAOOS agents load
  `.claude/rules/*` (PR-only, no rm -rf, anti-fabrication, agent-spend).
- Surface the rules dir in the UI (a "rules" tab or the memory tab) so it is
  visible what discipline an agent is running under.
- Do NOT modify ~/.claude or ~/zaal-dotfiles from this app. Read-only.

## Ground rules for the build

- Upstream sync stays possible: keep diffs surgical, prefer new files/config
  over rewriting core, do not rename core modules without need.
- LICENSE stays. NOTICE credits upstream. Credit in README.
- No secrets in the repo. `.env.example` documents needed vars.
- Verify: `npm install`, typecheck if configured, app boots (`npm run dev`
  or electron-vite dev) with all four scopes visible.
- Work in phases, one scope per phase, commit per phase. Phase order: 1 theme,
  3 fleet mirror, 2 board read, 4 rules wiring (theme first proves the loop,
  fleet mirror is the highest-value visual, board next, rules last).
