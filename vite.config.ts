import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react(), {
    name: 'indexing-switch',
    transformIndexHtml(html) {
      const siteUrl = process.env.VITE_SITE_URL?.replace(/\/$/, '');
      const withPreview = siteUrl
        ? html.replace('content="/assets/editorial/reparo-studio-hero.jpg"', `content="${siteUrl}/assets/editorial/reparo-studio-hero.jpg"`)
        : html;
      return process.env.VITE_ALLOW_INDEXING === 'true'
        ? withPreview.replace('content="noindex,nofollow"', 'content="index,follow"')
        : withPreview;
    },
  }],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
