import { SITE } from '../config/site';
import bootstrap from '../data/rns-interfaces.json';

export interface RnsInterface {
  id: number | null;
  name: string;
  host: string;
  port: number | null;
  type: string;
  typeName: string;
  network: string;
  status: string;
  config: string;
}

export interface IfxPayload {
  items: RnsInterface[];
  fetchedAt: string;
  stale: boolean;
  count: number;
}

interface RawRow {
  id?: unknown;
  name?: unknown;
  host?: unknown;
  port?: unknown;
  type?: unknown;
  typeName?: unknown;
  network?: unknown;
  status?: unknown;
  config?: unknown;
}

let memo: IfxPayload | null = null;

function normalize(row: RawRow): RnsInterface | null {
  const name = typeof row.name === 'string' ? row.name.trim() : '';
  const host = typeof row.host === 'string' ? row.host.trim() : '';
  if (!name || !host) return null;
  let port: number | null = null;
  if (typeof row.port === 'number' && row.port >= 1 && row.port <= 65535) port = row.port;
  return {
    id: typeof row.id === 'number' ? row.id : null,
    name,
    host,
    port,
    type: typeof row.type === 'string' ? row.type : '',
    typeName: typeof row.typeName === 'string' ? row.typeName : '',
    network: typeof row.network === 'string' ? row.network : '',
    status: typeof row.status === 'string' ? row.status : '',
    config: typeof row.config === 'string' ? row.config : '',
  };
}

function payloadFromRows(raw: unknown, fetchedAt: string, stale: boolean): IfxPayload {
  const rows = Array.isArray(raw) ? raw : ((raw as { data?: unknown[]; interfaces?: unknown[] }).data ?? (raw as { interfaces?: unknown[] }).interfaces ?? []);
  const items = rows
    .map((r) => (r && typeof r === 'object' ? normalize(r as RawRow) : null))
    .filter((x): x is RnsInterface => x !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
  return { items, fetchedAt, stale, count: items.length };
}

export async function getInterfaces(): Promise<IfxPayload> {
  if (memo) return memo;
  try {
    const res = await fetch(SITE.rnsDirectoryApi, {
      headers: { Accept: 'application/json', 'User-Agent': 'meshchatx-website' },
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      const data = await res.json();
      const payload = payloadFromRows(data, new Date().toISOString(), false);
      if (payload.count > 0) {
        memo = payload;
        return memo;
      }
    }
  } catch {
    // offline or directory down: fall back to the bundled snapshot
  }
  memo = payloadFromRows(bootstrap, String((bootstrap as { fetchedAt?: string }).fetchedAt ?? ''), true);
  return memo;
}
