import { useEffect, useState } from 'react';
import { Download, Monitor, RefreshCw } from 'lucide-react';
import api, { type RemoteSupportSession } from '../services/api';
import { useLocale } from '../context/LocaleContext';

const copy = {
  'es-AR': { title: 'Soporte remoto', lead: 'Podemos revisar tu equipo contigo. El acceso empieza solo después de tu autorización.', download: 'Descargar RustDesk', request: 'Solicitar soporte', consent: 'Autorizar esta sesión', start: 'Registrar inicio', finish: 'Registrar fin', cancel: 'Retirar consentimiento', requested: 'Esperando autorización', consented: 'Autorizada; esperando al técnico', active: 'Sesión en curso', completed: 'Finalizada', cancelled: 'Cancelada', guide: 'Abrí RustDesk y compartí el ID y la contraseña de un solo uso directamente con el técnico. Nunca los escribas en el ticket.', lan: 'Piloto disponible solo dentro de la red local. El técnico te dará el servidor y la clave pública.', failed: 'No se pudo actualizar la sesión. Intentá de nuevo.', refresh: 'Actualizar estado' },
  'es-CL': { title: 'Soporte remoto', lead: 'Podemos revisar tu equipo contigo. El acceso empieza solo después de tu autorización.', download: 'Descargar RustDesk', request: 'Solicitar soporte', consent: 'Autorizar esta sesión', start: 'Registrar inicio', finish: 'Registrar fin', cancel: 'Retirar consentimiento', requested: 'Esperando autorización', consented: 'Autorizada; esperando al técnico', active: 'Sesión en curso', completed: 'Finalizada', cancelled: 'Cancelada', guide: 'Abre RustDesk y comparte el ID y la contraseña de un solo uso directamente con el técnico. Nunca los escribas en el ticket.', lan: 'Piloto disponible solo dentro de la red local. El técnico te dará el servidor y la clave pública.', failed: 'No se pudo actualizar la sesión. Inténtalo de nuevo.', refresh: 'Actualizar estado' },
  'es-ES': { title: 'Soporte remoto', lead: 'Podemos revisar tu equipo contigo. El acceso empieza solo después de tu autorización.', download: 'Descargar RustDesk', request: 'Solicitar soporte', consent: 'Autorizar esta sesión', start: 'Registrar inicio', finish: 'Registrar fin', cancel: 'Retirar consentimiento', requested: 'Esperando autorización', consented: 'Autorizada; esperando al técnico', active: 'Sesión en curso', completed: 'Finalizada', cancelled: 'Cancelada', guide: 'Abre RustDesk y comparte el ID y la contraseña de un solo uso directamente con el técnico. Nunca los escribas en el ticket.', lan: 'Piloto disponible solo dentro de la red local. El técnico te dará el servidor y la clave pública.', failed: 'No se pudo actualizar la sesión. Inténtalo de nuevo.', refresh: 'Actualizar estado' },
  'nl-NL': { title: 'Ondersteuning op afstand', lead: 'We kunnen samen naar je apparaat kijken. Toegang begint pas na jouw toestemming.', download: 'RustDesk downloaden', request: 'Hulp aanvragen', consent: 'Deze sessie toestaan', start: 'Start registreren', finish: 'Einde registreren', cancel: 'Toestemming intrekken', requested: 'Wacht op toestemming', consented: 'Toegestaan; wacht op technicus', active: 'Sessie actief', completed: 'Afgerond', cancelled: 'Geannuleerd', guide: 'Open RustDesk en deel de ID en het eenmalige wachtwoord rechtstreeks met de technicus. Zet ze niet in het ticket.', lan: 'Pilot alleen binnen het lokale netwerk. De technicus geeft je de server en openbare sleutel.', failed: 'De sessie kon niet worden bijgewerkt. Probeer opnieuw.', refresh: 'Status vernieuwen' },
  'en-US': { title: 'Remote support', lead: 'We can inspect your device with you. Access starts only after you give permission.', download: 'Download RustDesk', request: 'Request support', consent: 'Authorize this session', start: 'Record start', finish: 'Record end', cancel: 'Withdraw consent', requested: 'Awaiting authorization', consented: 'Authorized; awaiting technician', active: 'Session in progress', completed: 'Completed', cancelled: 'Cancelled', guide: 'Open RustDesk and share its ID and one-time password directly with the technician. Never put them in the ticket.', lan: 'Pilot available only on the local network. Your technician will provide the server and public key.', failed: 'Could not update the session. Please try again.', refresh: 'Refresh status' },
};

