import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Laptop, Smartphone, Wifi } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { useScrollReveal } from '../components/experience/useScrollReveal';
import { BusinessCapabilities } from '../components/experience/BusinessCapabilities';

const paths = [
  { key: 'personal', icon: Smartphone, image: '/assets/editorial/reparo-mobile-care.jpg' },
  { key: 'computers', icon: Laptop, image: '/assets/editorial/reparo-computer-care.jpg' },
  { key: 'network', icon: Wifi, image: '/assets/editorial/doctor-tech-network-care.jpg' },
  { key: 'business', icon: Building2, image: '/assets/editorial/doctor-tech-business-care.jpg' },
];

export function InternationalServicesPage() {
  const { user } = useAuth();
  const { t } = useLocale();
  const rootRef = useScrollReveal<HTMLDivElement>();
  const target = (key?: string) => {
    const incident = key ? `?incident=${encodeURIComponent(t(`area.${key}.incident`))}` : '';
    return user ? `/tickets/new${incident}` : `/register${incident}`;
  };
  return <div ref={rootRef} className="bg-white text-[#202124]">
    <section className="relative isolate overflow-hidden bg-[#17191d] text-white">
      <img src="/assets/editorial/reparo-studio-hero.jpg" alt="" width="1280" height="854" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-45" />
      <div className="mx-auto flex min-h-[520px] max-w-[1180px] flex-col justify-end px-6 pb-14 pt-24 sm:px-10 sm:pb-20">
        <p className="text-xs font-semibold uppercase text-white/70">{t('servicesIntl.eyebrow')}</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">{t('servicesIntl.title')}</h1>
        <p className="mt-5 max-w-xl text-lg leading-8 text-white/80">{t('servicesIntl.lead')}</p>
        <Link to={target()} className="mt-7 inline-flex w-fit items-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-medium text-zinc-900">{t('servicesIntl.cta')} <ArrowRight size={17}/></Link>
      </div>
    </section>
    <section className="mx-auto max-w-[1180px] px-6 py-16 sm:px-10"><h2 data-scroll-reveal className="text-3xl font-semibold">{t('servicesIntl.choose')}</h2>
      <div className="mt-8 grid gap-x-8 divide-y divide-zinc-200 md:grid-cols-2 md:divide-y-0">
        {paths.map(({ key, icon: Icon, image }) => <Link key={key} data-scroll-reveal to={target(key)} className="group block border-t border-zinc-200 py-7">
          <img src={image} alt="" width="960" height="640" loading="lazy" decoding="async" className="mb-5 aspect-[16/9] w-full object-cover" />
          <Icon size={24} strokeWidth={1.5} aria-hidden="true"/><h3 className="mt-4 text-xl font-semibold group-hover:text-[#0066cc]">{t(`servicesIntl.${key}`)}</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-zinc-600">{t(`servicesIntl.${key}Text`)}</p>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#0066cc]">{t('servicesIntl.cta')} <ArrowRight size={16}/></span>
        </Link>)}
      </div>
    </section>
    <BusinessCapabilities />
    <section className="border-t border-zinc-200 bg-zinc-50 px-6 py-14 sm:px-10"><div data-scroll-reveal className="mx-auto max-w-[1180px]"><h2 className="text-2xl font-semibold">{t('servicesIntl.nextTitle')}</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600">{t('servicesIntl.nextText')}</p></div></section>
  </div>;
}
