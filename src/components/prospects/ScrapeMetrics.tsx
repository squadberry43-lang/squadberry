import type { ProspectScrapeMetrics as Metrics } from '../../services/api';
import type { ProspectWorkerMonitor } from '../../services/api';
import { useLocale } from '../../context/LocaleContext';
import { prospectCountryName } from '../../i18n/prospects';

function Count({ value }: { value: number }) {
  const { locale } = useLocale();
  const number = new Intl.NumberFormat(locale);
  return <span className="tabular-nums">{number.format(value)}</span>;
}

function duration(seconds: number) {
  const minutes = Math.ceil(seconds / 60);
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor(minutes % 1440 / 60);
  const remainder = minutes % 60;
  if (days) return `${days} d ${hours} h`;
  if (hours) return `${hours} h ${remainder} min`;
  return `${remainder} min`;
}

function WindowSummary({ title, data }: {
  title: string;
  data: Metrics['last_hour'];
}) {
  const { t, locale } = useLocale();
  const p = (key: string) => t(`prospects.${key}`);
  const number = new Intl.NumberFormat(locale);
  return <section className="min-w-0 px-0 py-4 lg:px-4 lg:first:pl-0 lg:last:pr-0">
    <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>
    <p className="mt-2 text-3xl font-semibold leading-9 text-zinc-950"><Count value={data.reviewed} /></p>
    <p className="text-sm leading-5 text-zinc-600">{p('metrics.closedRate')} · {number.format(data.per_hour)}{p('metrics.averageRate')}</p>
    <dl className="mt-4 grid grid-cols-3 gap-x-2 border-t border-zinc-100 pt-3">
      <div className="min-w-0"><dt className="text-xs leading-5 text-zinc-500">{p('newPlural')}</dt><dd className="mt-1 text-sm font-semibold text-zinc-900"><Count value={data.new} /></dd></div>
      <div className="min-w-0"><dt className="text-xs leading-5 text-zinc-500">{p('updatedPlural')}</dt><dd className="mt-1 text-sm font-semibold text-zinc-900"><Count value={data.updated} /></dd></div>
      <div className="min-w-0"><dt className="text-xs leading-5 text-zinc-500">{p('metrics.unchanged')}</dt><dd className="mt-1 text-sm font-semibold text-zinc-900"><Count value={data.unchanged} /></dd></div>
    </dl>
  </section>;
}

