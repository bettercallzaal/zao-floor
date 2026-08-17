import { execFile } from 'child_process';
import { promisify } from 'util';
import { expandTilde } from './fs';

const execFileAsync = promisify(execFile);

/** Real tmux lane names on the ZAO floor. */
const ZAO_LANES = [
  'ZOE',
  'zaostock',
  'zaoresearch',
  'wavewarz',
  'audos',
  'ignite-radio',
  'zao-fractaldata',
  'zaoos-infra'
] as const;

export type LaneName = (typeof ZAO_LANES)[number];

export type LaneStatus = 'WORKING' | 'WAITING' | 'IDLE' | 'DEAD';

export interface LaneState {
  name: LaneName;
  status: LaneStatus;
  recentOutput?: string;
}

/** Parse zao-cc-state.sh output to extract WORKING/WAITING state.
 *  Format is typically: "LANE_NAME=WORKING" or "LANE_NAME=WAITING" per line.
 *  Returns a map of lane name → status. */
function parseStateOutput(output: string): Map<string, LaneStatus> {
  const stateMap = new Map<string, LaneStatus>();
  const lines = output.split('\n').filter((l) => l.trim());
  for (const line of lines) {
    const [lane, status] = line.split('=').map((s) => s.trim());
    if (lane && (status === 'WORKING' || status === 'WAITING')) {
      stateMap.set(lane, status);
    }
  }
  return stateMap;
}

/** Fetch the current WORKING/WAITING state from zao-cc-state.sh.
 *  Gracefully returns empty map if the script is absent or fails. */
async function fetchStateFromScript(): Promise<Map<string, LaneStatus>> {
  try {
    const scriptPath = expandTilde('~/zaal-dotfiles/bin/zao-cc-state.sh');
    const { stdout } = await execFileAsync('bash', [scriptPath], { timeout: 5000 });
    return parseStateOutput(stdout);
  } catch (err) {
    // zao-cc-state.sh missing or failed - return empty, defer to tmux list
    console.debug('[fleet] zao-cc-state.sh failed, will use tmux list only', err);
    return new Map();
  }
}

/** Fetch the list of tmux sessions. Returns session names that exist. */
async function fetchTmuxSessions(): Promise<Set<string>> {
  try {
    const { stdout } = await execFileAsync('tmux', ['list-sessions', '-F', '#{session_name}'], {
      timeout: 5000
    });
    const sessions = new Set(
      stdout
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    );
    return sessions;
  } catch (err) {
    console.debug('[fleet] tmux list-sessions failed', err);
    return new Set();
  }
}

/** Fetch the recent pane output for a given tmux lane.
 *  Returns empty string if tmux is absent or the lane does not exist. */
export async function getLanePaneOutput(laneName: LaneName): Promise<string> {
  try {
    const { stdout } = await execFileAsync('tmux', ['capture-pane', '-t', laneName, '-p'], {
      timeout: 5000,
      maxBuffer: 1024 * 1024 // 1MB buffer for large pane content
    });
    return stdout;
  } catch (err) {
    console.debug(`[fleet] failed to capture pane for lane ${laneName}`, err);
    return '';
  }
}

/** Get the current state of all ZAO lanes.
 *  Combines tmux session list with zao-cc-state.sh WORKING/WAITING state.
 *  Gracefully degrades if tmux or zao-cc-state.sh is absent. */
export async function getFleetState(): Promise<LaneState[]> {
  const [sessions, stateMap] = await Promise.all([
    fetchTmuxSessions(),
    fetchStateFromScript()
  ]);

  const result: LaneState[] = [];
  for (const lane of ZAO_LANES) {
    const exists = sessions.has(lane);
    let status: LaneStatus;
    if (!exists) {
      status = 'DEAD';
    } else {
      status = stateMap.get(lane) ?? 'IDLE';
    }
    result.push({ name: lane, status });
  }
  return result;
}
