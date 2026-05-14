import { test, expect } from '@playwright/test';
import { TEST_PASSWORD, registerUser, loginUser } from './helpers';
import { readFileSync } from 'fs';
import path from 'path';

const mainEmail = readFileSync(path.join(process.cwd(), 'e2e', '.auth', 'email.txt'), 'utf-8').trim();

test.describe('Páginas públicas', () => {
  test('la página de login se carga correctamente', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('[data-slot="card-title"]')).toContainText(/iniciar sesión/i);
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /iniciar sesión/i })).toBeVisible();
  });

  test('la página de registro se carga correctamente', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('[data-slot="card-title"]')).toContainText(/crear cuenta/i);
    await expect(page.getByLabel(/nombre/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /crear cuenta/i })).toBeVisible();
  });

  test('login con credenciales inválidas muestra error genérico', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('noexiste@example.com');
    await page.getByLabel(/contraseña/i).fill('Wrongpass1!');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await expect(page.locator('[data-slot="alert"]')).toContainText(/credenciales inválidas/i);
    await expect(page).toHaveURL(/\/login/);
  });

  test('el mensaje de error no diferencia email no encontrado de contraseña incorrecta', async ({ page }) => {
    // Wrong password on an existing email
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(mainEmail);
    await page.getByLabel(/contraseña/i).fill('WrongPass99!');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await page.locator('[data-slot="alert"]').waitFor();
    const alertText = await page.locator('[data-slot="alert"]').textContent();

    // Wrong email entirely
    await page.getByLabel(/email/i).fill('notregistered@example.com');
    await page.getByLabel(/contraseña/i).fill('WrongPass99!');
    await page.getByRole('button', { name: /iniciar sesión/i }).click();
    await page.locator('[data-slot="alert"]').waitFor();
    const alertText2 = await page.locator('[data-slot="alert"]').textContent();

    // Both messages must be identical (no user enumeration)
    expect(alertText).toBe(alertText2);
  });
});

test.describe('Registro', () => {
  test('registro exitoso redirige al dashboard', async ({ page }) => {
    const email = `e2e_new_${Date.now()}@example.com`;
    await registerUser(page, email);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('registro con email ya registrado muestra error', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel(/nombre/i).fill('Duplicate');
    await page.getByLabel(/email/i).fill(mainEmail);
    await page.getByLabel(/contraseña/i).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: /crear cuenta/i }).click();
    await expect(page.locator('[data-slot="alert"]')).toBeVisible();
    await expect(page).toHaveURL(/\/register/);
  });
});

test.describe('Login', () => {
  test('login exitoso redirige al dashboard', async ({ page }) => {
    await loginUser(page, mainEmail);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('los botones OAuth están visibles en la pantalla de login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('link', { name: /google/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /discord/i })).toBeVisible();
  });
});

test.describe('Logout', () => {
  test.use({ storageState: 'e2e/.auth/logout-user.json' });

  test('logout redirige a login y protege el dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('button', { name: /cerrar sesión/i }).click();
    await page.waitForURL(/\/login/, { timeout: 10_000 });

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
