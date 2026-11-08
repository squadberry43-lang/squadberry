import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import api, { type InboxTicket } from '../services/api';
import { useLocale } from '../context/LocaleContext';

const copy = {
  'es-AR': { title: 'Bandeja de soporte', recent: 'Casos recientes', refresh: 'Actualizar', empty: 'No hay casos todavía.', error: 'No se pudo cargar la bandeja.', new: 'Nuevo', unread: 'sin leer', noMessages: 'Sin mensajes', unassigned: 'Sin asignar' },
  'es-CL': { title: 'Bandeja de soporte', recent: 'Casos recientes', refresh: 'Actualizar', empty: 'No hay casos todavía.', error: 'No se pudo cargar la bandeja.', new: 'Nuevo', unread: 'sin leer', noMessages: 'Sin mensajes', unassigned: 'Sin asignar' },
  'es-ES': { title: 'Bandeja de soporte', recent: 'Casos recientes', refresh: 'Actualizar', empty: 'No hay casos todavía.', error: 'No se pudo cargar la bandeja.', new: 'Nuevo', unread: 'sin leer', noMessages: 'Sin mensajes', unassigned: 'Sin asignar' },
  'nl-NL': { title: 'Support-inbox', recent: 'Recente zaken', refresh: 'Vernieuwen', empty: 'Nog geen zaken.', error: 'Inbox kon niet worden geladen.', new: 'Nieuw', unread: 'ongelezen', noMessages: 'Geen berichten', unassigned: 'Niet toegewezen' },
  'en-US': { title: 'Support inbox', recent: 'Recent cases', refresh: 'Refresh', empty: 'No cases yet.', error: 'Could not load the inbox.', new: 'New', unread: 'unread', noMessages: 'No messages', unassigned: 'Unassigned' },
};

export function SupportInboxPage() {
  const { locale } = useLocale();
  const labels = copy[locale as keyof typeof copy] || copy['es-AR'];
  const [tickets, setTickets] = useState<InboxTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = async () => {
    try { setTickets(await api.getStaffInbox()); setError(''); }
    catch { setError(labels.error); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void refresh(); }, 30000);
    return () => window.clearInterval(timer);
  }, [locale]);

  return <main className="min-h-screen-safe bg-zinc-50 px-4 py-8 text-zinc-900 sm:px-6"><div className="mx-auto max-w-screen-xl">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-5">
      <div><h1 className="text-2xl font-semibold">{labels.title}</h1><p className="mt-1 text-sm text-zinc-500">{labels.recent}</p></div>
      <button type="button" onClick={() => void refresh()} className="inline-flex items-center gap-2 rounded border border-zinc-300 px-3 py-2 text-sm hover:bg-white"><RefreshCw size={16} />{labels.refresh}</button>
    </header>
    {error && <p role="alert" className="mt-5 text-sm text-red-700">{error}</p>}
    {loading && <p className="py-10 text-sm text-zinc-500">…</p>}
    {!loading && tickets.length === 0 && !error && <p className="py-10 text-sm text-zinc-500">{labels.empty}</p>}
    <ul className="divide-y divide-zinc-200">
      {tickets.map((ticket) => <li key={ticket.id}><Link to={`/tickets/${ticket.id}`} className="grid gap-2 py-4 hover:bg-white sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-2">
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong className="min-w-0 truncate text-sm font-semibold">{ticket.title}</strong>{ticket.unseen_ticket && <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{labels.new}</span>}{ticket.unread_count > 0 && <span className="rounded bg-zinc-900 px-2 py-0.5 text-xs font-medium text-white">{ticket.unread_count} {labels.unread}</span>}</div>
          <p className="mt-1 truncate text-sm text-zinc-600">{ticket.client_name || labels.unassigned} · {ticket.technician_name || labels.unassigned}</p>
          <p className="mt-1 truncate text-sm text-zinc-500">{ticket.last_message || labels.noMessages}</p></div>
        <time className="text-xs text-zinc-500" dateTime={ticket.updated_at}>{new Date(ticket.updated_at).toLocaleString(locale)}</time>
      </Link></li>)}
    </ul>
  </div></main>;
}
