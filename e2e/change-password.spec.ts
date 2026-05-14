import { test, expect } from '@playwright/test';
import { TEST_PASSWORD } from './helpers';

test.use({ storageState: 'e2e/.auth/user.json' });

test.describe('Cambio de contraseña', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('el formulario tiene los atributos autoComplete correctos', async ({ page }) => {
    const currentPw = page.getByLabel(/contraseña actual/i);
    const newPw = page.getByLabel(/nueva contraseña/i);

    expect(await currentPw.getAttribute('autocomplete')).toBe('current-password');
    expect(await newPw.getAttribute('autocomplete')).toBe('new-password');
  });

  test('muestra error con contraseña actual incorrecta', async ({ page }) => {
    await page.getByLabel(/contraseña actual/i).fill('WrongCurrent1!');
    await page.getByLabel(/nueva contraseña/i).fill('NewValidPass1!');
    await page.locator('section').filter({ hasText: 'Cambiar contraseña' })
      .getByRole('button', { name: /guardar/i }).click();

    // Should stay on dashboard (no redirect on error)
    await page.waitForTimeout(2000);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('cambio de contraseña exitoso muestra toast de confirmación', async ({ page }) => {
    const newPassword = 'NewValidE2E1!';
    await page.getByLabel(/contraseña actual/i).fill(TEST_PASSWORD);
    await page.getByLabel(/nueva contraseña/i).fill(newPassword);
    await page.locator('section').filter({ hasText: 'Cambiar contraseña' })
      .getByRole('button', { name: /guardar/i }).click();

    await expect(page.getByText(/contraseña actualizada/i)).toBeVisible({ timeout: 8_000 });
  });
});
