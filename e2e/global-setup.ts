import { chromium } from '@playwright/test';
import { uniqueEmail, registerUser } from './helpers';
import { mkdirSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const REDIS_PASS = 'debc661de96417f453d8c4691d9a6885';
const REDIS_CONTAINER = 'nest-auth-hybrid-redis-1';

function clearRateLimitKeys() {
  try {
    const keys = execSync(
      `docker exec ${REDIS_CONTAINER} redis-cli -a ${REDIS_PASS} --no-auth-warning KEYS "rl:*:/auth/register"`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] },
    ).trim();
    if (keys) {
      const keyList = keys.split('\n').map(k => `"${k}"`).join(' ');
      execSync(
        `docker exec ${REDIS_CONTAINER} redis-cli -a ${REDIS_PASS} --no-auth-warning DEL ${keyList}`,
        { stdio: 'pipe' },
      );
    }
  } catch {}
}

export default async function globalSetup() {
  clearRateLimitKeys();

  const authDir = path.join(process.cwd(), 'e2e', '.auth');
  mkdirSync(authDir, { recursive: true });

  const browser = await chromium.launch();

  // Main user — shared by all authenticated tests (change-password, notes, protected, login)
  const mainCtx = await browser.newContext({ baseURL: 'http://localhost:3001' });
  const mainPage = await mainCtx.newPage();
  const mainEmail = uniqueEmail();
  await registerUser(mainPage, mainEmail);
  await mainCtx.storageState({ path: path.join(authDir, 'user.json') });
  writeFileSync(path.join(authDir, 'email.txt'), mainEmail);
  await mainCtx.close();

  // Logout user — separate session that can be safely invalidated by the logout test
  const logoutCtx = await browser.newContext({ baseURL: 'http://localhost:3001' });
  const logoutPage = await logoutCtx.newPage();
  await registerUser(logoutPage, uniqueEmail());
  await logoutCtx.storageState({ path: path.join(authDir, 'logout-user.json') });
  await logoutCtx.close();

  await browser.close();
}
