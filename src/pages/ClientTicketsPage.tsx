import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import api, { Ticket } from '../services/api';
import { useLocale } from '../context/LocaleContext';

const statuses = ['', 'open', 'in_progress', 'pending_client', 'resolved', 'closed'];

export function ClientTicketsPage() {
  const { t, locale } = useLocale();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      api.getTickets({ page, limit: 20, status, search }).then((result) => {
        if (active) { setTickets(result.tickets); setTotal(result.total); setError(''); }
      }).catch(() => { if (active) { setTickets([]); setTotal(0); setError(t('ticket.loadError')); } })
        .finally(() => { if (active) setLoading(false); });
    }, 180);
    return () => { active = false; window.clearTimeout(timer); };
  }, [page, status, search, locale]);
  const pages = Math.max(1, Math.ceil(total / 20));
  return <div className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-900 sm:px-6">
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-6">
        <div><h1 className="text-3xl font-semibold">{t('ticket.listTitle')}</h1><p className="mt-2 text-sm text-zinc-600">{t('ticket.listLead')}</p></div>
        <Link to="/tickets/new" className="inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white"><Plus size={16}/>{t('ticket.new')}</Link>
      </div>
      <div className="flex flex-wrap gap-3 py-5">
        <label className="relative min-w-0 flex-1"><span className="sr-only">{t('ticket.search')}</span><Search size={16} className="absolute left-3 top-3 text-zinc-500"/><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={t('ticket.search')} className="w-full rounded-md border border-zinc-300 bg-white py-2.5 pl-9 pr-3 text-sm" /></label>
        <label className="sr-only" htmlFor="ticket-status">{t('ticket.status')}</label><select id="ticket-status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm">{statuses.map((value) => <option key={value} value={value}>{t(`ticket.${value || 'all'}`)}</option>)}</select>
      </div>
      {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      {loading ? <p className="py-12 text-center text-sm text-zinc-500">{t('ticket.loading')}</p> : tickets.length === 0 ? <div className="py-16 text-center"><p className="text-sm text-zinc-600">{t('ticket.empty')}</p><Link to="/tickets/new" className="mt-5 inline-block text-sm font-medium text-[#0066cc]">{t('ticket.first')}</Link></div> : <div className="divide-y divide-zinc-200 border-y border-zinc-200">{tickets.map((ticket) => <Link key={ticket.id} to={`/tickets/${ticket.id}`} className="flex items-center justify-between gap-4 py-5 hover:text-[#0066cc]"><div className="min-w-0"><p className="truncate font-medium">{ticket.title}</p><p className="mt-1 text-xs text-zinc-500">{new Date(ticket.created_at).toLocaleDateString(locale)} · {t(`ticket.${statuses.includes(ticket.status) ? ticket.status : 'unknown'}`)}</p></div><ArrowRight size={18} className="shrink-0"/></Link>)}</div>}
      {total > 20 && <div className="flex items-center justify-between py-5 text-sm"><span>{page} / {pages}</span><div className="flex gap-2"><button type="button" title={t('ticket.previous')} aria-label={t('ticket.previous')} disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-md border p-2 disabled:opacity-40"><ChevronLeft size={18}/></button><button type="button" title={t('ticket.next')} aria-label={t('ticket.next')} disabled={page >= pages} onClick={() => setPage(page + 1)} className="rounded-md border p-2 disabled:opacity-40"><ChevronRight size={18}/></button></div></div>}
    </div>
  </div>;
}
