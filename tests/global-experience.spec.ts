import { test, expect, type Page } from '@playwright/test';
import { PNG } from 'pngjs';

async function clientSession(page: Page) {
  await page.addInitScript(() => localStorage.setItem('doctor-tech-session', 'active'));
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const user = { id: '11111111-1111-4111-8111-111111111111', email: 'klant@example.test', full_name: 'Test Klant', role_id: 'role_particular', role_name: 'particular', client_id: '22222222-2222-4222-8222-222222222222', country: 'NL', locale: 'nl-NL', is_active: true };
    let data: unknown = {};
    if (url.pathname === '/api/auth/refresh') data = { user, accessToken: 'test-token' };
    if (url.pathname === '/api/auth/settings') data = { settings: { country: 'NL', locale: 'nl-NL', email_notifications: true } };
    if (url.pathname === '/api/tickets') data = { tickets: [], total: 0, page: 1, limit: 20 };
    if (url.pathname === '/api/public/region') data = { country: 'NL' };
    if (url.pathname === '/api/public/locations') {
      const level = url.searchParams.get('level');
      data = { locations: level === 'provinces' ? [{ id: '1', name: 'Noord-Holland' }] : level === 'cities' ? [{ id: '2', name: 'Amsterdam' }] : [] };
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data, country: url.pathname === '/api/public/region' ? 'NL' : undefined }) });
  });
}

test('a Dutch account stays Dutch even with an English browser', async ({ page }) => {
  await clientSession(page);
  await page.goto('/tickets');
  await expect(page.getByRole('heading', { name: 'Mijn verzoeken' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'nl-NL');
  await page.goto('/tickets/new');
  await expect(page.getByRole('heading', { name: 'Vertel wat er is gebeurd' })).toBeVisible();
  await expect(page.getByText('Er wordt nu geen afspraak gemaakt', { exact: false })).toBeVisible();
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Mijn account' })).toBeVisible();
  await expect(page.getByText('Land en taal')).toBeVisible();
  for (const path of ['/inventory', '/repairs', '/visits']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/$/);
  }
});

test('Dutch registration sends the selected country to the API', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('doctor-tech-region', JSON.stringify({ country: 'NL', locale: 'nl-NL', source: 'manual' })));
  let submittedCountry = '';
  let submittedLocation = '';
  await page.route('**/api/public/locations**', async (route) => {
    const level = new URL(route.request().url()).searchParams.get('level');
    const locations = level === 'provinces' ? [{ id: '1', name: 'Noord-Holland' }] : [{ id: '2', name: 'Amsterdam' }];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { locations } }) });
  });
  await page.route('**/api/auth/register', async (route) => {
    const payload = route.request().postDataJSON();
    submittedCountry = payload.country;
    submittedLocation = `${payload.province}/${payload.city}`;
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) });
  });
  await page.goto('/register');
  await page.getByRole('button', { name: 'Analyses weigeren' }).click();
  await expect(page.getByRole('heading', { name: 'Maak je account aan' })).toBeVisible();
  await expect(page.getByLabel('Land waar je hulp nodig hebt')).toHaveValue('NL');
  await page.getByLabel('Volledige naam').fill('Test Klant');
  await page.getByLabel('E-mailadres').fill('klant@example.test');
  await expect(page.getByLabel('Documentnummer')).toHaveCount(0);
  await page.getByLabel('Provincie').selectOption('1');
  await page.locator('#registration-city').selectOption('2');
  await page.getByLabel('Wachtwoord', { exact: true }).fill('TestPassword2026!');
  await page.getByLabel('Bevestig wachtwoord').fill('TestPassword2026!');
  await page.getByRole('button', { name: 'Account aanmaken' }).click();
  await expect.poll(() => submittedCountry).toBe('NL');
  expect(submittedLocation).toBe('Noord-Holland/Amsterdam');
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`public photographic guide responds to scroll and selection at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/nl');
    await page.getByRole('button', { name: 'Analyses weigeren' }).click();
    const section = page.locator('section[aria-labelledby="experience-title"]');
    await section.scrollIntoViewIfNeeded();
    await expect(section.getByRole('heading', { name: /belangrijkste/ })).toBeVisible();
    await expect(section.getByRole('button', { name: 'Telefoon of tablet' })).toBeVisible();
    await expect(section.locator('canvas')).toHaveCount(0);
    await expect(section.locator('img[data-mode="computers"]')).toHaveAttribute('src', /reparo-computer-care\.jpg/);
    await expect(section).toHaveAttribute('data-scroll-motion', 'ready');
    const initialScale = await section.evaluate((element) => element.style.getPropertyValue('--photo-scale'));
    await page.evaluate(() => window.scrollBy(0, 180));
    await expect.poll(() => section.evaluate((element) => element.style.getPropertyValue('--photo-scale'))).not.toBe(initialScale);
    await section.getByRole('button', { name: 'Telefoon of tablet' }).click();
    await expect(section.getByRole('button', { name: 'Telefoon of tablet' })).toHaveAttribute('aria-pressed', 'true');
    await expect(section.locator('img[data-mode="personal"]')).toHaveClass(/is-active/);
    await expect(section.locator('img[data-mode="personal"]')).toHaveJSProperty('complete', true);
    await page.waitForTimeout(650);
    const screenshot = await section.screenshot({ path: `test-results/global-experience-${viewport.width}.png` });
    const image = PNG.sync.read(screenshot);
    let coloredPixels = 0;
    for (let y = 0; y < image.height; y += 3) {
      for (let x = 0; x < image.width; x += 3) {
        if (viewport.width > 700 ? x < image.width * 0.55 : y > 330) continue;
        const offset = (image.width * y + x) * 4;
        if (image.data[offset] > 65 || image.data[offset + 1] > 65 || image.data[offset + 2] > 65) coloredPixels += 1;
      }
    }
    expect(coloredPixels).toBeGreaterThan(300);
  });
}

test('photographic guide does not animate when reduced motion is requested', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/nl');
  const section = page.locator('section[aria-labelledby="experience-title"]');
  await section.scrollIntoViewIfNeeded();
  await expect(section).not.toHaveAttribute('data-scroll-motion', 'ready');
  await expect(section.locator('img[data-mode="computers"]')).toHaveCSS('transform', 'none');
});
