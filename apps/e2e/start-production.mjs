import { spawn, spawnSync } from 'node:child_process';
import http from 'node:http';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { resolveE2ePorts } from './e2e-ports.mjs';

const workspaceRoot = process.cwd();
const { apiPort, gatewayPort: publicPort, frontendPort } = resolveE2ePorts();
const nxCli = `${workspaceRoot}/node_modules/nx/bin/nx.js`;
const children = [];
const corsOrigins = new Set(
  (process.env['CORS_ORIGIN'] || 'http://localhost:4200,http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);
corsOrigins.add(`http://localhost:${publicPort}`);

function runNx(args, label) {
  const result = spawnSync(
    process.execPath,
    [nxCli, ...args],
    { cwd: workspaceRoot, env: process.env, stdio: 'inherit' },
  );

  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} exited with status ${result.status}`);
}

function prepareCiDatabase() {
  if (process.env['E2E_SETUP_DATABASE'] !== 'true') return;

  runNx(['run', 'backend:prisma-generate', '--no-agents'], 'Prisma generate');
  runNx(['run', 'backend:prisma-migrate', '--no-agents'], 'Prisma migrate');
  runNx(['run', 'backend:prisma-seed', '--no-agents'], 'Prisma seed');
}

function buildProductionApps() {
  runNx(
    [
      'run-many',
      '--target=build',
      '--projects=backend,frontend',
      '--configuration=production',
      '--parallel=false',
      '--no-agents',
    ],
    'Production build',
  );
}

function startNode(label, args, env = {}) {
  const child = spawn(process.execPath, args, {
    cwd: workspaceRoot,
    env: { ...process.env, ...env },
    stdio: 'inherit',
  });
  child.on('exit', (code, signal) => {
    if (shuttingDown) return;
    console.error(`${label} exited unexpectedly (code ${code}, signal ${signal})`);
    shutdown(1);
  });
  children.push(child);
  return child;
}

async function waitForHealth(url, label) {
  const deadline = Date.now() + 60_000;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = new Error(`${label} returned HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await delay(500);
  }

  throw new Error(`${label} did not become healthy at ${url}: ${lastError}`);
}

let shuttingDown = false;
let gateway;

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  gateway?.close();
  for (const child of children) child.kill('SIGTERM');
  setTimeout(() => process.exit(exitCode), 1000).unref();
}

process.on('SIGINT', () => shutdown(130));
process.on('SIGTERM', () => shutdown(143));

async function start() {
  prepareCiDatabase();
  buildProductionApps();

  startNode('NestJS backend', ['--env-file-if-exists=.env', 'dist/apps/backend/main.js'], {
    API_PORT: String(apiPort),
    BETTER_AUTH_URL: `http://localhost:${apiPort}`,
    CORS_ORIGIN: [...corsOrigins].join(','),
  });
  await waitForHealth(`http://127.0.0.1:${apiPort}/api/health`, 'NestJS backend');

  startNode('Angular SSR frontend', ['--env-file-if-exists=.env', 'dist/apps/frontend/server/server.mjs'], {
    FE_PORT: String(frontendPort),
  });
  await waitForHealth(`http://127.0.0.1:${frontendPort}/health`, 'Angular SSR frontend');

  gateway = http.createServer((request, response) => {
    const targetPort = request.url?.startsWith('/api') || request.url?.startsWith('/assets/rich-text')
      ? apiPort
      : frontendPort;
    const proxy = http.request(
      {
        hostname: '127.0.0.1',
        port: targetPort,
        path: request.url,
        method: request.method,
        headers: { ...request.headers, host: `localhost:${publicPort}` },
      },
      (proxiedResponse) => {
        response.writeHead(proxiedResponse.statusCode || 502, proxiedResponse.headers);
        proxiedResponse.pipe(response);
      },
    );
    proxy.on('error', (error) => {
      console.error('E2E reverse proxy request failed:', error.message);
      if (!response.headersSent) response.writeHead(502);
      response.end('Bad gateway');
    });
    request.pipe(proxy);
  });

  gateway.listen(publicPort, '127.0.0.1');
  await once(gateway, 'listening');
  console.log(`E2E gateway listening on http://localhost:${publicPort}`);
}

start().catch((error) => {
  console.error(error);
  shutdown(1);
});
