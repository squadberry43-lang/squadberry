import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useConsent } from '../../context/ConsentContext';
import { useLocale } from '../../context/LocaleContext';

export function PrivacyConsent() {
  const { choice, setChoice } = useConsent();
  const { t } = useLocale();
  const [editing, setEditing] = useState(false);
  const visible = choice === null || editing;

  return (
    <>
      <button type="button" onClick={() => setEditing(true)} className="text-left text-sm text-[#5f6368] underline-offset-2 hover:text-[#202124] hover:underline">
        {t('privacy.preferences')}
      </button>
      {visible && (
        <aside role="dialog" aria-modal="false" aria-labelledby="consent-title" className="fixed inset-x-4 bottom-4 z-[60] mx-auto max-w-xl border border-black/15 bg-white p-5 shadow-[0_12px_40px_rgba(0,0,0,0.2)] sm:p-6">
          <h2 id="consent-title" className="text-lg font-semibold text-[#202124]">{t('privacy.title')}</h2>
          <p className="mt-2 text-sm leading-6 text-[#5f6368]">{t('privacy.explanation')} <Link to="/privacy" className="text-[#0066cc] underline underline-offset-2">{t('privacy.read')}</Link>.</p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={() => { setChoice('rejected'); setEditing(false); }} className="min-h-11 flex-1 rounded-lg border border-[#202124] px-4 py-2 text-sm font-medium text-[#202124] transition-colors hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc]">{t('privacy.reject')}</button>
            <button type="button" onClick={() => { setChoice('accepted'); setEditing(false); }} className="min-h-11 flex-1 rounded-lg bg-[#202124] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3c4043] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc]">{t('privacy.accept')}</button>
          </div>
        </aside>
      )}
    </>
  );
}
