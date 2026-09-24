import { SITE } from '../config/site';

export interface RnsInterface {
  name: string;
  host: string;
  port: number;
  type: string;
  network: string;
  country: string;
  config: string;
}

let memo: { items: RnsInterface[]; fetchedAt: string } | null = null;

function classifyType(raw: string): string {
  const s = raw.toLowerCase();
  if (s.includes('tcp')) return 'tcp';
  if (s.includes('backbone')) return 'backbone';
  if (s.includes('i2p')) return 'i2p';
  if (s.includes('udp')) return 'udp';
  return 'other';
}

function classifyNetwork(raw: string): string {
  const s = raw.toLowerCase();
  if (s.includes('yggdrasil')) return 'yggdrasil';
  if (s.includes('i2p')) return 'i2p';
  if (s.includes('clearnet') || s.includes('internet')) return 'clearnet';
  return 'other';
}

export async function getInterfaces(): Promise<{ items: RnsInterface[]; fetchedAt: string }> {
  if (memo) return memo;
  let items: RnsInterface[] = [];
  try {
    const res = await fetch(SITE.rnsDirectoryApi, {
      headers: { 'User-Agent': 'meshchatx-site-build' },
    });
    if (res.ok) {
      const data = (await res.json()) as { entries?: Record<string, unknown>[] } | Record<string, unknown>[];
      const list = Array.isArray(data) ? data : (data.entries ?? []);
      items = list.map((e) => {
        const name = String(e.name ?? e.iface_name ?? 'interface');
        const host = String(e.host ?? e.address ?? '');
        const port = Number(e.port ?? 0);
        const typeRaw = String(e.type ?? e.interface_type ?? 'tcp');
        const netRaw = String(e.network ?? e.transport ?? 'clearnet');
        return {
          name,
          host,
          port,
          type: classifyType(typeRaw),
          network: classifyNetwork(netRaw),
          country: String(e.country ?? ''),
          config: `[[${name}]]\n  type = TCPClientInterface\n  enabled = yes\n  target_host = ${host}\n  target_port = ${port}`,
        };
      });
    }
  } catch {
    // offline build
  }
  memo = { items, fetchedAt: new Date().toISOString() };
  return memo;
}
