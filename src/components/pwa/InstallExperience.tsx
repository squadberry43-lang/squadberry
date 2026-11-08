import { useEffect, useState } from 'react';
import { Download, Plus, Share, X } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { useConsent } from '../../context/ConsentContext';
import { createUuid } from '../../utils/uuid';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}

function detectDevice() {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/android/.test(userAgent)) return 'android';
  if (/iphone|ipad|ipod/.test(userAgent)) return 'ios';
  if (/macintosh|mac os x/.test(userAgent)) return 'mac';
  return 'other';
}

function detectBrowser() {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/edg\//.test(userAgent)) return 'edge';
  if (/firefox\//.test(userAgent)) return 'firefox';
  if (/chrome\//.test(userAgent) && !/edg\//.test(userAgent)) return 'chrome';
  if (/safari\//.test(userAgent) && !/chrome\//.test(userAgent)) return 'safari';
  return 'other';
}

export function InstallExperience() {
  const { choice } = useConsent();
  const { country, locale, t } = useLocale();
  const [device, setDevice] = useState<'android' | 'ios' | 'mac' | 'other'>('other');
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const androidApkUrl = import.meta.env.VITE_ANDROID_APK_URL as string | undefined;

  useEffect(() => {
    const standalone = isStandalone();
    setDevice(detectDevice());

    const reportInstallation = () => {
      if (choice !== 'accepted') return;
      if (localStorage.getItem('doctor-tech-pwa-install-reported') === '1') return;
      const installId = createUuid();
      localStorage.setItem('doctor-tech-pwa-install-reported', '1');
      fetch('/api/public/install-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ installId, countryCode: country, locale, deviceType: detectDevice(), browser: detectBrowser() }),
        keepalive: true,
      }).catch(() => localStorage.removeItem('doctor-tech-pwa-install-reported'));
    };
    const handleInstallAvailable = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handleInstallAvailable);
    window.addEventListener('appinstalled', reportInstallation);
    if (standalone) reportInstallation();

    // Safari does not emit beforeinstallprompt, so Apple users get the native steps instead.
    if (!standalone && /iphone|ipad|ipod|macintosh|mac os x/i.test(navigator.userAgent)) setVisible(true);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallAvailable);
      window.removeEventListener('appinstalled', reportInstallation);
    };
  }, [choice, country, locale]);

  if (!visible || device === 'other') return null;

  const installAndroid = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
    setVisible(false);
  };

  return (
    <aside className="relative mx-4 my-4 max-w-md rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:ml-auto sm:mr-6" aria-label={t('pwa.title')}>
      <button type="button" onClick={() => setVisible(false)} className="absolute right-3 top-3 rounded-full p-1 text-zinc-500 hover:bg-zinc-100" aria-label={t('pwa.close')}>
        <X size={16} />
      </button>
      <div className="flex gap-3 pr-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#202124] text-white">
          <Download size={17} />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900">{t('pwa.title')}</p>
          {device === 'android' && installEvent ? (
            <>
              <p className="mt-1 text-xs leading-5 text-zinc-600">{t('pwa.android')}</p>
              <button type="button" onClick={installAndroid} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#0071e3] px-3 py-2 text-xs font-semibold text-white hover:bg-[#005bb5]">
                <Download size={14} /> {t('pwa.install')}
              </button>
            </>
          ) : device === 'android' && androidApkUrl ? (
            <>
              <p className="mt-1 text-xs leading-5 text-zinc-600">{t('pwa.apk')}</p>
              <a href={androidApkUrl} download className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#0071e3] px-3 py-2 text-xs font-semibold text-white hover:bg-[#005bb5]">
                <Download size={14} /> {t('pwa.download')}
              </a>
            </>
          ) : device === 'ios' ? (
            <p className="mt-1 text-xs leading-5 text-zinc-600">{t('pwa.iosStart')} <Share size={13} className="mx-0.5 inline" /> {t('pwa.share')} {t('pwa.iosEnd')} <Plus size={13} className="mx-0.5 inline" /> {t('pwa.add')}.</p>
          ) : (
            <p className="mt-1 text-xs leading-5 text-zinc-600">{t('pwa.mac')}</p>
          )}
        </div>
      </div>
    </aside>
  );
}
