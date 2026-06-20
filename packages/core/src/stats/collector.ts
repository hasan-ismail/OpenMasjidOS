/**
 * Live host system stats via systeminformation. Inside the container, /proc and
 * /sys reflect the host for CPU/memory/uptime, so these values describe the
 * MACHINE, not the container (CLAUDE.md §5, §12). CPU temperature is reported
 * "where available" — null when the kernel doesn't expose a sensor.
 */
import si from 'systeminformation';
import type { Systeminformation } from 'systeminformation';
import { DATA_DIR } from '../config';
import { runningProjectCount } from '../docker/discovery';

export interface StatsSnapshot {
  cpuPercent: number;
  memUsed: number;
  memTotal: number;
  diskUsed: number;
  diskTotal: number;
  cpuTempC: number | null;
  uptimeSec: number;
  appsRunning: number;
}

/** Pick the filesystem entry that best represents the machine's main disk. */
function pickDisk(list: Systeminformation.FsSizeData[]): { used: number; total: number } {
  if (!list || list.length === 0) return { used: 0, total: 0 };
  // Prefer the mount that contains our data dir, then root, then the largest.
  const byData = list.find((d) => d.mount && DATA_DIR.startsWith(d.mount) && d.size > 0);
  const root = list.find((d) => d.mount === '/' && d.size > 0);
  const largest = [...list].sort((a, b) => (b.size || 0) - (a.size || 0))[0];
  const chosen = byData ?? root ?? largest;
  return { used: chosen?.used ?? 0, total: chosen?.size ?? 0 };
}

export async function collectStats(): Promise<StatsSnapshot> {
  const [load, mem, disks, temp, appsRunning] = await Promise.all([
    si.currentLoad().catch(() => null),
    si.mem().catch(() => null),
    si.fsSize().catch(() => [] as Systeminformation.FsSizeData[]),
    si.cpuTemperature().catch(() => null),
    runningProjectCount().catch(() => 0),
  ]);

  const disk = pickDisk(disks);
  const tempMain = temp?.main;
  const cpuTempC = typeof tempMain === 'number' && tempMain > 0 ? Math.round(tempMain) : null;

  return {
    cpuPercent: load ? Math.max(0, Math.min(100, Math.round(load.currentLoad))) : 0,
    memUsed: mem ? (mem.active ?? mem.used) : 0,
    memTotal: mem?.total ?? 0,
    diskUsed: disk.used,
    diskTotal: disk.total,
    cpuTempC,
    uptimeSec: Math.round(si.time().uptime ?? 0),
    appsRunning,
  };
}