const lanServer = '192.168.1.20';
const lanPublicKey = 'OrHcjgfTn7B7Kj50vNKlSsmVg2fzS5gcR57jtELA4pU=';

export function RemoteSupportPanel({ ticketId, customer }: { ticketId: string; customer: boolean }) {
  const { locale } = useLocale();
  const labels = copy[locale as keyof typeof copy] || copy['es-AR'];
  const onLanSite = ['192.168.1.20', '127.0.0.1', 'localhost'].includes(window.location.hostname);
  const [sessions, setSessions] = useState<RemoteSupportSession[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const current = sessions.find((session) => ['requested', 'consented', 'active'].includes(session.status));
  const latest = sessions[0];

  const refresh = async () => {
    try { setSessions(await api.getRemoteSessions(ticketId)); setError(''); }
    catch { setError(labels.failed); }
  };
  useEffect(() => { void refresh(); }, [ticketId]);

  const act = async (action: 'request' | 'consent' | 'start' | 'finish') => {
    setBusy(true);
    try {
      if (action === 'request') await api.requestRemoteSupport(ticketId);
      else if (current) await api.updateRemoteSupport(ticketId, current.id, action);
      await refresh();
    } catch { setError(labels.failed); }
    finally { setBusy(false); }
  };

  return <section className="border-t border-zinc-200 py-7" aria-labelledby="remote-support-title">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 id="remote-support-title" className="flex items-center gap-2 text-lg font-semibold"><Monitor size={18} aria-hidden="true" />{labels.title}</h2>
        <p className="mt-2 text-sm text-zinc-600">{labels.lead}</p></div>
      <button type="button" onClick={() => void refresh()} title={labels.refresh} aria-label={labels.refresh} className="rounded border border-zinc-300 p-2 text-zinc-600 hover:bg-zinc-100"><RefreshCw size={16} /></button>
    </div>
    <p className="mt-4 text-sm text-zinc-600">{labels.guide}</p>
    <p className="mt-2 text-sm text-zinc-500">{labels.lan}</p>
    {onLanSite && <dl className="mt-3 grid gap-2 text-xs text-zinc-600 sm:grid-cols-2">
      <div><dt className="font-semibold">ID Server</dt><dd className="select-all font-mono break-all">{lanServer}</dd></div>
      <div><dt className="font-semibold">Key</dt><dd className="select-all font-mono break-all">{lanPublicKey}</dd></div>
    </dl>}
    <p className="mt-3 text-xs text-zinc-500">{locale === 'nl-NL' ? 'Dit paneel registreert toestemming, maar verbreekt RustDesk niet. Sluit RustDesk om de verbinding direct te stoppen.' : locale === 'en-US' ? 'This panel records consent but cannot disconnect RustDesk. Close RustDesk to stop access immediately.' : 'Este panel registra el consentimiento, pero no desconecta RustDesk. Cerrá RustDesk para cortar el acceso de inmediato.'}</p>
    {latest && <p className="mt-4 text-sm font-medium text-zinc-800" role="status">{labels[latest.status]}</p>}
    {error && <p className="mt-3 text-sm text-red-700" role="alert">{error}</p>}
    <div className="mt-5 flex flex-wrap gap-3">
      <a href="https://rustdesk.com/download" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100"><Download size={16} />{labels.download}</a>
      {!current && <button type="button" disabled={busy} onClick={() => void act('request')} className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">{labels.request}</button>}
      {current?.status === 'requested' && customer && <button type="button" disabled={busy} onClick={() => void act('consent')} className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">{labels.consent}</button>}
      {current?.status === 'consented' && !customer && <button type="button" disabled={busy} onClick={() => void act('start')} className="rounded bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">{labels.start}</button>}
      {current && <button type="button" disabled={busy} onClick={() => void act('finish')} className="rounded border border-zinc-300 px-3 py-2 text-sm font-medium disabled:opacity-50">{customer ? labels.cancel : labels.finish}</button>}
    </div>
    {sessions.length > 0 && <ol className="mt-6 divide-y divide-zinc-200 border-t border-zinc-200 text-xs text-zinc-600">
      {sessions.slice(0, 5).map((session) => <li key={session.id} className="flex flex-wrap justify-between gap-2 py-2">
        <span>{labels[session.status]}</span><time dateTime={session.created_at}>{new Date(session.created_at).toLocaleString(locale)}</time>
      </li>)}
    </ol>}
  </section>;
}
