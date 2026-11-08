import { test, expect } from '@playwright/test';

test('registration suggests country from IP, offers dependent locations, and keeps optional address usable on iPhone width', async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 });
  await page.addInitScript(() => localStorage.setItem('doctor-tech-analytics-consent', 'rejected'));
  await page.route('**/api/public/region', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ country: 'CL' }),
  }));
  await page.route('**/api/public/locations**', (route) => {
    const url = new URL(route.request().url());
    const level = url.searchParams.get('level');
    const locations = level === 'provinces'
      ? [{ id: '10', name: 'Región Metropolitana de Santiago' }]
      : level === 'cities'
        ? [{ id: '20', name: 'Santiago' }]
        : [{ id: '30', name: 'Providencia' }];
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { locations } }) });
  });

  let registration: Record<string, unknown> | undefined;
  await page.route('**/api/auth/register', async (route) => {
    registration = route.request().postDataJSON();
    await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) });
  });

  await page.goto('/register');
  const country = page.getByRole('combobox', { name: 'País donde recibirás atención' });
  await expect(country).toHaveValue('CL');
  await page.getByLabel('Nombre completo').fill('Ana Test');
  const email = page.getByLabel('Correo electrónico');
  await email.fill('ana@example.test');
  await expect(email).toHaveCSS('font-size', '16px');
  await page.getByLabel('Teléfono').fill('+56912345678');
  await page.locator('#registration-province').selectOption('10');
  await page.getByLabel('Buscar ciudad en la lista').fill('Sant');
  await page.locator('#registration-city').selectOption('20');
  await page.getByLabel('Zona o barrio (opcional)').selectOption('30');
  await page.getByLabel('Contraseña', { exact: true }).fill('TestPassword2026!');
  await page.getByLabel('Confirmar contraseña').fill('TestPassword2026!');

  const address = page.getByLabel('Dirección completa (opcional)');
  await expect(address).not.toHaveAttribute('required', '');
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const columns = await page.locator('#registration-province').evaluate((element) => getComputedStyle(element.parentElement!.parentElement!).gridTemplateColumns);
  expect(columns.split(' ').length).toBe(1);

  await page.getByRole('button', { name: 'Crear cuenta' }).click();
  await expect.poll(() => registration?.country).toBe('CL');
  expect(registration).toMatchObject({ country: 'CL', province: 'Región Metropolitana de Santiago', city: 'Santiago', zone: 'Providencia', address: '' });
});

test('administrative-area label follows the selected country', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('doctor-tech-region', JSON.stringify({ country: 'AR', locale: 'es-AR', source: 'manual' }));
    localStorage.setItem('doctor-tech-analytics-consent', 'rejected');
  });
  await page.route('**/api/public/locations**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data: { locations: [] } }),
  }));
  await page.goto('/register');
  const country = page.locator('select').first();

  for (const [code, label, prompt] of [
    ['AR', 'Provincia', 'Seleccioná una provincia'],
    ['CL', 'Región', 'Selecciona una región'],
    ['ES', 'Provincia', 'Selecciona una provincia'],
    ['NL', 'Provincie', 'Kies een provincie'],
    ['US', 'State', 'Select a state'],
  ]) {
    await country.selectOption(code);
    await expect(page.locator('#registration-province')).toHaveAccessibleName(label);
    await expect(page.locator('#registration-province option').first()).toHaveText(prompt);
  }
});

test('business registration fields stack cleanly at a narrow mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem('doctor-tech-region', JSON.stringify({ country: 'AR', locale: 'es-AR', source: 'manual' }));
    localStorage.setItem('doctor-tech-analytics-consent', 'rejected');
  });
  await page.route('**/api/public/locations**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, data: { locations: [] } }),
  }));
  await page.goto('/register');
  await page.getByText('Empresa', { exact: true }).click();
  await expect(page.getByLabel('Nombre corporativo')).toBeVisible();
  await expect(page.getByLabel('Correo del contacto')).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const columns = await page.getByLabel('Nombre corporativo').evaluate((element) => getComputedStyle(element.parentElement!.parentElement!.parentElement!).gridTemplateColumns);
  expect(columns.split(' ').length).toBe(1);
});
