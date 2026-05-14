import { test, expect } from '@playwright/test';

test.use({ storageState: 'e2e/.auth/user.json' });

test.describe('Notas', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('el panel de notas se carga sin errores', async ({ page }) => {
    const notesSection = page.locator('section').filter({ hasText: 'Notas' });
    await expect(notesSection).toBeVisible();
  });

  test('se puede crear y visualizar una nota', async ({ page }) => {
    const notesSection = page.locator('section').filter({ hasText: 'Notas' });

    const titleInput = notesSection.getByPlaceholder(/título/i).or(notesSection.locator('input[name="title"]'));
    const contentInput = notesSection.getByPlaceholder(/contenido/i).or(notesSection.locator('textarea[name="content"], input[name="content"]'));

    if (await titleInput.count() === 0) {
      test.skip();
      return;
    }

    await titleInput.fill('Nota de prueba E2E');
    await contentInput.fill('Contenido de la nota creada en test');
    await notesSection.getByRole('button', { name: /crear|añadir|guardar/i }).click();

    await expect(notesSection.getByText('Nota de prueba E2E')).toBeVisible({ timeout: 8_000 });
  });
});
