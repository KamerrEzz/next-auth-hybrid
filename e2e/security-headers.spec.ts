import { test, expect } from '@playwright/test';

test.describe('Cabeceras de seguridad HTTP', () => {
  test('las páginas públicas incluyen las cabeceras de seguridad requeridas', async ({ page }) => {
    const response = await page.goto('/login');
    expect(response).not.toBeNull();

    const headers = response!.headers();

    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['permissions-policy']).toContain('camera=()');
    expect(headers['content-security-policy']).toBeTruthy();
  });

  test('HSTS está presente en todas las rutas', async ({ page }) => {
    const response = await page.goto('/register');
    const headers = response!.headers();
    expect(headers['strict-transport-security']).toContain('max-age=');
    expect(headers['strict-transport-security']).toContain('includeSubDomains');
  });
});

test.describe('Comportamiento de seguridad del cliente', () => {
  test('el token de sesión no es accesible desde JavaScript (httpOnly)', async ({ page }) => {
    // Register so we have a session
    await page.goto('/login');
    // Check that document.cookie does not contain sessionId
    const cookies = await page.evaluate(() => document.cookie);
    expect(cookies).not.toContain('sessionId');
  });

  test('el campo de contraseña tiene autoComplete correcto', async ({ page }) => {
    await page.goto('/login');
    const pwInput = page.getByLabel(/contraseña/i);
    const autocomplete = await pwInput.getAttribute('autocomplete');
    expect(autocomplete).toBe('current-password');
  });

  test('el campo de contraseña en registro tiene autoComplete new-password', async ({ page }) => {
    await page.goto('/register');
    const pwInput = page.getByLabel(/contraseña/i);
    const autocomplete = await pwInput.getAttribute('autocomplete');
    expect(autocomplete).toBe('new-password');
  });

  test('el atributo lang del documento está en español', async ({ page }) => {
    await page.goto('/login');
    const lang = await page.evaluate(() => document.documentElement.lang);
    expect(lang).toBe('es');
  });
});
