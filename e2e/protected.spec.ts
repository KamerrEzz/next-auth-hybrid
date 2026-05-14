import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';

const mainEmail = readFileSync(path.join(process.cwd(), 'e2e', '.auth', 'email.txt'), 'utf-8').trim();

test.describe('Protección de rutas', () => {
  test('/dashboard redirige a /login si no hay sesión', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login\?from=%2Fdashboard/);
  });

  test('/dashboard preserva la ruta en el parámetro from', async ({ page }) => {
    await page.goto('/dashboard');
    const url = new URL(page.url());
    expect(url.searchParams.get('from')).toBe('/dashboard');
  });
});

test.describe('Dashboard — contenido', () => {
  test.use({ storageState: 'e2e/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('el dashboard es accesible con sesión válida', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(mainEmail)).toBeVisible();
  });

  test('muestra la sección de perfil con el email del usuario', async ({ page }) => {
    await expect(page.getByRole('main').getByText('Perfil', { exact: true })).toBeVisible();
    await expect(page.locator('pre')).toBeVisible();
  });

  test('muestra el panel de cambio de contraseña', async ({ page }) => {
    await expect(page.locator('text=Cambiar contraseña')).toBeVisible();
    await expect(page.getByLabel(/contraseña actual/i)).toBeVisible();
    await expect(page.getByLabel(/nueva contraseña/i)).toBeVisible();
  });

  test('muestra el panel de 2FA', async ({ page }) => {
    await expect(page.locator('text=2FA')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Activar', exact: true })).toBeVisible();
  });

  test('muestra el panel de sesiones', async ({ page }) => {
    await expect(page.locator('text=Sesiones')).toBeVisible();
    await expect(page.getByRole('button', { name: /cerrar otras/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /revocar todas/i })).toBeVisible();
  });

  test('muestra el panel de notas', async ({ page }) => {
    await expect(page.locator('text=Notas')).toBeVisible();
  });
});
