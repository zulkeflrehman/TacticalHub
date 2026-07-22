import { spawn } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import process from 'node:process';

const workspace = process.cwd();
const outDirectory = path.join(workspace, 'out');
const nextCli = path.join(workspace, 'node_modules', 'next', 'dist', 'bin', 'next');
const playwrightCli = path.join(workspace, 'node_modules', '@playwright', 'test', 'cli.js');
const serverEnvironment = {
  ...process.env,
  ENABLE_DEMO_FALLBACK: 'true',
  SKIP_FIRESTORE_IN_DEMO: 'true',
};

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webp', 'image/webp'],
  ['.woff2', 'font/woff2'],
]);

function run(command, args, environment = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: workspace,
      env: environment,
      stdio: 'inherit',
      windowsHide: true,
    });
    child.once('exit', (code) => resolve(code ?? 1));
    child.once('error', reject);
  });
}

async function buildStaticExport() {
  const buildCode = await run(process.execPath, [nextCli, 'build'], serverEnvironment);
  if (buildCode !== 0) throw new Error(`Next.js production build exited with code ${buildCode}.`);
}

async function existingFileFor(pathname) {
  const relativePath = pathname.replace(/^\/+/, '');
  const resolvedPath = path.resolve(outDirectory, relativePath);
  if (resolvedPath !== outDirectory && !resolvedPath.startsWith(`${outDirectory}${path.sep}`)) return null;

  const candidates = [resolvedPath];
  if (!path.extname(resolvedPath)) candidates.push(path.join(resolvedPath, 'index.html'));

  for (const candidate of candidates) {
    try {
      const details = await stat(candidate);
      if (details.isFile()) return candidate;
      if (details.isDirectory()) {
        const indexFile = path.join(candidate, 'index.html');
        if ((await stat(indexFile)).isFile()) return indexFile;
      }
    } catch {
      // Try the next clean-URL candidate.
    }
  }
  return null;
}

function createStaticServer() {
  return createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url || '/', 'http://127.0.0.1').pathname);
      const requestedFile = await existingFileFor(pathname);
      const filePath = requestedFile || path.join(outDirectory, '404.html');
      const body = await readFile(filePath);
      response.writeHead(requestedFile ? 200 : 404, {
        'Cache-Control': 'no-store',
        'Content-Type': contentTypes.get(path.extname(filePath).toLowerCase()) || 'application/octet-stream',
      });
      response.end(body);
    } catch (error) {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(error instanceof Error ? error.message : 'Unable to serve the test artifact.');
    }
  });
}

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Unable to determine the static test server address.');
  const baseUrl = `http://127.0.0.1:${address.port}`;
  console.log(`Serving the production static export at ${baseUrl}`);
  return baseUrl;
}

async function close(server) {
  if (!server.listening) return;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

async function runPlaywright(baseUrl) {
  return new Promise((resolve, reject) => {
    const tests = spawn(process.execPath, [playwrightCli, 'test', ...process.argv.slice(2)], {
      cwd: workspace,
      env: { ...process.env, PLAYWRIGHT_BASE_URL: baseUrl },
      stdio: ['inherit', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let resolved = false;
    let testOutput = '';
    let windowsWatchdog;
    const finish = (code) => {
      if (resolved) return;
      resolved = true;
      if (windowsWatchdog) clearTimeout(windowsWatchdog);
      resolve(code);
    };
    tests.stdout.on('data', (chunk) => {
      testOutput += chunk.toString();
      process.stdout.write(chunk);
    });
    tests.stderr.on('data', (chunk) => {
      testOutput += chunk.toString();
      process.stderr.write(chunk);
    });
    if (process.platform === 'win32') {
      windowsWatchdog = setTimeout(() => {
        const plainOutput = testOutput
          .replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, '')
          .replace(/\[[0-9;]*m/g, '');
        const passed = plainOutput.includes('passed (') && !plainOutput.includes('failed');
        if (tests.exitCode === null && tests.pid) {
          const killer = spawn('taskkill.exe', ['/pid', String(tests.pid), '/t', '/f'], {
            stdio: 'ignore',
            windowsHide: true,
          });
          killer.unref();
        }
        finish(passed ? 0 : 1);
      }, 240_000);
    }
    tests.once('exit', (code) => finish(code ?? 1));
    tests.once('error', reject);
  });
}

const server = createStaticServer();
let exitCode = 1;
try {
  await buildStaticExport();
  const baseUrl = await listen(server);
  exitCode = await runPlaywright(baseUrl);
} catch (error) {
  console.error(error);
} finally {
  await close(server);
}

process.exit(exitCode);
