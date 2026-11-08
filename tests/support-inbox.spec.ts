import { expect, test } from '@playwright/test';

const ticketId = '11111111-1111-4111-8111-111111111111';
const now = new Date().toISOString();

test('admin sees recent support cases and unread indicator on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    localStorage.setItem('doctor-tech-session', 'active');
    localStorage.setItem('doctor-tech-region', JSON.stringify({ country: 'AR', locale: 'es-AR', source: 'manual' }));
    localStorage.setItem('doctor-tech-analytics-consent', 'rejected');
  });
  const user = { id: '22222222-2222-4222-8222-222222222222', email: 'admin@example.test', full_name: 'Admin', role_id: 'role_admin', role_name: 'admin', country: 'AR', locale: 'es-AR', is_active: true };
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = {};
    if (path === '/api/auth/refresh') data = { user, accessToken: 'test-token' };
    if (path === '/api/tickets/inbox') data = { tickets: [{ id: ticketId, title: 'Equipo sin red', client_name: 'Ana', technician_name: 'Luis', last_message: 'No tengo conexión', last_message_at: now, unread_count: 1, unseen_ticket: true, updated_at: now, status: 'open' }] };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
  });
  await page.goto('/mensajes');
  await expect(page.getByRole('heading', { name: 'Bandeja de soporte' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Equipo sin red/ })).toContainText('1 sin leer');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);
  await page.screenshot({ path: 'test-results/support-inbox-desktop.png', fullPage: true });
});

test('customer sends a web case message on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem('doctor-tech-session', 'active');
    localStorage.setItem('doctor-tech-region', JSON.stringify({ country: 'AR', locale: 'es-AR', source: 'manual' }));
    localStorage.setItem('doctor-tech-analytics-consent', 'rejected');
  });
  const user = { id: '33333333-3333-4333-8333-333333333333', email: 'ana@example.test', full_name: 'Ana', role_id: 'role_particular', role_name: 'particular', country: 'AR', locale: 'es-AR', client_id: '44444444-4444-4444-8444-444444444444', is_active: true };
  const messages: any[] = [];
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = {};
    if (path === '/api/auth/refresh') data = { user, accessToken: 'test-token' };
    if (path === `/api/tickets/${ticketId}`) data = { ticket: { id: ticketId, title: 'Equipo sin red', description: 'Sin conexión', status: 'open', created_at: now, messages } };
    if (path === `/api/tickets/${ticketId}/messages` && route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      messages.push({ id: '55555555-5555-4555-8555-555555555555', ticket_id: ticketId, sender_id: user.id, sender_type: 'client', message: body.message, is_internal: false, created_at: now });
      data = { message: messages[0] };
    }
    if (path === `/api/tickets/${ticketId}/read`) data = { recorded: true };
    if (path === `/api/tickets/${ticketId}/remote-support`) data = { sessions: [] };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
  });
  await page.goto(`/tickets/${ticketId}`);
  await expect(page.getByRole('heading', { name: 'Mensajes del caso' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Escribí un mensaje' }).fill('Necesito ayuda con la red');
  await page.getByRole('button', { name: 'Enviar', exact: true }).click();
  await expect(page.getByText('Necesito ayuda con la red')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: 'test-results/support-thread-mobile.png', fullPage: true });
});
