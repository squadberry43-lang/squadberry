import { test, expect } from '@playwright/test';

const user = {
  id: '11111111-1111-4111-8111-111111111111',
  email: 'admin@example.test',
  full_name: 'Administración',
  role_id: 'role_admin',
  role_name: 'admin',
  country: 'AR',
  locale: 'es-AR',
  client_id: null,
  is_active: true,
};

const campaign = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Búsqueda global',
  countries: ['Argentina', 'Chile', 'España', 'Países Bajos', 'Estados Unidos'],
  status: 'running',
  cycle: 1,
  total_tasks: 120000,
  completed_tasks: 21000,
  failed_tasks: 0,
  scanned_count: 150000,
  found_count: 400000,
  new_count: 37000,
  updated_count: 14000,
  next_run_at: null,
  last_error: null,
};

const progress = {
  phase: 'processing',
  temperature_c: null,
  elapsed_seconds: 120,
  remaining_seconds: 200000,
  remaining_count: 900000,
  rate_per_hour: 5000,
  eta_basis: 'last_10_minutes',
  eta_scope: 'partial',
  percent: null,
  scanned_count: 150000,
  processed_count: 140000,
  last_activity_at: new Date().toISOString(),
  countries: ['Argentina', 'Chile', 'España', 'Países Bajos', 'Estados Unidos'].map((country) => ({
    country, phase: 'processing', scanned_count: 1000, processed_count: 900,
    total_tasks: 1000, completed_tasks: 900, failed_tasks: 0, last_activity_at: new Date().toISOString(),
  })),
};

const metrics = {
  total_prospects: 436281,
  last_10_minutes: { reviewed: 859, new: 858, updated: 1, unchanged: 0, per_hour: 5154 },
  last_hour: { reviewed: 5892, new: 5768, updated: 124, unchanged: 0, per_hour: 5892 },
  last_day: { reviewed: 33068, new: 32862, updated: 206, unchanged: 0, per_hour: 1378 },
  global_search: {
    last_10_minutes: { reviewed: 859, per_hour: 5154 },
    last_hour: { reviewed: 5892, per_hour: 5892 },
    last_day: { reviewed: 33068, per_hour: 1378 },
  },
  workers: [{ worker_name: 'Mac', reviewed: 33068 }],
  active_workers: [],
  stored_additions: { last_10_minutes: 858, last_hour: 5768, last_day: 32862 },
  known_backlog: { businesses_remaining: 970734, tasks_pending: 95909, tasks_running: 0, discovering: true },
};

const currentTask = {
  campaign_id: campaign.id,
  campaign_name: campaign.name,
  cycle: 1,
  task_id: '33333333-3333-4333-8333-333333333333',
  stage: 'scan',
  task_status: 'running',
  country: 'Países Bajos',
  province: 'Friesland',
  city: 'Leeuwarden',
  zone: null,
  category: 'Veterinarios',
  processed_count: 115625,
  new_count: 0,
  updated_count: 0,
  task_updated_at: new Date().toISOString(),
};

test('prospect activity and install guidance stay readable without covering page content', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem('doctor-tech-session', 'active');
    localStorage.setItem('doctor-tech-analytics-consent', 'rejected');
    Object.defineProperty(navigator, 'userAgent', { configurable: true, value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15' });
  });
  await page.route('**/api/**', async (route) => {
    const { pathname } = new URL(route.request().url());
    let data: unknown = {};
    if (pathname === '/api/auth/refresh') data = { user, accessToken: 'test-token' };
    if (pathname === '/api/prospects') data = { prospects: [], total: 0, page: 1, limit: 50, pages: 0 };
    if (pathname === '/api/prospects/catalog') data = { countries: [], categories: [], locations: [] };
    if (pathname === '/api/prospects/export/status') data = { exists: true, last_run: null };
    if (pathname === '/api/prospects/jobs') data = { jobs: [] };
    if (pathname === '/api/prospects/categories/manage') data = { categories: [] };
    if (pathname === '/api/prospects/campaigns') data = { campaigns: [campaign] };
    if (pathname.endsWith('/status') && pathname.includes('/prospects/campaigns/')) data = { progress, latest_task: null };
    if (pathname === '/api/prospects/scrape-metrics') data = { metrics, generated_at: new Date().toISOString() };
    if (pathname === '/api/prospects/worker/status') data = {
      worker: { owner: 'mac', requestedOwner: 'mac', status: 'working', connected: true, session_started_at: new Date().toISOString(), checked_at: new Date().toISOString() },
      current_task: currentTask,
      progress: { total: 120000, completed: 21000, pending: 95909, failed: 0, processed: 140000, new_count: 37000, updated_count: 14000 },
    };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
  });

  await page.goto('/buscador-clientes');
  await expect(page.getByRole('heading', { name: 'Actividad del buscador' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Últimos 10 minutos' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Última hora' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Últimas 24 horas' })).toBeVisible();
  await expect(page.getByText(/115\.625 negocios detectados para revisar/)).toBeVisible();
  await expect(page.getByTestId('live-scrape-progress')).toContainText('115.625');
  await expect(page.getByTestId('live-scrape-progress')).toContainText('negocios detectados para revisar');
  await expect(page.getByText(/Campaña Búsqueda global: 21\.000 de 120\.000 tareas/)).toBeVisible();

  const installNotice = page.getByRole('complementary', { name: 'Llevá Doctor Tech contigo' });
  await expect(installNotice).toBeAttached();
  await expect.poll(() => installNotice.evaluate((element) => getComputedStyle(element).position)).not.toBe('fixed');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const mobileNav = page.locator('nav.mobile-nav');
  await expect(mobileNav.locator('a')).toHaveCount(5);
  await expect(mobileNav.getByRole('link', { name: 'Tickets' })).toHaveCount(1);
  const navBounds = await mobileNav.locator('a').evaluateAll((links) => links.map((link) => {
    const rect = link.getBoundingClientRect();
    return { left: rect.left, right: rect.right };
  }));
  expect(navBounds.every(({ left, right }) => left >= 0 && right <= 390)).toBe(true);
  const contentBottom = await page.locator('main').evaluate((element) => element.getBoundingClientRect().bottom + window.scrollY);
  const noticeTop = await installNotice.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
  expect(noticeTop).toBeGreaterThanOrEqual(contentBottom);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: '/tmp/doctor-tech-prospects-mobile.png' });

  await page.setViewportSize({ width: 768, height: 1024 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect.poll(() => page.getByTestId('scrape-window-grid').evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(1);
  await page.screenshot({ path: '/tmp/doctor-tech-prospects-tablet.png' });

  await page.setViewportSize({ width: 1440, height: 1000 });
  const periodGrid = page.getByTestId('scrape-window-grid');
  await expect.poll(() => periodGrid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length)).toBe(3);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: '/tmp/doctor-tech-prospects-desktop.png' });
});