export function ScrapeMetrics({ metrics, generatedAt, currentTask, workerStatus }: {
  metrics: Metrics;
  generatedAt: string;
  currentTask: ProspectWorkerMonitor['current_task'];
  workerStatus: ProspectWorkerMonitor['worker']['status'] | null;
}) {
  const { t, locale } = useLocale();
  const p = (key: string) => t(`prospects.${key}`);
  const number = new Intl.NumberFormat(locale);
  const updated = new Date(generatedAt);
  const activeWorkers = metrics.active_workers;
  const activeGlobalSearch = activeWorkers.some((worker) => worker.origin === 'deep')
    || metrics.known_backlog.tasks_running > 0 || metrics.known_backlog.tasks_pending > 0;
  const velocity = metrics.global_search.last_10_minutes.reviewed >= 10
    ? { rate: metrics.global_search.last_10_minutes.per_hour, basis: p('window.tenMinutes') }
    : metrics.global_search.last_hour.reviewed >= 30
    ? { rate: metrics.global_search.last_hour.per_hour, basis: p('window.hour') }
    : metrics.global_search.last_day.reviewed >= 30
      ? { rate: metrics.global_search.last_day.per_hour, basis: p('window.day') }
      : null;
  const scanningWithoutRecentBusinessRuns = currentTask?.stage === 'scan'
    && metrics.global_search.last_hour.reviewed === 0;
  const globalEta = !activeGlobalSearch ? p('metrics.noGlobal')
    : scanningWithoutRecentBusinessRuns ? p('metrics.noRecentEstimate')
    : metrics.known_backlog.businesses_remaining > 0 && velocity?.rate
      ? `${metrics.known_backlog.discovering ? '~' : ''}${duration(metrics.known_backlog.businesses_remaining / velocity.rate * 3600)}${metrics.known_backlog.discovering ? ` (${p('metrics.partial')})` : ''}`
      : metrics.known_backlog.businesses_remaining > 0 ? p('metrics.waitingRate')
        : metrics.known_backlog.discovering ? p('metrics.calculatingScope')
          : p('metrics.noPending');
  return <section className="mb-5 rounded-lg border border-zinc-200 bg-white px-4 py-4 sm:px-5 sm:py-5" aria-labelledby="scrape-metrics-title">
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
      <div className="min-w-0">
        <h2 id="scrape-metrics-title" className="text-base font-semibold text-zinc-950">{p('metrics.title')}</h2>
        <p className="mt-1 text-sm leading-5 text-zinc-600">{p('metrics.base')}: <Count value={metrics.total_prospects} /> {p('businesses')}</p>
      </div>
      <p className="max-w-full text-sm leading-5 text-zinc-600 sm:max-w-[22rem] sm:text-right" role="status">
        {activeWorkers.length
          ? <>{p('metrics.active')}: {activeWorkers.map((worker) => `${worker.worker_name} (${p(`origin.${worker.origin}`) || worker.origin})`).join(', ')}</>
          : p('metrics.closed')}
      </p>
    </div>

    <p className="mt-1 text-xs leading-5 text-zinc-500">{p('metrics.lastMeasurement')} {updated.toLocaleTimeString(locale)} · {p('metrics.refresh')}</p>

    <section data-testid="stored-additions-grid" className="mt-4 border-y border-zinc-200 py-4" aria-labelledby="stored-additions-title">
      <h3 id="stored-additions-title" className="text-sm font-semibold text-zinc-950">{p('metrics.storedAdditions')}</h3>
      <p className="mt-1 text-xs leading-5 text-zinc-600">{p('metrics.storedAdditionsNote')}</p>
      <dl className="mt-3 grid grid-cols-3 divide-x divide-zinc-200">
        {([
          ['last_10_minutes', 'metrics.tenMinutes'],
          ['last_hour', 'metrics.hour'],
          ['last_day', 'metrics.day'],
        ] as const).map(([window, label]) => <div key={window} className="min-w-0 px-3 first:pl-0 last:pr-0 sm:px-5">
          <dt className="text-xs leading-5 text-zinc-600 sm:text-sm">{p(label)}</dt>
          <dd className="mt-1 text-2xl font-semibold leading-8 tabular-nums text-zinc-950 sm:text-3xl sm:leading-9"><Count value={metrics.stored_additions[window]} /></dd>
        </div>)}
      </dl>
    </section>

    <section data-testid="live-scrape-progress" className="mt-4 flex flex-col justify-between gap-3 border-y border-zinc-200 bg-zinc-50 px-4 py-4 sm:flex-row sm:items-center" aria-live="polite">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase text-zinc-500">{p('metrics.now')}</p>
        {currentTask ? <>
          <h3 className="mt-1 text-sm font-semibold text-zinc-950">
            {currentTask.stage === 'scan' ? p('metrics.scanning') : p('metrics.saving')}
          </h3>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
            <p className="text-3xl font-semibold leading-9 tabular-nums text-zinc-950"><Count value={currentTask.processed_count} /></p>
            <p className="text-sm leading-5 text-zinc-700">
              {currentTask.stage === 'scan' ? p('metrics.detected') : p('metrics.reviewed')}
            </p>
          </div>
          {currentTask.stage === 'scan' && <p className="mt-1 text-xs leading-5 text-zinc-600">
            {number.format(Number(currentTask.scan_examined_count || 0))} {p('metrics.osmExamined')}
            {workerStatus === 'catching_up' && currentTask.processed_count > 0
              && (currentTask.scan_replay_count || 0) < currentTask.processed_count
              ? ` ${p('metrics.recovering')} ${number.format(currentTask.scan_replay_count || 0)} ${p('of')} ${number.format(currentTask.processed_count)} ${p('metrics.ofCheckpoint')}` : ''}
            {' '}{p('metrics.notSaved')}
          </p>}
          {currentTask.stage !== 'scan' && <p className="mt-1 text-xs leading-5 text-zinc-600">{number.format(currentTask.new_count)} {p('new')} · {number.format(currentTask.updated_count)} {p('updated')} {p('metrics.inTask')}</p>}
          <p className="mt-1 text-xs text-zinc-500">{[prospectCountryName(currentTask.country, t), currentTask.province, currentTask.city, currentTask.category].filter(Boolean).join(' · ')}</p>
        </> : <p className="mt-1 text-sm text-zinc-700">{p('metrics.noTask')}</p>}
      </div>
      {currentTask?.task_updated_at && <div className="shrink-0 text-xs text-zinc-500 sm:text-right">
        <p>{p('metrics.detectedAt')}: {new Date(currentTask.task_updated_at).toLocaleTimeString(locale)}</p>
        {currentTask.scan_heartbeat_at && <p>{p('metrics.readAt')}: {new Date(currentTask.scan_heartbeat_at).toLocaleTimeString(locale)}</p>}
      </div>}
    </section>

    <div data-testid="scrape-window-grid" className="mt-4 grid grid-cols-1 divide-y divide-zinc-200 border-y border-zinc-200 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
      <WindowSummary title={p('metrics.tenMinutes')} data={metrics.last_10_minutes} />
      <WindowSummary title={p('metrics.hour')} data={metrics.last_hour} />
      <WindowSummary title={p('metrics.day')} data={metrics.last_day} />
    </div>
    {currentTask?.stage === 'scan' && <p data-testid="scraper-zero-explanation" className="mt-3 border-l-2 border-[#0071e3] bg-blue-50 px-3 py-2 text-sm leading-5 text-zinc-800" role="status">
      {p('metrics.zeroExplained')}
    </p>}
    {currentTask?.stage !== 'scan' && <p className="mt-2 text-xs leading-5 text-zinc-500">{p('metrics.partialExplained')}</p>}

    <div className="mt-4 grid gap-4 border-t border-zinc-200 pt-4 sm:grid-cols-[minmax(0,1fr)_minmax(13rem,0.7fr)]">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <p className="text-sm text-zinc-600">{p('metrics.backlog')}</p>
          <p className="mt-1 text-xl font-semibold leading-7 tabular-nums text-zinc-950"><Count value={metrics.known_backlog.businesses_remaining} /> <span className="text-sm font-normal text-zinc-600">{p('businesses')}</span></p>
        </div>
        <div className="min-w-0">
          <p className="text-sm text-zinc-600">{p('metrics.eta')}</p>
          <p className="mt-1 break-words text-xl font-semibold leading-7 tabular-nums text-zinc-950">{globalEta}</p>
          {!scanningWithoutRecentBusinessRuns && velocity && metrics.known_backlog.businesses_remaining > 0 && <p className="mt-1 text-xs leading-5 text-zinc-500">{p('metrics.byRate')} {velocity.basis}</p>}
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-3 sm:border-l sm:border-zinc-200 sm:pl-4">
        <div><dt className="text-sm leading-5 text-zinc-600">{p('metrics.tasksPending')}</dt><dd className="mt-1 text-lg font-semibold tabular-nums text-zinc-950"><Count value={metrics.known_backlog.tasks_pending} /></dd></div>
        <div><dt className="text-sm leading-5 text-zinc-600">{p('metrics.inProgress')}</dt><dd className="mt-1 text-lg font-semibold tabular-nums text-zinc-950"><Count value={metrics.known_backlog.tasks_running} /></dd></div>
      </dl>
    </div>

    {metrics.known_backlog.discovering && <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-900" role="status">
      {p('metrics.discovering')}
    </p>}

    {metrics.workers.length > 0 && <p className="mt-3 border-t border-zinc-100 pt-3 text-sm leading-5 text-zinc-600">
      {p('metrics.byWorker')}: {metrics.workers.map((worker) => `${worker.worker_name}: ${number.format(worker.reviewed)}`).join(' · ')}
    </p>}
  </section>;
}
