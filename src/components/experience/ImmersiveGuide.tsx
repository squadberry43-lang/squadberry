import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';

type DeviceMode = 'personal' | 'computers' | 'network' | 'business';

const photographs: Record<DeviceMode, string> = {
  personal: '/assets/editorial/reparo-mobile-care.jpg',
  computers: '/assets/editorial/reparo-computer-care.jpg',
  network: '/assets/editorial/doctor-tech-network-care.jpg',
  business: '/assets/editorial/doctor-tech-business-care.jpg',
};
const modes = Object.keys(photographs) as DeviceMode[];

export function ImmersiveGuide() {
  const { user } = useAuth();
  const { t } = useLocale();
  const [mode, setMode] = useState<DeviceMode>('computers');
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)));
      section.style.setProperty('--photo-scale', String(1.07 - progress * 0.07));
      section.style.setProperty('--photo-shift', `${Math.round((progress - 0.5) * 22)}px`);
    };
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    section.dataset.scrollMotion = 'ready';
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const incident = t(`area.${mode}.incident`);
  const path = user ? `/tickets/new?incident=${encodeURIComponent(incident)}` : `/register?incident=${encodeURIComponent(incident)}`;
  return <section ref={sectionRef} className="relative isolate min-h-[690px] overflow-hidden bg-[#16191e] text-white md:min-h-[560px]" aria-labelledby="experience-title">
    <div className="absolute inset-x-0 top-0 h-[330px] overflow-hidden md:inset-y-0 md:left-[38%] md:right-0 md:h-auto" aria-hidden="true">
      {modes.map((item) => <img
        key={item}
        data-mode={item}
        src={photographs[item]}
        alt=""
        loading="lazy"
        decoding="async"
        className={`experience-photo absolute inset-0 h-full w-full object-cover object-center ${mode === item ? 'is-active' : ''}`}
      />)}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#16191e]/35 md:bg-gradient-to-r md:from-[#16191e] md:via-[#16191e]/40 md:to-transparent" />
    </div>
    <div className="relative mx-auto flex min-h-[690px] max-w-[1240px] flex-col justify-end px-6 pb-12 pt-[350px] md:min-h-[560px] md:justify-center md:px-12 md:py-16">
      <div className="max-w-[500px]">
        <p className="text-xs font-semibold uppercase text-white/65">{t('experience.eyebrow')}</p>
        <h2 id="experience-title" className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">{t('experience.title')}</h2>
        <p className="mt-4 text-base leading-7 text-white/75">{t('experience.lead')}</p>
        <div className="mt-7 flex flex-wrap gap-2" role="group" aria-label={t('experience.eyebrow')}>
          {modes.map((item) => <button key={item} type="button" aria-pressed={mode === item} onClick={() => setMode(item)} className={`rounded-md border px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${mode === item ? 'border-white bg-white text-[#16191e]' : 'border-white/35 text-white hover:border-white'}`}>{t(`experience.${item}`)}</button>)}
        </div>
        <Link to={path} className="mt-7 inline-flex items-center gap-2 text-base font-medium text-white underline underline-offset-4 hover:text-white/70">{t('experience.cta')} <ArrowRight size={17} /></Link>
      </div>
    </div>
  </section>;
}
