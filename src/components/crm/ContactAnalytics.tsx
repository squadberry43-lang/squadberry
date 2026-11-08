import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import api, { CrmAnalytics, CrmChannel } from '../../services/api';
import { Button } from '../ui/Button';
import { useLocale } from '../../context/LocaleContext';

const windows = ['7d', '30d', 'all'] as const;
const outcomeKeys: Record<string, string> = {
  attempted: 'analytics.attempted', sent: 'analytics.sent', connected: 'analytics.connected',
  replied: 'analytics.replied', no_answer: 'analytics.noAnswer', failed: 'analytics.failed',
  meeting_scheduled: 'analytics.meeting',
};

export function ContactAnalytics() {
  const { t, locale } = useLocale();
  const number = new Intl.NumberFormat(locale);
  const channelLabels: Record<CrmChannel, string> = {
    email: 'Email', phone: t('analytics.phone'), whatsapp: 'WhatsApp', web: 'Web', in_person: t('analytics.inPerson'), other: t('analytics.other'),
  };
  const [window, setWindow] = useState<CrmAnalytics['window']>('30d');
  const [data, setData] = useState<CrmAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.getCrmAnalytics(window)
      .then((result) => {
        if (!result || !Array.isArray(result.channels) || !Array.isArray(result.daily) || !Array.isArray(result.outcomes)) {
          throw new Error('Invalid analytics response');
        }
        if (active) setData(result);
      })
      .catch(() => { if (active) { setData(null); setError(t('analytics.loadError')); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [window, revision, t]);

  const refresh = () => setRevision((value) => value + 1);
  const totals = data?.totals;
  const maxChannel = Math.max(...(data?.channels.map((item) => item.interactions) || []), 1);

  return <section className="border-y border-zinc-200 bg-white px-4 py-5 sm:px-5" aria-label={t('analytics.title')} aria-busy={loading}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-base font-semibold text-zinc-950">{t('analytics.title')}</h2><p className="mt-1 max-w-2xl text-sm text-zinc-600">{t('analytics.lead')}</p></div>
      <Button variant="ghost" size="sm" onClick={refresh} disabled={loading} aria-label={t('analytics.refresh')}><RefreshCw size={14} />{t('analytics.refresh')}</Button>
    </div>
    <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t('analytics.period')}>
      {windows.map((value) => <button key={value} type="button" aria-pressed={window === value} onClick={() => setWindow(value)} className={`min-h-10 rounded-md px-3 text-sm ${window === value ? 'bg-zinc-900 text-white' : 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'}`}>{t(value === '7d' ? 'analytics.last7' : value === '30d' ? 'analytics.last30' : 'analytics.all')}</button>)}
    </div>
    {error && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border border-red-200 bg-red-50 px-3 py-3" role="alert"><p className="text-sm text-red-800">{error}</p><Button size="sm" variant="secondary" onClick={refresh} disabled={loading}>{t('analytics.retry')}</Button></div>}
    {loading && <p className="mt-4 text-sm text-zinc-600" role="status">{t('analytics.loading')}</p>}
    {!loading && !error && data && <>
      <dl className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 border-y border-zinc-200 py-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          [t('analytics.interactions'), totals?.interactions], [t('analytics.outbound'), totals?.outbound], [t('analytics.inbound'), totals?.inbound],
          [t('analytics.replies'), totals?.replies], [t('analytics.activeProspects'), totals?.prospects_contacted], [t('analytics.unique'), totals?.unique_targets], [t('analytics.overdue'), totals?.followups_overdue],
        ].map(([label, value]) => <div key={String(label)}><dt className="text-xs leading-5 text-zinc-500">{label}</dt><dd className="mt-1 text-2xl font-semibold tabular-nums text-zinc-950">{number.format(Number(value || 0))}</dd></div>)}
      </dl>
      {totals?.interactions === 0
        ? <p className="mt-4 text-sm text-zinc-600">{t('analytics.empty')}</p>
        : <div className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div><h3 className="text-sm font-semibold text-zinc-900">{t('analytics.byChannel')}</h3><ul className="mt-3 space-y-3">
            {data.channels.map((item) => <li key={item.channel} className="grid grid-cols-[6.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 text-sm">
              <span className="text-zinc-700">{channelLabels[item.channel]}</span><span className="h-2 overflow-hidden rounded-full bg-zinc-100" role="progressbar" aria-label={`${channelLabels[item.channel]}: ${item.interactions}`} aria-valuemin={0} aria-valuemax={maxChannel} aria-valuenow={item.interactions}><span className="block h-full rounded-full bg-[#0071e3]" style={{ width: `${Math.max(item.interactions / maxChannel * 100, item.interactions ? 4 : 0)}%` }} /></span><span className="text-right tabular-nums text-zinc-700">{number.format(item.interactions)}</span>
            </li>)}
          </ul></div>
          <div><h3 className="text-sm font-semibold text-zinc-900">{t('analytics.daily')}</h3>{data.daily.length ? <ul className="mt-3 divide-y divide-zinc-100">
            {data.daily.map((item) => <li key={String(item.day)} className="flex items-center justify-between gap-3 py-2 text-sm"><time dateTime={String(item.day)} className="text-zinc-600">{new Date(`${item.day}T00:00:00Z`).toLocaleDateString(locale, { timeZone: 'UTC' })}</time><span className="font-medium tabular-nums text-zinc-900">{number.format(item.interactions)}</span></li>)}
          </ul> : <p className="mt-3 text-sm text-zinc-500">{t('analytics.noDaily')}</p>}</div>
          <div><h3 className="text-sm font-semibold text-zinc-900">{t('analytics.outcomes')}</h3>{data.outcomes.length ? <ul className="mt-3 divide-y divide-zinc-100">
            {data.outcomes.map((item) => <li key={item.outcome} className="flex items-center justify-between gap-3 py-2 text-sm"><span className="text-zinc-600">{t(outcomeKeys[item.outcome] || 'analytics.others')}</span><span className="font-medium tabular-nums text-zinc-900">{number.format(item.interactions)}</span></li>)}
          </ul> : <p className="mt-3 text-sm text-zinc-500">{t('analytics.noOutcomes')}</p>}</div>
        </div>}
      {data.generated_at && <p className="mt-4 text-xs text-zinc-500">{t('analytics.updated')} {new Date(data.generated_at).toLocaleString(locale)}</p>}
    </>}
  </section>;
}
