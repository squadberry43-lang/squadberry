import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { Ticket } from '../services/api';
import { useLocale } from '../context/LocaleContext';
import { RemoteSupportPanel } from '../components/RemoteSupportPanel';
import { TicketConversation } from '../components/TicketConversation';

export function ClientTicketDetailPage() {
  const { id } = useParams();
  const { t, locale } = useLocale();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    api.getTicket(id).then((result) => { if (active) setTicket(result); })
      .catch(() => { if (active) setError(t('ticket.notFound')); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, locale]);
  return <div className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-900 sm:px-6"><div className="mx-auto max-w-3xl">
    <Link to="/tickets" className="text-sm font-medium text-[#0066cc]">← {t('ticket.back')}</Link>
    {loading ? <p className="py-12 text-sm text-zinc-500">{t('ticket.loading')}</p> : error || !ticket ? <p role="alert" className="py-12 text-sm text-red-700">{error || t('ticket.notFound')}</p> : <>
      <p className="mt-8 text-xs font-medium uppercase text-zinc-500">{t('ticket.detail')} · #{ticket.id.slice(0, 8)}</p>
      <h1 className="mt-3 break-words text-3xl font-semibold">{ticket.title}</h1>
      <div className="mt-6 flex flex-wrap gap-5 border-y border-zinc-200 py-5 text-sm"><div><span className="text-zinc-500">{t('ticket.statusColumn')}</span><p className="mt-1 font-medium">{t(`ticket.${['open', 'in_progress', 'pending_client', 'resolved', 'closed'].includes(ticket.status) ? ticket.status : 'unknown'}`)}</p></div><div><span className="text-zinc-500">{t('ticket.createdColumn')}</span><p className="mt-1 font-medium">{new Date(ticket.created_at).toLocaleDateString(locale)}</p></div>{ticket.scheduled_date && <div><span className="text-zinc-500">{t('ticket.appointment')}</span><p className="mt-1 font-medium">{new Date(ticket.scheduled_date).toLocaleDateString(locale)}</p></div>}</div>
      <section className="border-b border-zinc-200 py-7"><h2 className="text-lg font-semibold">{t('ticket.detailDescription')}</h2><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-zinc-700">{ticket.description}</p></section>
      {ticket.diagnosis_notes && <section className="border-b border-zinc-200 py-7"><h2 className="text-lg font-semibold">{t('ticket.diagnosis')}</h2><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-zinc-700">{ticket.diagnosis_notes}</p></section>}
      {ticket.resolution && <section className="py-7"><h2 className="text-lg font-semibold">{t('ticket.resolution')}</h2><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-zinc-700">{ticket.resolution}</p></section>}
      <RemoteSupportPanel ticketId={ticket.id} customer />
      <TicketConversation ticketId={ticket.id} />
    </>}
  </div></div>;
}
