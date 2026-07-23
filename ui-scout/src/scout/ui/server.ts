import fs from 'fs';
import http from 'http';
import path from 'path';
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import { URL } from 'url';
import { resetScoutArtifacts } from '../report';

const ROOT = process.cwd();
const REPORT_DIR = path.join(ROOT, 'scout-report');
const BASELINE_DIR = path.join(ROOT, 'scout-baselines');
const PUBLIC_DIR = path.join(__dirname, 'public');
const PORT = Number(process.env.SCOUT_UI_PORT ?? 4177);

type RunState = {
  running: boolean;
  startedAt?: string;
  finishedAt?: string;
  exitCode?: number | null;
  options: Record<string, string>;
  log: string[];
};

const state: RunState = {
  running: false,
  options: {},
  log: [],
};

let child: ChildProcessWithoutNullStreams | null = null;
const sseClients = new Set<http.ServerResponse>();

function appendLog(line: string): void {
  state.log.push(line);
  if (state.log.length > 2000) state.log.splice(0, state.log.length - 2000);
  const payload = `data: ${JSON.stringify({ type: 'log', line })}\n\n`;
  for (const client of sseClients) client.write(payload);
}

function broadcastStatus(): void {
  const payload = `data: ${JSON.stringify({ type: 'status', state: publicState() })}\n\n`;
  for (const client of sseClients) client.write(payload);
}

function publicState() {
  return {
    running: state.running,
    startedAt: state.startedAt,
    finishedAt: state.finishedAt,
    exitCode: state.exitCode,
    options: state.options,
    logTail: state.log.slice(-80),
  };
}

function readJson(filePath: string): unknown | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  const raw = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(raw);
}

function contentType(filePath: string): string {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
  if (filePath.endsWith('.png')) return 'image/png';
  if (filePath.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

function safeJoin(base: string, requestPath: string): string | null {
  const cleaned = decodeURIComponent(requestPath).replace(/^\/+/, '');
  const resolvedBase = path.resolve(base);
  const resolved = path.resolve(resolvedBase, cleaned);
  const relative = path.relative(resolvedBase, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;
  return resolved;
}

function serveFile(res: http.ServerResponse, filePath: string): void {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404).end('Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': contentType(filePath) });
  fs.createReadStream(filePath).pipe(res);
}

async function readBody(req: http.IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

function startScout(options: Record<string, string>): void {
  if (state.running) return;

  resetScoutArtifacts(REPORT_DIR);

  state.running = true;
  state.startedAt = new Date().toISOString();
  state.finishedAt = undefined;
  state.exitCode = undefined;
  state.options = options;
  state.log = [];
  appendLog(`Starting UI Scout with ${JSON.stringify(options)}`);
  broadcastStatus();

  const env = {
    ...process.env,
    ...options,
    FORCE_COLOR: '0',
  };

  child = spawn('npx', ['playwright', 'test', '--config=playwright.scout.config.ts', '--project=scout'], {
    cwd: ROOT,
    env,
    shell: false,
  });

  child.stdout.on('data', (buf: Buffer) => {
    for (const line of buf.toString().split(/\r?\n/)) {
      if (line.trim()) appendLog(line);
    }
  });
  child.stderr.on('data', (buf: Buffer) => {
    for (const line of buf.toString().split(/\r?\n/)) {
      if (line.trim()) appendLog(line);
    }
  });
  child.on('close', (code) => {
    state.running = false;
    state.finishedAt = new Date().toISOString();
    state.exitCode = code;
    appendLog(`Scout finished with exit code ${code}`);
    broadcastStatus();
    child = null;
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const { pathname } = url;

  if (pathname === '/api/status' && req.method === 'GET') {
    return sendJson(res, 200, publicState());
  }

  if (pathname === '/api/report' && req.method === 'GET') {
    const report = readJson(path.join(REPORT_DIR, 'scout-report.json'));
    if (!report) return sendJson(res, 404, { error: 'No report yet. Run a scan first.' });
    return sendJson(res, 200, report);
  }

  if (pathname === '/api/events' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write(`data: ${JSON.stringify({ type: 'status', state: publicState() })}\n\n`);
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  if (pathname === '/api/run' && req.method === 'POST') {
    if (state.running) return sendJson(res, 409, { error: 'A scan is already running.' });
    try {
      const body = JSON.parse((await readBody(req)) || '{}') as Record<string, unknown>;
      const options: Record<string, string> = {
        BASE_URL: String(body.baseUrl || process.env.BASE_URL || 'https://www.saucedemo.com'),
        SCOUT_AUTH: String(body.authMode || 'auto'),
        SCOUT_VIEWPORTS: String(body.viewports || 'desktop'),
        SCOUT_MAX_PAGES: String(body.maxPages || 8),
        SCOUT_START_PATH: String(body.startPath || '/'),
        SCOUT_SEED_PATHS: String(body.seedPaths || body.startPath || '/'),
        SCOUT_A11Y: body.a11y === false ? 'false' : 'true',
        SCOUT_VISUAL: body.visual === false ? 'false' : 'true',
        SCOUT_UPDATE_BASELINES: body.updateBaselines ? 'true' : 'false',
        SCOUT_SCREENSHOTS: 'true',
      };

      if (body.authMode === 'form') {
        if (body.loginPath) options.SCOUT_LOGIN_PATH = String(body.loginPath);
        if (body.username) options.SCOUT_USERNAME = String(body.username);
        if (body.password) options.SCOUT_PASSWORD = String(body.password);
        if (body.userSelector) options.SCOUT_USER_SELECTOR = String(body.userSelector);
        if (body.passwordSelector) options.SCOUT_PASSWORD_SELECTOR = String(body.passwordSelector);
        if (body.submitSelector) options.SCOUT_SUBMIT_SELECTOR = String(body.submitSelector);
        if (body.successUrl) options.SCOUT_SUCCESS_URL = String(body.successUrl);
        if (body.successSelector) options.SCOUT_SUCCESS_SELECTOR = String(body.successSelector);
      }

      // "auto" lets resolveScoutAuthMode() pick none/form/sauce
      if (options.SCOUT_AUTH === 'auto') delete options.SCOUT_AUTH;

      startScout(options);
      return sendJson(res, 202, { ok: true, state: publicState() });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return sendJson(res, 400, { error: message });
    }
  }

  if (pathname.startsWith('/files/screenshots/')) {
    const file = safeJoin(path.join(REPORT_DIR, 'screenshots'), pathname.replace('/files/screenshots/', ''));
    if (!file) return res.writeHead(400).end('Bad path');
    return serveFile(res, file);
  }
  if (pathname.startsWith('/files/diffs/')) {
    const file = safeJoin(path.join(REPORT_DIR, 'diffs'), pathname.replace('/files/diffs/', ''));
    if (!file) return res.writeHead(400).end('Bad path');
    return serveFile(res, file);
  }
  if (pathname.startsWith('/files/baselines/')) {
    const file = safeJoin(BASELINE_DIR, pathname.replace('/files/baselines/', ''));
    if (!file) return res.writeHead(400).end('Bad path');
    return serveFile(res, file);
  }
  if (pathname === '/report') {
    return serveFile(res, path.join(REPORT_DIR, 'scout-report.html'));
  }

  const asset = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
  const file = safeJoin(PUBLIC_DIR, asset);
  if (!file) return res.writeHead(400).end('Bad path');
  return serveFile(res, file);
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`\nUI Scout dashboard: http://localhost:${PORT}\n`);
});
