import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const testDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(testDir, '..', '..');

function readFromRoot(relativePath) {
  return readFileSync(resolve(repoRoot, relativePath), 'utf8');
}

test('gitignore excludes frontend build output', () => {
  const source = readFromRoot('.gitignore');

  assert.ok(source.includes('frontend/dist/'));
  assert.ok(source.includes('backend/.venv/'));
});

test('backend helper script exists and validates Python availability', () => {
  const scriptPath = resolve(repoRoot, 'scripts/backend-dev.ps1');

  assert.ok(existsSync(scriptPath), 'Expected scripts/backend-dev.ps1 to exist');

  const source = readFileSync(scriptPath, 'utf8');
  assert.ok(source.includes('[ValidateSet("doctor", "test", "serve", "migrate", "smoke")]'));
  assert.ok(source.includes('[string]$BindHost'));
  assert.ok(source.includes("AppData\\Local\\Programs\\Python"));
  assert.ok(source.includes('WindowsApps\\python.exe'));
  assert.ok(source.includes('No usable Python interpreter'));
  assert.ok(source.includes('"alembic.ini"'));
});

test('local stable operator script and runbook exist', () => {
  const localStableScript = resolve(repoRoot, 'scripts/local-stable.ps1');
  const runbookPath = resolve(repoRoot, 'LOCAL-STABLE.md');

  assert.ok(existsSync(localStableScript), 'Expected scripts/local-stable.ps1 to exist');
  assert.ok(existsSync(runbookPath), 'Expected LOCAL-STABLE.md to exist');

  const scriptSource = readFileSync(localStableScript, 'utf8');
  const runbookSource = readFileSync(runbookPath, 'utf8');

  assert.ok(scriptSource.includes('backend-dev.ps1'));
  assert.ok(scriptSource.includes('mysql-sandbox.ps1'));
  assert.ok(scriptSource.includes('npm test'));
  assert.ok(scriptSource.includes('npm run build'));
  assert.ok(runbookSource.includes('scripts/local-stable.ps1'));
  assert.ok(runbookSource.includes('backend-dev.ps1'));
});

test('repo exposes simple root commands to start and stop the app stack', () => {
  const runCommandPath = resolve(repoRoot, 'run-blog-ai.cmd');
  const stopCommandPath = resolve(repoRoot, 'stop-blog-ai.cmd');
  const devStackScriptPath = resolve(repoRoot, 'scripts/dev-stack.ps1');

  assert.ok(existsSync(runCommandPath), 'Expected run-blog-ai.cmd to exist at the repo root');
  assert.ok(existsSync(stopCommandPath), 'Expected stop-blog-ai.cmd to exist at the repo root');
  assert.ok(existsSync(devStackScriptPath), 'Expected scripts/dev-stack.ps1 to exist');

  const runSource = readFileSync(runCommandPath, 'utf8');
  const stopSource = readFileSync(stopCommandPath, 'utf8');
  const devStackSource = readFileSync(devStackScriptPath, 'utf8');

  assert.ok(runSource.includes('scripts\\dev-stack.ps1'));
  assert.ok(runSource.includes('-Action up'));
  assert.ok(!runSource.includes('start "" /b'));
  assert.ok(runSource.includes('powershell'));
  assert.ok(stopSource.includes('scripts\\dev-stack.ps1'));
  assert.ok(stopSource.includes('-Action down'));
  assert.ok(devStackSource.includes('scripts'))
  assert.ok(devStackSource.includes('mysql-sandbox.ps1'));
  assert.ok(devStackSource.includes('backend-dev.ps1'));
  assert.ok(devStackSource.includes('npm.cmd'));
  assert.ok(devStackSource.includes('"dev"'));
  assert.ok(devStackSource.includes('--strictPort'));
  assert.ok(devStackSource.includes('/health/ready'));
  assert.ok(devStackSource.includes('Stop-Process'));
});

test('backend requirements include cryptography for MySQL auth', () => {
  const requirements = readFromRoot('backend/requirements.txt');

  assert.ok(
    requirements.split(/\r?\n/).includes('cryptography'),
    'Expected backend requirements to include cryptography for MySQL auth support',
  );
});
