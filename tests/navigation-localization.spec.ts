import { expect, test } from '@playwright/test';
import { navigationCopy } from '../src/i18n/navigation';

const locales = ['es-AR', 'es-CL', 'es-ES', 'nl-NL', 'en-US'] as const;
const keys = Object.keys(navigationCopy['es-AR']).sort();

test('staff navigation copy is complete in every supported locale', () => {
  for (const locale of locales) {
    expect(Object.keys(navigationCopy[locale]).sort()).toEqual(keys);
    for (const key of keys) {
      expect(navigationCopy[locale][key]?.trim(), `${locale}: ${key}`).not.toBe('');
      expect(navigationCopy[locale][key], `${locale}: ${key}`).not.toBe(key);
    }
  }
  expect(navigationCopy['nl-NL']['nav.agenda']).toBe('Mijn agenda');
  expect(navigationCopy['en-US']['nav.prospects']).toBe('Prospects');
});

const regions = [
  { country: 'AR', locale: 'es-AR', primary: 'Navegación principal', repairs: 'Reparaciones', agenda: 'Mi agenda', prospects: 'Prospectos', marketing: 'Marketing' },
  { country: 'CL', locale: 'es-CL', primary: 'Navegación principal', repairs: 'Reparaciones', agenda: 'Mi agenda', prospects: 'Prospectos', marketing: 'Marketing' },
  { country: 'ES', locale: 'es-ES', primary: 'Navegación principal', repairs: 'Reparaciones', agenda: 'Mi agenda', prospects: 'Prospectos', marketing: 'Marketing' },
  { country: 'NL', locale: 'nl-NL', primary: 'Hoofdnavigatie', repairs: 'Reparaties', agenda: 'Mijn agenda', prospects: 'Prospecten', marketing: 'Marketing' },
  { country: 'US', locale: 'en-US', primary: 'Primary navigation', repairs: 'Repairs', agenda: 'My schedule', prospects: 'Prospects', marketing: 'Marketing' },
] as const;

for (const region of regions) {
  test(`admin navigation renders translated labels for ${region.locale}`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(({ country, locale }) => {
      localStorage.setItem('doctor-tech-session', 'active');
      localStorage.setItem('doctor-tech-region', JSON.stringify({ country, locale, source: 'manual' }));
    }, region);
    await page.route('**/api/**', async (route) => {
      const url = new URL(route.request().url());
      const user = { id: '11111111-1111-4111-8111-111111111111', email: 'admin@example.test', full_name: 'Test Admin', role_id: 'role_admin', role_name: 'admin', country: region.country, locale: region.locale, is_active: true };
      const data = url.pathname === '/api/auth/refresh'
        ? { user, accessToken: 'test-token' }
        : url.pathname === '/api/auth/settings'
          ? { settings: { country: region.country, locale: region.locale, email_notifications: true } }
          : url.pathname === '/api/public/region'
            ? { country: region.country }
            : {};
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
    });

    await page.goto(`/${region.country.toLowerCase()}`);
    const navigation = page.getByRole('navigation', { name: region.primary });
    await expect(navigation).toBeVisible();
    for (const label of [region.repairs, region.agenda, region.prospects, region.marketing]) {
      await expect(navigation.getByRole('link', { name: label, exact: true })).toBeVisible();
    }
    await expect(navigation).not.toContainText(/nav\.[a-z]/i);
  });
}
