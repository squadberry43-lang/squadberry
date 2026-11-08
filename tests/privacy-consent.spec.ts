import { test, expect } from '@playwright/test';

test('accepting analytics consent on a local HTTP origin keeps the page available', async ({ page }) => {
  const pageErrors: string[] = [];
  const visitorIds: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem('doctor-tech-region', JSON.stringify({ country: 'AR', locale: 'es-AR', source: 'manual' }));
    Object.defineProperty(window.crypto, 'randomUUID', { configurable: true, value: undefined });
  });
  await page.route('**/api/public/region', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ country: 'AR' }),
  }));
  await page.route('**/api/public/region-visit', (route) => {
    visitorIds.push(route.request().postDataJSON().visitorId);
    return route.fulfill({ status: 204, body: '' });
  });

  await page.goto('/ar');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Aceptar analítica' }).click();

  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(pageErrors).toEqual([]);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(visitorIds.length).toBeGreaterThan(0);
  expect(visitorIds.every((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))).toBe(true);
});

test('rejecting analytics consent keeps the page available without visitor tracking', async ({ page }) => {
  let visitRequests = 0;
  await page.route('**/api/public/region', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ country: 'AR' }),
  }));
  await page.route('**/api/public/region-visit', (route) => {
    visitRequests += 1;
    return route.fulfill({ status: 204, body: '' });
  });

  await page.goto('/ar');
  await page.getByRole('button', { name: 'Rechazar analítica' }).click();

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(visitRequests).toBe(0);
});
