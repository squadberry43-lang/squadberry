import { test, expect } from '@playwright/test';

test('admin sees private DataQA status and refreshes it periodically without prospect details', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.clock.install();
  await page.addInitScript(() => localStorage.setItem('doctor-tech-session', 'active'));
  let statusRequests = 0;
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const user = { id: '11111111-1111-4111-8111-111111111111', email: 'admin@example.test', full_name: 'Administrador', role_id: 'role_admin', role_name: 'admin', country: 'AR', locale: 'es-AR', is_active: true };
    let data: unknown = {};
    if (path === '/api/auth/refresh') data = { user, accessToken: 'test-token' };
    if (path === '/api/dashboard') data = { clients: { total: 2 }, tickets: { open: 0, in_progress: 0, closed: 0, total: 0 }, reservations_today: 0, invoices_pending: 0 };
    if (path === '/api/dashboard/install-metrics') data = { total: 0, last_30_days: 0, by_device: [], by_country: [], daily: [] };
    if (path === '/api/dashboard/recent') data = { clients: [], tickets: [], enterprises: [] };
    if (path === '/api/data-quality/status') {
      statusRequests += 1;
      data = { status: 'running', processed_rows: 25000, total_rows: 0, candidate_pairs: 12, heartbeat_at: '2026-10-05T02:00:00Z' };
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
  });

  await page.goto('/admin');
  await page.getByRole('button', { name: 'Rechazar analítica' }).click();
  await expect(page.getByRole('heading', { name: 'Calidad de datos' })).toBeVisible();
  await expect(page.getByText('En curso', { exact: true })).toBeVisible();
  await expect(page.getByText('25.000')).toBeVisible();
  const initialRequests = statusRequests;
  expect(initialRequests).toBeGreaterThanOrEqual(1);
  await page.clock.fastForward(15000);
  await expect.poll(() => statusRequests).toBeGreaterThan(initialRequests);
  await expect(page.getByText('Negocio privado de prueba')).toHaveCount(0);
});

test('marketing role does not receive the DataQA dashboard status', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('doctor-tech-session', 'active'));
  let statusRequests = 0;
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const user = { id: '11111111-1111-4111-8111-111111111111', email: 'marketing@example.test', full_name: 'Marketing', role_id: 'role_marketing', role_name: 'marketing', country: 'AR', locale: 'es-AR', is_active: true };
    if (path === '/api/data-quality/status') statusRequests += 1;
    const data = path === '/api/auth/refresh' ? { user, accessToken: 'test-token' } : {};
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
  });

  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Calidad de datos' })).toHaveCount(0);
  expect(statusRequests).toBe(0);
});
