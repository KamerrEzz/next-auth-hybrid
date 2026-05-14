import { Page } from '@playwright/test';

export function uniqueEmail() {
  return `e2e_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@example.com`;
}

export const TEST_PASSWORD = 'E2eTest1234!';

export async function registerUser(page: Page, email: string, password = TEST_PASSWORD) {
  await page.goto('/register');
  await page.getByLabel(/nombre/i).fill('E2E User');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/contraseña/i).fill(password);
  await page.getByRole('button', { name: /crear cuenta/i }).click();
  await page.waitForURL('**/dashboard**', { timeout: 15_000 });
}

export async function loginUser(page: Page, email: string, password = TEST_PASSWORD) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/contraseña/i).fill(password);
  await page.getByRole('button', { name: /iniciar sesión/i }).click();
  await page.waitForURL('**/dashboard**', { timeout: 15_000 });
}
