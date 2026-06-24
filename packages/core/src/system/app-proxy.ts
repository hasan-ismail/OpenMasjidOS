/**
 * Per-app HTTPS for apps that need a secure context (Stripe apps — the in-person
 * M2 reader / Stripe Terminal SDK and in-page Elements both require HTTPS).
 *
 * Such an app declares `https: true` in its manifest. The platform assigns it a
 * dedicated host port from a small pre-mapped range and runs an in-process TLS
 * terminator on that port (using the dashboard's cert) that forwards plain HTTP
 * to the app's own published port. The app itself stays a normal HTTP container;
 * only the public edge is TLS. Non-payment apps don't get a proxy at all.
 *
 * The app's HTTP port is published on the host, so the proxy reaches it via
 * `host.docker.internal` (the installer adds the host-gateway mapping to the core
 * service). The port range is mapped into the core container by the installer.
 */
import https from 'node:https';
import http from 'node:http';
import net from 'node:net';
import { loadCert } from './tls';
import { log } from '../logger';

function envInt(name: string, fallback: number): number {
  const n = Number.parseInt(process.env[name] ?? '', 10);
  return Number.isFinite(n) ? n : fallback;
}

const APP_TLS_MIN = envInt('OPENMASJID_APP_TLS_MIN', 8443);
const APP_TLS_MAX = envInt('OPENMASJID_APP_TLS_MAX', 8452);
/** How the core reaches an app's published host port (set via the installer's
 *  extra_hosts host-gateway mapping). Falls back to localhost in dev. */
const TARGET_HOST = process.env.OPENMASJID_APP_PROXY_TARGET ?? 'host.docker.internal';

interface AppProxy {
  server: https.Server;
  httpsPort: number;
  targetPort: number;
}

const proxies = new Map<string, AppProxy>();

export function appTlsPortRange(): { min: number; max: number } {
  return { min: APP_TLS_MIN, max: APP_TLS_MAX };
}

/** Ports currently bound by app proxies (so allocation doesn't collide). */
export function activeProxyPorts(): Set<number> {
  return new Set([...proxies.values()].map((p) => p.httpsPort));
}

/** First free HTTPS port in the range, avoiding `used`, or null if exhausted. */
export function allocateHttpsPort(used: Set<number>): number | null {
  for (let p = APP_TLS_MIN; p <= APP_TLS_MAX; p++) {
    if (!used.has(p)) return p;
  }
  return null;
}

/** Start (or move) the TLS proxy for an app: terminate TLS on httpsPort and
 *  forward to the app's HTTP port. Idempotent. No-op if no cert (dev). */
export function ensureProxy(id: string, httpsPort: number, targetPort: number): void {
  const existing = proxies.get(id);
  if (existing && existing.httpsPort === httpsPort && existing.targetPort === targetPort) return;
  if (existing) stopProxy(id);

  let cert: { cert: Buffer; key: Buffer };
  try {
    cert = loadCert();
  } catch {
    return; // no TLS cert available (e.g. local dev) — skip the proxy
  }

  const server = https.createServer({ key: cert.key, cert: cert.cert }, (req, res) => {
    const upstream = http.request(
      { host: TARGET_HOST, port: targetPort, method: req.method, path: req.url, headers: req.headers },
      (upRes) => {
        res.writeHead(upRes.statusCode ?? 502, upRes.headers);
        upRes.pipe(res);
      },
    );
    upstream.on('error', () => {
      if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain' });
      res.end('This app is not reachable right now.');
    });
    req.pipe(upstream);
  });

  // Forward WebSocket upgrades too (apps may use live sockets).
  server.on('upgrade', (req, socket, head) => {
    const upstream = net.connect(targetPort, TARGET_HOST, () => {
      upstream.write(`${req.method} ${req.url} HTTP/1.1\r\n`);
      for (let i = 0; i < req.rawHeaders.length; i += 2) {
        upstream.write(`${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}\r\n`);
      }
      upstream.write('\r\n');
      if (head && head.length) upstream.write(head);
      upstream.pipe(socket);
      socket.pipe(upstream);
    });
    upstream.on('error', () => socket.destroy());
    socket.on('error', () => upstream.destroy());
  });

  server.on('error', (err) => log.error(`App HTTPS proxy for "${id}" (:${httpsPort}) failed`, err));
  server.listen(httpsPort, '0.0.0.0');
  proxies.set(id, { server, httpsPort, targetPort });
  log.info(`App HTTPS proxy: "${id}" on :${httpsPort} → ${TARGET_HOST}:${targetPort}`);
}

export function stopProxy(id: string): void {
  const p = proxies.get(id);
  if (!p) return;
  try {
    p.server.close();
  } catch {
    /* already closed */
  }
  proxies.delete(id);
}

/** Re-apply the current cert to every running app proxy (after regen/upload). */
export function reloadProxyCerts(): void {
  let cert: { cert: Buffer; key: Buffer };
  try {
    cert = loadCert();
  } catch {
    return;
  }
  for (const p of proxies.values()) {
    try {
      p.server.setSecureContext({ key: cert.key, cert: cert.cert });
    } catch {
      /* best effort */
    }
  }
}
