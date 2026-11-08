import { existsSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const siteUrl = process.env.VITE_SITE_URL?.replace(/\/$/, '');
const sitemapPath = resolve('public/sitemap.xml');
const robotsPath = resolve('public/robots.txt');

if (!siteUrl || process.env.VITE_ALLOW_INDEXING !== 'true') {
  if (existsSync(sitemapPath)) rmSync(sitemapPath);
  writeFileSync(robotsPath, 'User-agent: *\nAllow: /\n\n# Private application routes use page-level noindex directives.\n');
  process.exit(0);
}

const regions = ['ar', 'cl', 'es', 'nl', 'us'];
const routes = ['/', '/services', '/register',
  ...regions.flatMap((region) => [`/${region}`, `/${region}/services`])];
const urls = routes
  .map((route) => `  <url><loc>${siteUrl}${route}</loc></url>`)
  .join('\n');

writeFileSync(
  sitemapPath,
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
);
writeFileSync(
  robotsPath,
  `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n\n# Private application routes use page-level noindex directives.\n`,
);
