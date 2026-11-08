import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Cable, Laptop, Smartphone, Stethoscope } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { ImmersiveGuide } from '../components/experience/ImmersiveGuide';
import { useScrollReveal } from '../components/experience/useScrollReveal';

export function HomePage() {
  const { user } = useAuth();
  const { t } = useLocale();
  const rootRef = useScrollReveal<HTMLDivElement>();
  const requestPath = user ? '/tickets/new' : '/register';
  const areas = [
    { icon: Smartphone, key: 'personal' }, { icon: Laptop, key: 'computers' },
    { icon: Cable, key: 'network' }, { icon: Building2, key: 'business' },
  ];

  return (
    <div ref={rootRef} className="min-h-screen bg-[#fbfbfc] text-[#202124]">
      <section className="relative isolate overflow-hidden bg-[#171719]">
        <img src="/assets/editorial/reparo-studio-hero.jpg" alt={t('home.heroAlt')} width="1280" height="854" loading="eager" decoding="async" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 -z-10 bg-black/45" />
        <div className="mx-auto flex min-h-[600px] max-w-[1240px] flex-col justify-end px-6 pb-16 pt-32 text-white sm:px-10 lg:min-h-[680px] lg:px-14 lg:pb-20">
          <p className="text-sm font-medium tracking-wide text-white/70">{t('home.eyebrow')}</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-[1.05] tracking-normal sm:text-6xl lg:text-7xl">{t('home.title')}</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/80">{t('home.lead')}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link to={requestPath} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-lg font-medium text-[#202124] transition-colors hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/70 focus:ring-offset-2 focus:ring-offset-black sm:w-auto">{t('home.request')} <ArrowRight size={18} /></Link>
            <Link to="/services" className="inline-flex items-center justify-center gap-2 px-5 py-3 text-base font-medium text-white hover:text-white/70">{t('home.explore')} <ArrowRight size={17} /></Link>
          </div>
        </div>
      </section>

      <ImmersiveGuide />

      <section className="border-b border-black/10 bg-white px-6 py-14 sm:px-10">
        <div data-scroll-reveal className="mx-auto grid max-w-[1120px] gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#6e6e73]">{t('home.different')}</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl">{t('home.understand')}</h2>
          </div>
          <p className="text-lg leading-8 text-[#5f6368]">{t('home.explanation')}</p>
        </div>
      </section>

      <section className="bg-[#f2f3f5] px-6 py-16 sm:px-10 lg:py-20">
        <div className="mx-auto max-w-[1120px]">
          <div data-scroll-reveal className="flex flex-col justify-between gap-4 border-b border-black/10 pb-7 sm:flex-row sm:items-end">
            <div><p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#6e6e73]">{t('home.care')}</p><h2 className="mt-3 text-3xl font-semibold sm:text-4xl">{t('home.start')}</h2></div>
            <Link to="/services" className="inline-flex items-center gap-2 text-sm font-medium text-[#0066cc]">{t('home.all')} <ArrowRight size={16} /></Link>
          </div>
          <div className="grid divide-y divide-black/10 md:grid-cols-2 md:divide-x md:divide-y-0">
            {areas.map((area) => {
              const Icon = area.icon;
              const path = user ? `/tickets/new?incident=${encodeURIComponent(t(`area.${area.key}.incident`))}` : '/register';
              return <Link key={area.key} data-scroll-reveal to={path} className="group flex gap-5 py-7 md:px-7 md:py-10 first:md:pl-0 nth-[3]:md:pl-0">
                <Icon size={25} strokeWidth={1.6} className="mt-1 shrink-0 text-[#202124]" />
                <div><h3 className="text-xl font-semibold group-hover:text-[#0066cc]">{t(`area.${area.key}.title`)}</h3><p className="mt-2 max-w-sm leading-7 text-[#5f6368]">{t(`area.${area.key}.text`)}</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#0066cc]">{t('home.tell')} <ArrowRight size={15} /></span></div>
              </Link>;
            })}
          </div>
        </div>
      </section>

      <section id="como-funciona" className="bg-white px-6 py-16 sm:px-10 lg:py-20">
        <div className="mx-auto max-w-[1120px]">
          <p data-scroll-reveal className="text-sm font-semibold uppercase tracking-[0.14em] text-[#6e6e73]">{t('home.process')}</p>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {['1', '2', '3'].map((number) => <div key={number} data-scroll-reveal className="border-t border-black/20 pt-5"><p className="text-sm font-semibold text-[#0066cc]">0{number}</p><h3 className="mt-5 text-2xl font-semibold">{t(`step.${number}.title`)}</h3><p className="mt-3 leading-7 text-[#5f6368]">{t(`step.${number}.text`)}</p></div>)}
          </div>
        </div>
      </section>

      <section className="bg-[#202124] px-6 py-16 text-white sm:px-10 lg:py-20">
        <div data-scroll-reveal className="mx-auto flex max-w-[1120px] flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <div><Stethoscope size={26} strokeWidth={1.6} className="text-white/70" /><h2 className="mt-6 max-w-xl text-3xl font-semibold leading-tight sm:text-4xl">{t('home.final')}</h2></div>
          <Link to={requestPath} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-lg font-medium text-[#202124] transition-colors hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/70 focus:ring-offset-2 focus:ring-offset-[#202124]">{t('home.talk')} <ArrowRight size={18} /></Link>
        </div>
      </section>
    </div>
  );
}
