import { expect, test } from '@playwright/test';

const ticketId = '11111111-1111-4111-8111-111111111111';
const sessionId = '22222222-2222-4222-8222-222222222222';

test('client requests and authorizes remote support on a phone without layout overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem('doctor-tech-session', 'active');
    localStorage.setItem('doctor-tech-region', JSON.stringify({ country: 'AR', locale: 'es-AR', source: 'manual' }));
    localStorage.setItem('doctor-tech-analytics-consent', 'rejected');
  });
  const user = { id: '33333333-3333-4333-8333-333333333333', email: 'client@example.test', full_name: 'Cliente', role_id: 'role_particular', role_name: 'particular', country: 'AR', locale: 'es-AR', client_id: '44444444-4444-4444-8444-444444444444', is_active: true };
  const ticket = { id: ticketId, title: 'Equipo lento', description: 'Necesita revisión', status: 'open', created_at: new Date().toISOString() };
  let sessions: any[] = [];
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    let data: unknown = {};
    if (path === '/api/auth/refresh') data = { user, accessToken: 'test-token' };
    if (path === `/api/tickets/${ticketId}`) data = { ticket };
    if (path === `/api/tickets/${ticketId}/remote-support`) {
      if (route.request().method() === 'POST') {
        sessions = [{ id: sessionId, ticket_id: ticketId, status: 'requested', created_at: new Date().toISOString() }];
        data = { session: sessions[0] };
      } else data = { sessions };
    }
    if (path === `/api/tickets/${ticketId}/remote-support/${sessionId}/consent`) {
      sessions = [{ ...sessions[0], status: 'consented' }];
      data = { session: sessions[0] };
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
  });
  await page.goto(`/tickets/${ticketId}`);
  await expect(page.getByRole('heading', { name: 'Soporte remoto' })).toBeVisible();
  await page.getByRole('button', { name: 'Solicitar soporte' }).click();
  await expect(page.getByRole('status')).toHaveText('Esperando autorización');
  await page.getByRole('button', { name: 'Autorizar esta sesión' }).click();
  await expect(page.getByRole('status')).toHaveText('Autorizada; esperando al técnico');
  await expect(page.getByRole('link', { name: 'Descargar RustDesk' })).toHaveAttribute('href', 'https://rustdesk.com/download');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('assigned technician records the start and end on desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => {
    localStorage.setItem('doctor-tech-session', 'active');
    localStorage.setItem('doctor-tech-region', JSON.stringify({ country: 'AR', locale: 'es-AR', source: 'manual' }));
    localStorage.setItem('doctor-tech-analytics-consent', 'rejected');
  });
  const user = { id: '44444444-4444-4444-8444-444444444444', email: 'tech@example.test', full_name: 'Técnico', role_id: 'role_technician', role_name: 'technician', country: 'AR', locale: 'es-AR', client_id: null, is_active: true };
  const ticket = { id: ticketId, title: 'Equipo lento', description: 'Necesita revisión', status: 'open', created_at: new Date().toISOString() };
  let session = { id: sessionId, ticket_id: ticketId, status: 'consented', created_at: new Date().toISOString() };
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    let data: unknown = {};
    if (path === '/api/auth/refresh') data = { user, accessToken: 'test-token' };
    if (path === `/api/tickets/${ticketId}`) data = { ticket };
    if (path === `/api/tickets/${ticketId}/remote-support`) data = { sessions: [session] };
    if (path === `/api/tickets/${ticketId}/remote-support/${sessionId}/start`) {
      session = { ...session, status: 'active' }; data = { session };
    }
    if (path === `/api/tickets/${ticketId}/remote-support/${sessionId}/finish`) {
      session = { ...session, status: 'completed' }; data = { session };
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
  });
  await page.goto(`/tickets/${ticketId}`);
  await expect(page.getByRole('heading', { name: 'Soporte remoto' })).toBeVisible();
  await page.getByRole('button', { name: 'Registrar inicio' }).click();
  await expect(page.getByRole('status')).toHaveText('Sesión en curso');
  await page.getByRole('button', { name: 'Registrar fin' }).click();
  await expect(page.getByRole('status')).toHaveText('Finalizada');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);
});
