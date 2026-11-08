import { FormEvent, useEffect, useState } from 'react';
import { RefreshCw, Send } from 'lucide-react';
import api, { type TicketMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';

const copy = {
  'es-AR': { title: 'Mensajes del caso', channel: 'Canal web', customer: 'Cliente', team: 'Doctor Tech', empty: 'Todavía no hay mensajes.', placeholder: 'Escribí un mensaje', send: 'Enviar', refresh: 'Actualizar mensajes', error: 'No se pudieron cargar los mensajes.', sendError: 'No se pudo enviar el mensaje.' },
  'es-CL': { title: 'Mensajes del caso', channel: 'Canal web', customer: 'Cliente', team: 'Doctor Tech', empty: 'Todavía no hay mensajes.', placeholder: 'Escribe un mensaje', send: 'Enviar', refresh: 'Actualizar mensajes', error: 'No se pudieron cargar los mensajes.', sendError: 'No se pudo enviar el mensaje.' },
  'es-ES': { title: 'Mensajes del caso', channel: 'Canal web', customer: 'Cliente', team: 'Doctor Tech', empty: 'Todavía no hay mensajes.', placeholder: 'Escribe un mensaje', send: 'Enviar', refresh: 'Actualizar mensajes', error: 'No se pudieron cargar los mensajes.', sendError: 'No se pudo enviar el mensaje.' },
  'nl-NL': { title: 'Berichten over je verzoek', channel: 'Webkanaal', customer: 'Klant', team: 'Doctor Tech', empty: 'Nog geen berichten.', placeholder: 'Schrijf een bericht', send: 'Versturen', refresh: 'Berichten vernieuwen', error: 'Berichten konden niet worden geladen.', sendError: 'Bericht kon niet worden verstuurd.' },
  'en-US': { title: 'Case messages', channel: 'Web channel', customer: 'Customer', team: 'Doctor Tech', empty: 'No messages yet.', placeholder: 'Write a message', send: 'Send', refresh: 'Refresh messages', error: 'Could not load messages.', sendError: 'Could not send the message.' },
};

export function TicketConversation({ ticketId }: { ticketId: string }) {
  const { user } = useAuth();
  const { locale } = useLocale();
  const labels = copy[locale as keyof typeof copy] || copy['es-AR'];
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const refresh = async () => {
    try {
      const ticket = await api.getTicket(ticketId);
      const visible = (ticket.messages || []).filter((message) => !message.is_internal);
      setMessages(visible);
      setError('');
      const seenAt = visible[visible.length - 1]?.created_at || ticket.created_at;
      try { await api.markTicketRead(ticketId, seenAt); } catch { /* Messages remain available if read tracking fails. */ }
    } catch { setError(labels.error); }
  };

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void refresh(); }, 30000);
    return () => window.clearInterval(timer);
  }, [ticketId, locale]);

  const send = async (event: FormEvent) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message || busy) return;
    setBusy(true);
    try {
      await api.sendTicketMessage(ticketId, message);
      setDraft('');
      await refresh();
    } catch { setError(labels.sendError); }
    finally { setBusy(false); }
  };

  return <section className="border-t border-zinc-200 py-7" aria-labelledby="ticket-conversation-title">
    <div className="flex items-center justify-between gap-3">
      <div><h2 id="ticket-conversation-title" className="text-lg font-semibold text-zinc-900">{labels.title}</h2><p className="mt-1 text-xs text-zinc-500">{labels.channel}</p></div>
      <button type="button" onClick={() => void refresh()} aria-label={labels.refresh} title={labels.refresh} className="rounded border border-zinc-300 p-2 text-zinc-600 hover:bg-zinc-100"><RefreshCw size={16} /></button>
    </div>
    <ol className="mt-4 max-h-96 space-y-3 overflow-y-auto" aria-live="polite">
      {messages.length === 0 && <li className="py-4 text-sm text-zinc-500">{labels.empty}</li>}
      {messages.map((message) => <li key={message.id} className="border-l-2 border-zinc-200 pl-3 text-sm">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><strong className="font-medium text-zinc-900">{message.sender_id === user?.id ? (user.full_name || labels.team) : message.sender_type === 'client' ? labels.customer : labels.team}</strong><time className="text-xs text-zinc-500" dateTime={message.created_at}>{new Date(message.created_at).toLocaleString(locale)}</time></div>
        <p className="mt-1 whitespace-pre-wrap break-words text-zinc-700">{message.message}</p>
      </li>)}
    </ol>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    <form onSubmit={send} className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-end">
      <textarea value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={5000} rows={2} aria-label={labels.placeholder} placeholder={labels.placeholder} className="min-w-0 flex-1 resize-y rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-blue-600 focus:outline-none" />
      <button type="submit" disabled={busy || !draft.trim()} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded bg-zinc-900 px-4 text-sm font-medium text-white disabled:opacity-50"><Send size={16} />{labels.send}</button>
    </form>
  </section>;
}
