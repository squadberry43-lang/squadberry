import { test, expect, type Page } from '@playwright/test';

async function mockSession(page: Page, role: string, locale = 'es-AR') {
  const tasks: Array<Record<string, unknown>> = [];
  const country = locale === 'nl-NL' ? 'NL' : locale === 'en-US' ? 'US' : 'AR';
  await page.addInitScript(({ locale, country }) => {
    localStorage.setItem('doctor-tech-session', 'active');
    localStorage.setItem('doctor-tech-region', JSON.stringify({ locale, country, source: 'manual' }));
  }, { locale, country });
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const user = { id: '11111111-1111-4111-8111-111111111111', email: 'staff@example.test', full_name: 'Persona de prueba', role_name: role, role_id: `role_${role}`, client_id: null, country, locale, is_active: true };
    let data: unknown = {};
    if (path === '/api/auth/refresh') data = { user, accessToken: 'test-token' };
    if (path === '/api/staff-tasks' && route.request().method() === 'GET') data = { tasks };
    if (path === '/api/staff-tasks' && route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      const task = { id: '22222222-2222-4222-8222-222222222222', title: body.title, description: body.description, progress_notes: body.progress_notes, assigned_to: body.assigned_to, assignee_name: user.full_name, status: 'pending', priority: body.priority, starts_at: body.starts_at, due_at: body.due_at, duration_minutes: body.duration_minutes, ticket_id: null, visit_id: null };
      tasks.push(task);
      data = { task };
    }
    if (path.startsWith('/api/staff-tasks/') && route.request().method() === 'PATCH') {
      const task = tasks.find((item) => item.id === path.split('/').pop());
      Object.assign(task || {}, route.request().postDataJSON());
      data = { task };
    }
    if (path === '/api/staff-tasks/assignees') data = { assignees: [user] };
    if (path === '/api/staff-calendar') data = { events: [] };
    if (path === '/api/tickets/inbox') data = { tickets: [] };
    if (path.endsWith('/remote-support') && route.request().method() === 'GET') data = { sessions: [] };
    if (path.endsWith('/read') && route.request().method() === 'POST') data = { recorded: true };
    if (/^\/api\/tickets\/[0-9a-f-]{36}$/.test(path) && route.request().method() === 'GET') data = { ticket: { id: path.split('/').pop(), title: 'Equipo sin conexión', client_id: '44444444-4444-4444-8444-444444444444', status: 'open', priority: 'normal', category: 'network', description: 'No conecta', created_at: new Date().toISOString(), messages: [] } };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
  });
  return tasks;
}

test('staff member sees own agenda and an empty state', async ({ page }) => {
  await mockSession(page, 'technician');
  await page.goto('/agenda');
  await expect(page.getByRole('heading', { name: 'Mi agenda' })).toBeVisible();
  await expect(page.getByText('No hay trabajos programados')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Equipo' })).toHaveCount(0);
});

for (const { locale, title, view, group } of [
  { locale: 'en-US', title: 'My schedule', view: 'Calendar', group: 'Work view' },
  { locale: 'nl-NL', title: 'Mijn agenda', view: 'Agenda', group: 'Werkweergave' },
]) {
  test(`staff agenda uses ${locale} operations translations`, async ({ page }) => {
    await mockSession(page, 'technician', locale);
    await page.goto('/agenda');
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.getByRole('group', { name: group })).toBeVisible();
    await expect(page.getByRole('button', { name: view })).toBeVisible();
  });
}

test('admin can open team board', async ({ page }) => {
  await mockSession(page, 'admin');
  await page.goto('/equipo');
  await expect(page.getByRole('heading', { name: 'Equipo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nueva tarea' })).toBeVisible();
  await expect(page.getByText('Pendiente', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Rechazar analítica' }).click();
  await page.getByRole('button', { name: 'Nueva tarea' }).click();
  await page.getByRole('textbox', { name: 'Título' }).fill('Preparar diagnóstico');
  await page.getByRole('button', { name: 'Guardar' }).click();
  await expect(page.getByRole('button', { name: 'Preparar diagnóstico' })).toBeVisible();
  await page.screenshot({ path: 'test-results/staff-board-desktop.png', fullPage: true });
  await page.getByRole('combobox', { name: 'Estado de Preparar diagnóstico' }).selectOption('in_progress');
  await expect(page.getByRole('region', { name: 'En curso' }).getByRole('button', { name: 'Preparar diagnóstico' })).toBeVisible();
});

test('admin reaches daily work from the desktop header without opening the mobile menu', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 900 });
  await mockSession(page, 'admin');
  await page.goto('/repairs');
  const header = page.locator('header');
  await expect(header.getByRole('link', { name: 'Reparaciones' })).toBeVisible();
  await expect(header.getByRole('link', { name: 'Mi agenda' })).toBeVisible();
  await expect(header.getByRole('link', { name: 'Prospectos' })).toBeVisible();
  await expect(header.getByRole('button', { name: 'Más opciones' })).toBeVisible();
  await header.getByRole('button', { name: 'Más opciones' }).click();
  await expect(header.getByRole('link', { name: 'Inventario' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(header.getByRole('link', { name: 'Inventario' })).toHaveCount(0);
  await expect(header.getByRole('button', { name: 'Más opciones' })).toBeFocused();
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(header.getByRole('link', { name: 'Reparaciones' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1280);
});

test('agenda remains usable on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockSession(page, 'technician');
  await page.goto('/agenda');
  await expect(page.getByRole('heading', { name: 'Mi agenda' })).toBeVisible();
  await page.getByRole('button', { name: 'Rechazar analítica' }).click();
  await expect(page.getByRole('button', { name: 'Día', exact: true })).toHaveClass(/rbc-active/);
  await page.screenshot({ path: 'test-results/staff-agenda-mobile.png', fullPage: true });
});

test('client cannot open the internal agenda', async ({ page }) => {
  await mockSession(page, 'particular');
  await page.goto('/agenda');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Mi agenda' })).toHaveCount(0);
});

test('coordinator can create linked work from an existing ticket', async ({ page }) => {
  await mockSession(page, 'admin');
  const ticketId = '33333333-3333-4333-8333-333333333333';
  await page.goto(`/tickets/${ticketId}`);
  await expect(page.getByRole('heading', { name: /Ticket #/ })).toBeVisible();
  await page.getByRole('link', { name: 'Crear tarea' }).click();
  await expect(page).toHaveURL(new RegExp(`/equipo\\?ticket=${ticketId}$`));
  await expect(page.getByRole('dialog', { name: 'Nueva tarea' })).toBeVisible();
});
