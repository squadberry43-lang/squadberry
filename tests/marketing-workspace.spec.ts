import { test, expect } from '@playwright/test';

test('marketing filters the full audience and keeps form errors inside the modal on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem('doctor-tech-session', 'active');
    localStorage.setItem('doctor-tech-region', JSON.stringify({ country: 'AR', locale: 'es-AR', source: 'manual' }));
    localStorage.setItem('doctor-tech-analytics-consent', 'rejected');
  });
  const searches: string[] = [];
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const user = { id: '11111111-1111-4111-8111-111111111111', email: 'marketing@example.test', full_name: 'Marketing', role_id: 'role_marketing', role_name: 'marketing', country: 'AR', locale: 'es-AR', client_id: null, is_active: true };
    let data: unknown = {};
    if (url.pathname === '/api/auth/refresh') data = { user, accessToken: 'test-token' };
    if (url.pathname === '/api/marketing/overview') data = { contacts: { active: 51, total: 51 }, drafts: 2, delivery: { provider: 'BillionMail', ready: false, reason: 'Envíos desactivados' } };
    if (url.pathname === '/api/crm/analytics') data = {};
    if (url.pathname === '/api/marketing/campaigns' && route.request().method() === 'GET') data = { campaigns: [], total: 51, page: Number(url.searchParams.get('page')), limit: 25 };
    if (url.pathname === '/api/marketing/contacts' && route.request().method() === 'GET') {
      searches.push(url.searchParams.get('search') || '');
      data = { contacts: [{ id: '22222222-2222-4222-8222-222222222222', email: 'klant@example.test', name: 'Klant', country: 'NL', locale: 'nl-NL', consent_source: 'Formulario', consent_at: '2026-09-01T00:00:00.000Z', unsubscribed_at: null, created_at: '2026-09-01T00:00:00.000Z' }], total: 1, page: 1, limit: 25 };
    }
    if (url.pathname === '/api/marketing/campaigns' && route.request().method() === 'POST') {
      await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'Borrador inválido' }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
  });
  await page.goto('/marketing');
  await expect(page.getByRole('heading', { name: 'Marketing' })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('No se pudieron cargar las métricas.');
  await expect(page.getByText('51 resultados')).toBeVisible();
  await page.getByRole('tab', { name: 'Audiencia' }).click();
  await page.getByPlaceholder('Buscar contactos').fill('klant');
  await expect.poll(() => searches.at(-1)).toBe('klant');
  await expect(page.getByText('nl-NL')).toBeVisible();
  await page.getByRole('tab', { name: 'Campañas' }).click();
  await page.getByRole('button', { name: 'Nueva campaña' }).click();
  const dialog = page.getByRole('dialog', { name: 'Nueva campaña' });
  await dialog.getByLabel('Nombre').fill('Test');
  await dialog.getByLabel('País y destinatarios').selectOption('NL');
  await expect(dialog.getByText(/neerlandés/)).toBeVisible();
  await dialog.getByRole('button', { name: 'Guardar borrador' }).click();
  await expect(dialog.getByRole('alert')).toHaveText('Borrador inválido');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});
