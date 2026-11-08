import { test, expect } from '@playwright/test';

const locales = [
  {
    country: 'AR',
    locale: 'es-AR',
    heading: '¿Qué necesita funcionar mejor en tu empresa?',
    capabilities: ['Equipos de trabajo', 'Redes y conectividad', 'Servidores y nube', 'Procesos y automatización'],
    cta: 'Contanos qué necesita tu empresa',
  },
  {
    country: 'NL',
    locale: 'nl-NL',
    heading: 'Wat moet er beter werken binnen je bedrijf?',
    capabilities: ['Werkplekken en apparatuur', 'Netwerken en connectiviteit', 'Servers en cloud', 'Processen en automatisering'],
    cta: 'Vertel ons wat je bedrijf nodig heeft',
  },
  {
    country: 'US',
    locale: 'en-US',
    heading: 'What needs to work better in your business?',
    capabilities: ['Workstations and devices', 'Networks and connectivity', 'Servers and cloud', 'Processes and automation'],
    cta: 'Tell us what your business needs',
  },
];

for (const locale of locales) {
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 1000 }]) {
    test(`business capabilities are clear and usable in ${locale.locale} at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript(({ country, locale }) => {
      localStorage.setItem('doctor-tech-region', JSON.stringify({ country, locale, source: 'manual' }));
      localStorage.setItem('doctor-tech-analytics-consent', 'rejected');
    }, locale);

    await page.goto('/services');

    const section = page.getByRole('region', { name: locale.heading });
    await expect(section).toBeVisible();
    for (const capability of locale.capabilities) await expect(section.getByText(capability, { exact: true })).toBeVisible();

    const cta = section.getByRole('link', { name: locale.cta });
    await expect(cta).toHaveAttribute('href', /\/register\?incident=/);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
  }
}
