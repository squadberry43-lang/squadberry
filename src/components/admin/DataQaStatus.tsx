import { useEffect, useState } from 'react';
import { Activity, CircleAlert, CircleCheck, CircleDashed, LoaderCircle } from 'lucide-react';
import api, { DataQaStatus as DataQaStatusData } from '../../services/api';
import { useLocale, LocaleCode } from '../../context/LocaleContext';

const copy: Record<LocaleCode, Record<string, string>> = {
  'es-AR': { title: 'Calidad de datos', lead: 'Revisión local de prospectos · solo metadatos', idle: 'Sin ejecuciones registradas', starting: 'Iniciando', running: 'En curso', completed: 'Completada', failed: 'Falló', offline: 'Sin conexión', processed: 'Filas revisadas', total: 'Total estimado', candidates: 'Posibles coincidencias', signal: 'Última señal', retry: 'Estado temporalmente no disponible' },
  'es-CL': { title: 'Calidad de datos', lead: 'Revisión local de prospectos · solo metadatos', idle: 'Sin ejecuciones registradas', starting: 'Iniciando', running: 'En curso', completed: 'Completada', failed: 'Falló', offline: 'Sin conexión', processed: 'Filas revisadas', total: 'Total estimado', candidates: 'Posibles coincidencias', signal: 'Última señal', retry: 'Estado temporalmente no disponible' },
  'es-ES': { title: 'Calidad de datos', lead: 'Revisión local de prospectos · solo metadatos', idle: 'Sin ejecuciones registradas', starting: 'Iniciando', running: 'En curso', completed: 'Completada', failed: 'Falló', offline: 'Sin conexión', processed: 'Filas revisadas', total: 'Total estimado', candidates: 'Posibles coincidencias', signal: 'Última señal', retry: 'Estado temporalmente no disponible' },
  'nl-NL': { title: 'Gegevenskwaliteit', lead: 'Lokale prospectcontrole · alleen metadata', idle: 'Geen controles geregistreerd', starting: 'Wordt gestart', running: 'Bezig', completed: 'Voltooid', failed: 'Mislukt', offline: 'Niet verbonden', processed: 'Rijen gecontroleerd', total: 'Geschat totaal', candidates: 'Mogelijke overeenkomsten', signal: 'Laatste signaal', retry: 'Status tijdelijk niet beschikbaar' },
  'en-US': { title: 'Data quality', lead: 'Local prospect review · metadata only', idle: 'No runs recorded', starting: 'Starting', running: 'Running', completed: 'Completed', failed: 'Failed', offline: 'Offline', processed: 'Rows reviewed', total: 'Estimated total', candidates: 'Possible matches', signal: 'Last signal', retry: 'Status temporarily unavailable' },
};

const statusIcon = {
  idle: CircleDashed,
  starting: LoaderCircle,
  running: Activity,
  completed: CircleCheck,
  failed: CircleAlert,
  offline: CircleAlert,
};

export function DataQaStatus() {
  const { locale } = useLocale();
  const text = copy[locale];
  const [status, setStatus] = useState<DataQaStatusData | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const result = await api.getDataQaStatus();
        if (mounted) {
          setStatus(result);
          setUnavailable(false);
        }
      } catch {
        if (mounted) setUnavailable(true);
      }
    };
    void load();
    const timer = window.setInterval(load, 15000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const current = status?.status || 'idle';
  const Icon = statusIcon[current];
  const isActive = current === 'starting' || current === 'running';
  const signalAt = status?.heartbeat_at ? new Date(status.heartbeat_at).toLocaleString(locale) : null;

  return (
    <section className="mb-8 border-y border-zinc-200 py-5" aria-labelledby="dataqa-status-title" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="dataqa-status-title" className="text-base font-semibold text-zinc-900">{text.title}</h2>
          <p className="mt-1 text-sm text-zinc-500">{text.lead}</p>
        </div>
        <div className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-blue-50 text-blue-800' : current === 'failed' || current === 'offline' || unavailable ? 'bg-amber-50 text-amber-800' : 'bg-zinc-100 text-zinc-700'}`}>
          <Icon size={16} className={isActive && current === 'starting' ? 'animate-spin' : ''} aria-hidden="true" />
          <span>{unavailable ? text.retry : text[current]}</span>
        </div>
      </div>
      {!unavailable && status && current !== 'idle' && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label={text.processed} value={formatCount(status.processed_rows, locale)} />
          {status.total_rows ? <Metric label={text.total} value={formatCount(status.total_rows, locale)} /> : null}
          <Metric label={text.candidates} value={formatCount(status.candidate_pairs, locale)} />
          {signalAt ? <Metric label={text.signal} value={signalAt} /> : null}
        </div>
      )}
      {!unavailable && current === 'idle' && <p className="mt-4 text-sm text-zinc-600">{text.idle}</p>}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><p className="text-xs text-zinc-500">{label}</p><p className="mt-1 break-words text-sm font-medium tabular-nums text-zinc-900">{value}</p></div>;
}

function formatCount(value: number | undefined, locale: string) {
  return new Intl.NumberFormat(locale).format(value ?? 0);
}
