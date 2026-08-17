import { createClient } from '@supabase/supabase-js';

/** Cowork task as it appears in ZAOcowork tasks table. */
export interface CoworkTask {
  id: string;
  title: string;
  description?: string;
  brand?: string;
  project?: string;
  priority?: 'P1' | 'P2' | 'P3' | 1 | 2 | 3;
  metadata?: {
    effort?: 'quick' | 'focus' | 'heavy' | 'capital';
    [key: string]: unknown;
  };
  owner_fid?: string;
  assignee?: string;
  due_date?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

/** Lazy-init pattern: only create the client if env vars are set. */
let client: ReturnType<typeof createClient> | null = null;
let initError: string | null = null;

function initClient() {
  if (client !== null) return;
  if (initError) throw new Error(initError);

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    initError = 'SUPABASE_URL or SUPABASE_ANON_KEY not configured in .env';
    throw new Error(initError);
  }

  client = createClient(url, key);
}

/** Fetch open tasks from ZAOcowork.tasks, read-only via anon key + RLS.
 *  Returns empty array if Supabase is not configured, or on any error.
 *  Errors are logged but do not throw — graceful fallback. */
export async function getCoworkTasks(): Promise<CoworkTask[]> {
  try {
    initClient();
    if (!client) return [];

    const { data, error } = await client
      .from('tasks')
      .select('*')
      .eq('status', 'open')
      .order('due_date', { ascending: true })
      .order('priority', { ascending: false });

    if (error) {
      console.error('Supabase tasks fetch error:', error);
      return [];
    }

    return (data ?? []) as CoworkTask[];
  } catch (e) {
    console.error('Supabase client error:', e instanceof Error ? e.message : String(e));
    return [];
  }
}

/** Check if Supabase is properly configured. */
export function isSupabaseConfigured(): boolean {
  try {
    initClient();
    return !!client;
  } catch {
    return false;
  }
}

export { client };
