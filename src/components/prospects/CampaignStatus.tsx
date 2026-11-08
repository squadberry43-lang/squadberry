import { useEffect, useState } from 'react';
import { Clock3, MapPin } from 'lucide-react';
import type { ProspectCampaign, ProspectCampaignLatestTask, ProspectCampaignProgress } from '../../services/api';
import { useLocale } from '../../context/LocaleContext';
import { prospectCountryName } from '../../i18n/prospects';

function duration(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const days = Math.floor(total / 86400);
  const hours = Math.floor(total % 86400 / 3600);
  const minutes = Math.floor(total % 3600 / 60);
  const rest = total % 60;
  if (days) return `${days} d ${hours} h ${minutes} min`;
  if (hours) return `${hours} h ${minutes} min`;
  return `${minutes} min ${String(rest).padStart(2, '0')} s`;
}

export function CampaignStatus({ campaign, progress, latestTask, fetchedAt }: {
  campaign: ProspectCampaign;
  progress: ProspectCampaignProgress;
  latestTask: ProspectCampaignLatestTask | null;
  fetchedAt: number;
}) {
  const { t, locale } = useLocale();
  const p = (key: string) => t(`prospects.${key}`);
  const number = new Intl.NumberFormat(locale);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const elapsed = progress.elapsed_seconds + Math.max(0, Math.floor((now - fetchedAt) / 1000));
  const phaseLabel = {
    scanning: p('campaign.preparingCountries'),
    processing: p('campaign.processingBusinesses'),
    cooling: p('campaign.cooling'),
    paused: p('campaign.paused'),
    completed: p('campaign.completed'),
    completed_with_errors: p('campaign.completedErrors'),
    cancelled: p('campaign.cancelled'),
  }[progress.phase];
  const sector = latestTask?.stage === 'segment'
    ? [prospectCountryName(latestTask.country, t), latestTask.province, latestTask.city, latestTask.zone, latestTask.category]
      .filter(Boolean).join(' · ')
    : null;
  const countries = [...progress.countries].sort((a, b) =>
    campaign.countries.indexOf(a.country) - campaign.countries.indexOf(b.country));
  const lastActivityMs = progress.last_activity_at ? Date.parse(progress.last_activity_at) : NaN;
  const quietForTooLong = progress.phase === 'processing' && Number.isFinite(lastActivityMs)
    && now - lastActivityMs > 10 * 60 * 1000;

  return <div className="mt-4 border-t border-zinc-200 pt-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm font-semibold text-zinc-950" aria-live="polite">{phaseLabel}</p>
      <span className="text-xs text-zinc-500">{number.format(progress.processed_count)} {p('campaign.processed')}</span>
    </div>

    {progress.percent === null
      ? <p className="mt-2 text-xs text-zinc-600">{countries.filter((item) => item.phase === 'completed' || item.phase === 'processing').length} {p('of')} {countries.length} {p('campaign.countriesPrepared')}</p>
      : <div className="mt-3">
        <div className="flex justify-between text-xs text-zinc-600">
          <span>{p('campaign.processingProgress')}</span><span>{progress.percent}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200" role="progressbar"
          aria-label={p('campaign.searchProgress')} aria-valuenow={progress.percent} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-[#0071e3] transition-[width] duration-500" style={{ width: `${progress.percent}%` }} />
        </div>
      </div>}

    <div className="mt-4 grid gap-3 border-y border-zinc-100 py-3 text-sm sm:grid-cols-2">
      <div className="flex items-start gap-2">
        <Clock3 size={16} className="mt-0.5 shrink-0 text-zinc-500" aria-hidden="true" />
        <div><p className="text-xs text-zinc-500">{p('campaign.elapsed')}</p><p className="font-medium tabular-nums text-zinc-900">{duration(elapsed)}</p></div>
      </div>
      <div>
        <p className="text-xs text-zinc-500">{p('campaign.eta')}</p>
        <p className="font-medium tabular-nums text-zinc-900">
          {progress.phase === 'scanning' && progress.eta_basis === 'last_day'
            ? p('campaign.noRecentRate')
            : progress.remaining_seconds !== null
            ? duration(progress.remaining_seconds)
            : progress.phase === 'scanning' || progress.phase === 'processing' || progress.phase === 'cooling' ? p('campaign.calculating') : '—'}
        </p>
        {progress.eta_basis && !(progress.phase === 'scanning' && progress.eta_basis === 'last_day') && <p className="text-xs text-zinc-500">
          {p('campaign.rate')}: {number.format(progress.rate_per_hour || 0)} {p('businesses')}/h · {p('campaign.window')} {progress.eta_basis === 'last_10_minutes' ? p('window.tenMinutes') : progress.eta_basis === 'last_hour' ? p('window.hour') : p('window.day')}
          {progress.eta_scope === 'partial' && ` · ${p('campaign.partial')}`}
        </p>}
      </div>
    </div>

    <p className="mt-3 text-xs text-zinc-600">
      {p('campaign.knownPending')}: <span className="font-medium tabular-nums text-zinc-900">{number.format(progress.remaining_count)}</span> {p('businesses')}.
      {progress.phase === 'scanning' && ` ${p('campaign.totalCanGrow')}`}
    </p>

    {sector && <p className="mt-3 flex items-start gap-2 text-xs text-zinc-600">
      <MapPin size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{latestTask?.status === 'running' ? p('campaign.currentSector') : p('campaign.lastSector')}: {sector}</span>
    </p>}
    {progress.phase === 'cooling' && <p className="mt-3 text-xs text-zinc-600" role="status">
      {p('campaign.temperature')}: {progress.temperature_c?.toFixed(1)} °C. {p('campaign.stillActive')}
    </p>}
    {quietForTooLong && <p className="mt-3 text-xs font-medium text-amber-800" role="status">
      {p('campaign.quiet')}
    </p>}

    <div className="mt-4 divide-y divide-zinc-100 border-t border-zinc-100">
      {countries.map((item) => <div key={item.country} className="grid gap-1 py-2.5 text-xs sm:grid-cols-[minmax(9rem,1fr)_minmax(10rem,1fr)_auto] sm:items-center sm:gap-3">
        <span className="font-medium text-zinc-900">{prospectCountryName(item.country, t)}</span>
        <span className="text-zinc-600">{p(`campaign.${item.phase === 'completed' ? 'completedCountry' : item.phase}`)}</span>
        <span className="tabular-nums text-zinc-600 sm:text-right">
          {number.format(item.processed_count)}{item.phase !== 'preparing' && item.phase !== 'scanning' ? ` / ${number.format(item.scanned_count)}` : ''}
          {item.failed_tasks > 0 && <span className="ml-2 text-amber-700">{item.failed_tasks} {p('failed')}</span>}
        </span>
      </div>)}
    </div>
  </div>;
}
