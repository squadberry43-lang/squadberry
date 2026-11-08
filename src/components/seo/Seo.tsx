import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { site } from '../../config/site';
import { useLocale } from '../../context/LocaleContext';

type PageMetadata = {
  title: string;
  description: string;
  indexable: boolean;
};

const publicPageKeys: Record<string, { title: string; description: string; indexable: boolean }> = {
  '/': {
    title: 'seo.home.title', description: 'seo.home.description',
    indexable: true,
  },
  '/services': {
    title: 'seo.services.title', description: 'seo.services.description',
    indexable: true,
  },
  '/login': {
    title: 'seo.login.title', description: 'seo.login.description',
    indexable: false,
  },
  '/register': {
    title: 'seo.register.title', description: 'seo.register.description',
    indexable: true,
  },
};
const squadBerryPreview: PageMetadata = {
  title: 'SquadBerry · Soporte TI, Marketing Digital y Desarrollo de Software',
  description: 'Vista previa interna de la nueva propuesta de SquadBerry.',
  indexable: false,
};
const regionalLocales: Record<string, string> = {
  ar: 'es-AR', cl: 'es-CL', es: 'es-ES', nl: 'nl-NL', us: 'en-US',
};

function updateMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element!.setAttribute(key, value));
}

export function Seo() {
  const location = useLocation();
  const { locale, t } = useLocale();

  useEffect(() => {
    const regional = location.pathname.match(/^\/(ar|cl|es|nl|us)(\/services)?\/?$/);
    const page = publicPageKeys[regional ? (regional[2] || '/') : location.pathname];
    const metadata: PageMetadata = location.pathname === '/squadberry' ? squadBerryPreview : page ? { title: t(page.title), description: t(page.description), indexable: page.indexable } : {
      title: t('seo.private.title'),
      description: t('seo.private.description'),
      indexable: false,
    };
    const canonicalUrl = `${site.url}${location.pathname}`;

    document.title = metadata.title;
    updateMeta('meta[name="description"]', { name: 'description', content: metadata.description });
    updateMeta('meta[name="robots"]', { name: 'robots', content: metadata.indexable && import.meta.env.VITE_ALLOW_INDEXING === 'true' ? 'index,follow' : 'noindex,nofollow' });
    updateMeta('meta[property="og:title"]', { property: 'og:title', content: metadata.title });
    updateMeta('meta[property="og:description"]', { property: 'og:description', content: metadata.description });
    updateMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    updateMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
    updateMeta('meta[property="og:image"]', { property: 'og:image', content: `${site.url}/assets/editorial/reparo-studio-hero.jpg` });
    updateMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    document.querySelectorAll('link[data-doctor-tech-alternate]').forEach((element) => element.remove());
    if (regional || location.pathname === '/' || location.pathname === '/services') {
      const suffix = location.pathname.endsWith('/services') ? '/services' : '';
      for (const [country, language] of Object.entries(regionalLocales)) {
        const link = document.createElement('link');
        link.rel = 'alternate';
        link.hreflang = language;
        link.href = `${site.url}/${country}${suffix}`;
        link.dataset.doctorTechAlternate = 'true';
        document.head.appendChild(link);
      }
      const fallback = document.createElement('link');
      fallback.rel = 'alternate';
      fallback.hreflang = 'x-default';
      fallback.href = `${site.url}${suffix || '/'}`;
      fallback.dataset.doctorTechAlternate = 'true';
      document.head.appendChild(fallback);
    }

    const existingSchema = document.getElementById('doctor-tech-site-schema');
    existingSchema?.remove();
    if (!metadata.indexable) return;

    const schema = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'ProfessionalService',
          '@id': `${site.url}/#business`,
          name: site.name,
          url: site.url,
          description: t('seo.home.description'),
          image: `${site.url}/assets/editorial/reparo-studio-hero.jpg`,
          serviceType: [t('schema.service.1'), t('schema.service.2'), t('schema.service.3')],
          areaServed: ['AR', 'CL', 'ES', 'NL', 'US'].map((country) => t(`country.${country}`)),
        },
        {
          '@type': 'WebPage',
          '@id': `${canonicalUrl}#webpage`,
          url: canonicalUrl,
          name: metadata.title,
          description: metadata.description,
          isPartOf: { '@id': `${site.url}/#website` },
          about: { '@id': `${site.url}/#business` },
        },
        {
          '@type': 'WebSite',
          '@id': `${site.url}/#website`,
          url: site.url,
          name: site.name,
          inLanguage: locale,
        },
      ],
    };
    const script = document.createElement('script');
    script.id = 'doctor-tech-site-schema';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }, [location.pathname, locale, t]);

  return null;
}
