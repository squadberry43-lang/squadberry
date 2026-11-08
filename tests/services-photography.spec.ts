import { test, expect } from '@playwright/test';

test('admin catalog replaces legacy illustrations with local photographs', async ({ page }) => {
  await page.setViewportSize({ width: 1365, height: 900 });
  await page.addInitScript(() => localStorage.setItem('doctor-tech-session', 'active'));
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const user = { id: '11111111-1111-4111-8111-111111111111', email: 'admin@example.test', full_name: 'Administrador', role_id: 'role_admin', role_name: 'admin', country: 'AR', locale: 'es-AR', is_active: true };
    const services = [
      { id: '1', name: 'Reparación de pantalla', category: 'Hardware', description: 'Revisión de pantalla', service_type: 'home', image_url: '/assets/services/phone.svg', is_active: true },
      { id: '2', name: 'Soporte remoto', category: 'Software', description: 'Ayuda a distancia', service_type: 'remote', image_url: '/assets/services/software.svg', is_active: true },
      { id: '3', name: 'Configuración de red', category: 'Redes', description: 'Diagnóstico de conexión', service_type: 'home', image_url: '/assets/services/network.svg', is_active: true },
      { id: '4', name: 'Conserje técnico', category: 'Enterprise', description: 'Soporte para empresas', service_type: 'hybrid', image_url: '/assets/services/enterprise.svg', is_active: true },
    ];
    const data = path === '/api/auth/refresh' ? { user, accessToken: 'test-token' } : path === '/api/services/admin/all' ? { services } : {};
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
  });
  await page.goto('/services');
  await page.getByRole('button', { name: 'Rechazar analítica' }).click();
  const cards = page.locator('article').filter({ has: page.locator('img[src*="/assets/editorial/"]') });
  await expect(cards).toHaveCount(4);
  for (const image of await cards.locator('img').all()) {
    await expect(image).toHaveAttribute('src', /\.jpg$/);
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
  }
  await page.screenshot({ path: 'test-results/services-photography-desktop.png', fullPage: true });
  await expect(page.locator('header').getByRole('link', { name: 'Reparaciones' })).toBeVisible();
});
