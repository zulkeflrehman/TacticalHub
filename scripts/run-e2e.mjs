import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const workspace = process.cwd();
const serverEnvironment = {
  ...process.env,
  ENABLE_DEMO_FALLBACK: 'true',
  SKIP_FIRESTORE_IN_DEMO: 'true',
};
const nextCli = path.join(workspace, 'node_modules', 'next', 'dist', 'bin', 'next');
const playwrightCli = path.join(workspace, 'node_modules', '@playwright', 'test', 'cli.js');
const server = spawn(process.execPath, [nextCli, 'dev'], {
  cwd: workspace,
  env: serverEnvironment,
  stdio: 'inherit',
  windowsHide: true,
});

async function waitForServer() {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Next.js exited with code ${server.exitCode}.`);
    try {
      const response = await fetch('http://localhost:3000');
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Timed out waiting for the local Next.js test server.');
}

async function stopServer() {
  if (server.exitCode !== null || !server.pid) return;
  if (process.platform === 'win32') {
    const killer = spawn('taskkill.exe', ['/pid', String(server.pid), '/t', '/f'], {
      stdio: 'ignore',
      windowsHide: true,
    });
    await Promise.race([
      new Promise((resolve) => killer.once('exit', resolve)),
      new Promise((resolve) => killer.once('error', resolve)),
      new Promise((resolve) => setTimeout(resolve, 5_000)),
    ]);
    killer.unref();
    return;
  }
  server.kill('SIGTERM');
  await Promise.race([
    new Promise((resolve) => server.once('exit', resolve)),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);
  if (server.exitCode === null) server.kill('SIGKILL');
}

let exitCode = 1;
try {
  await waitForServer();
  exitCode = await new Promise((resolve, reject) => {
    const tests = spawn(process.execPath, [playwrightCli, 'test'], {
      cwd: workspace,
      env: process.env,
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
      }, 180_000);
    }
    tests.once('exit', (code) => finish(code ?? 1));
    tests.once('error', reject);
  });
} catch (error) {
  console.error(error);
} finally {
  await stopServer();
}

process.exit(exitCode);
