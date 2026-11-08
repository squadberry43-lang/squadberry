import { FormEvent, useEffect, useState } from 'react';
import { Archive, CalendarClock, ChevronLeft, ChevronRight, Mail, Plus, Search, ShieldCheck, UserRoundX, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { MarketingCampaign, MarketingContact, MarketingDelivery, MarketingOverview } from '../services/api';
import { Modal } from '../components/ui/Modal';
import { ContactAnalytics } from '../components/crm/ContactAnalytics';
import { useLocale } from '../context/LocaleContext';

const field = 'w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15';
const emptyCampaign = { name: '', subject: '', body: '', country: 'AR' };
const emptyContact = { email: '', name: '', country: 'AR', consent_source: '', consent_at: '' };
const PAGE_SIZE = 25;

export function MarketingPage() {
  const { t, locale } = useLocale();
  const countries = Object.fromEntries(['AR', 'CL', 'ES', 'NL', 'US'].map((code) => [code, new Intl.DisplayNames([locale], { type: 'region' }).of(code) || code]));
  const languages = Object.fromEntries(['AR', 'CL', 'ES', 'NL', 'US'].map((code) => [code, new Intl.DisplayNames([locale], { type: 'language' }).of(code === 'NL' ? 'nl' : code === 'US' ? 'en' : 'es') || code]));
  const [tab, setTab] = useState<'campaigns' | 'contacts'>('campaigns');
  const [overview, setOverview] = useState<MarketingOverview | null>(null);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [contacts, setContacts] = useState<MarketingContact[]>([]);
  const [campaignSearch, setCampaignSearch] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [campaignCountry, setCampaignCountry] = useState('');
  const [contactCountry, setContactCountry] = useState('');
  const [campaignPage, setCampaignPage] = useState(1);
  const [contactPage, setContactPage] = useState(1);
  const [campaignTotal, setCampaignTotal] = useState(0);
  const [contactTotal, setContactTotal] = useState(0);
  const [revision, setRevision] = useState(0);
  const [editing, setEditing] = useState<MarketingCampaign | null>(null);
  const [form, setForm] = useState<'campaign' | 'contact' | null>(null);
  const [campaign, setCampaign] = useState(emptyCampaign);
  const [contact, setContact] = useState(emptyContact);
  const [deliveryCampaign, setDeliveryCampaign] = useState<MarketingCampaign | null>(null);
  const [deliveryContacts, setDeliveryContacts] = useState<MarketingContact[]>([]);
  const [selectedDeliveryIds, setSelectedDeliveryIds] = useState<string[]>([]);
  const [deliveries, setDeliveries] = useState<MarketingDelivery[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { api.getMarketingOverview().then(setOverview).catch((err) => setError(err.message)); }, [revision]);
  useEffect(() => {
    if (tab !== 'campaigns') return;
    let active = true;
    const timer = window.setTimeout(() => {
      api.getMarketingCampaigns({ page: campaignPage, limit: PAGE_SIZE, search: campaignSearch, country: campaignCountry })
        .then((result) => { if (active) { setCampaigns(result.campaigns); setCampaignTotal(result.total); } })
        .catch((err) => { if (active) setError(err.message); });
    }, 200);
    return () => { active = false; window.clearTimeout(timer); };
  }, [tab, campaignPage, campaignSearch, campaignCountry, revision]);
  useEffect(() => {
    if (tab !== 'contacts') return;
    let active = true;
    const timer = window.setTimeout(() => {
      api.getMarketingContacts({ page: contactPage, limit: PAGE_SIZE, search: contactSearch, country: contactCountry })
        .then((result) => { if (active) { setContacts(result.contacts); setContactTotal(result.total); } })
        .catch((err) => { if (active) setError(err.message); });
    }, 200);
    return () => { active = false; window.clearTimeout(timer); };
  }, [tab, contactPage, contactSearch, contactCountry, revision]);

  const closeForm = () => { if (!busy) { setForm(null); setError(''); } };
  const startNew = () => {
    setError('');
    if (tab === 'campaigns') { setEditing(null); setCampaign(emptyCampaign); setForm('campaign'); }
    else { setContact(emptyContact); setForm('contact'); }
  };
  const saveCampaign = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (editing) await api.updateMarketingCampaign(editing.id, campaign);
      else await api.createMarketingCampaign(campaign);
      setForm(null); setEditing(null); setCampaign(emptyCampaign); setRevision((value) => value + 1);
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  };
  const saveContact = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      await api.createMarketingContact({ ...contact, consent_at: new Date(contact.consent_at).toISOString() });
      setForm(null); setContact(emptyContact); setRevision((value) => value + 1);
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  };
  const archive = async (item: MarketingCampaign) => {
    setBusy(true); setError('');
    try { await api.updateMarketingCampaign(item.id, { status: item.status === 'draft' ? 'archived' : 'draft' }); setRevision((value) => value + 1); }
    catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  };
  const unsubscribe = async (item: MarketingContact) => {
    if (!window.confirm(`${t('marketing.unsubscribeConfirm')} ${item.email}?`)) return;
    setBusy(true); setError('');
    try { await api.unsubscribeMarketingContact(item.id); setRevision((value) => value + 1); }
    catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  };
  const openDeliveryQueue = async (item: MarketingCampaign) => {
    setBusy(true); setError('');
    try {
      const [contactResult, deliveryResult] = await Promise.all([
        api.getMarketingContacts({ page: 1, limit: 40, country: item.country }),
        api.getMarketingCampaignDeliveries(item.id),
      ]);
      setDeliveryCampaign(item);
      setDeliveryContacts(contactResult.contacts.filter((candidate) => !candidate.unsubscribed_at));
      setDeliveries(deliveryResult.deliveries);
      setSelectedDeliveryIds([]);
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  };
  const queueDeliveries = async () => {
    if (!deliveryCampaign || !selectedDeliveryIds.length) return;
    setBusy(true); setError('');
    try {
      await api.queueMarketingCampaignDeliveries(deliveryCampaign.id, selectedDeliveryIds);
      const result = await api.getMarketingCampaignDeliveries(deliveryCampaign.id);
      setDeliveries(result.deliveries); setSelectedDeliveryIds([]); setRevision((value) => value + 1);
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  };
  const cancelDelivery = async (id: string) => {
    setBusy(true); setError('');
    try {
      await api.cancelMarketingDelivery(id);
      if (deliveryCampaign) setDeliveries((await api.getMarketingCampaignDeliveries(deliveryCampaign.id)).deliveries);
      setRevision((value) => value + 1);
    } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  };

  const search = tab === 'campaigns' ? campaignSearch : contactSearch;
  const country = tab === 'campaigns' ? campaignCountry : contactCountry;
  const page = tab === 'campaigns' ? campaignPage : contactPage;
  const total = tab === 'campaigns' ? campaignTotal : contactTotal;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const changePage = (next: number) => tab === 'campaigns' ? setCampaignPage(next) : setContactPage(next);

  return <div className="mx-auto max-w-[1120px] px-4 py-8 text-zinc-900 sm:px-6 sm:py-12">
    <nav aria-label={t('marketing.breadcrumb')} className="mb-6 flex items-center gap-1 text-xs text-zinc-500"><Link to="/buscador-clientes" className="hover:text-blue-700">{t('nav.prospects')}</Link><ChevronRight size={14} />Marketing</nav>
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-7">
      <div><p className="mb-2 text-xs font-semibold uppercase text-blue-700">{t('marketing.team')}</p><h1 className="text-3xl font-semibold">Marketing</h1><p className="mt-2 max-w-xl text-sm text-zinc-600">{t('marketing.lead')}</p></div>
      <button type="button" onClick={startNew} className="inline-flex h-10 items-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700"><Plus size={16} />{tab === 'campaigns' ? t('marketing.newCampaign') : t('marketing.addContact')}</button>
    </div>
    <div className="grid gap-6 border-b border-zinc-200 py-6 sm:grid-cols-4">
      <div><Users size={19} className="mb-3 text-blue-700" /><p className="text-2xl font-semibold">{overview?.contacts.active ?? '—'}</p><p className="text-sm text-zinc-600">{t('marketing.activeContacts')}</p></div>
      <div><Mail size={19} className="mb-3 text-blue-700" /><p className="text-2xl font-semibold">{overview?.drafts ?? '—'}</p><p className="text-sm text-zinc-600">{t('marketing.drafts')}</p></div>
      <div><ShieldCheck size={19} className="mb-3 text-zinc-600" /><p className="text-sm font-semibold">{overview?.queued ?? '—'} en cola · {overview?.delivery.hourly_limit ?? 10}/h</p><p className="mt-1 text-xs leading-5 text-zinc-600">{overview?.delivery.reason ?? t('marketing.checking')}</p></div>
      <div><UserRoundX size={19} className="mb-3 text-amber-700" /><p className="text-2xl font-semibold">{overview?.deliveries.bounced ?? '—'}</p><p className="text-sm text-zinc-600">Correos rebotados</p><p className="mt-1 text-xs leading-5 text-zinc-600">{overview?.delivery.last_bounce_sync_at ? `Revisado ${new Date(overview.delivery.last_bounce_sync_at).toLocaleString(locale)}` : 'Pendiente de la primera revisión diaria'}</p></div>
    </div>
    <ContactAnalytics />
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 py-4">
      <div className="flex gap-1" role="tablist" aria-label={t('marketing.sections')}>
        <button role="tab" aria-selected={tab === 'campaigns'} onClick={() => { setTab('campaigns'); setError(''); }} className={`rounded-md px-3 py-2 text-sm ${tab === 'campaigns' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>{t('marketing.campaigns')}</button>
        <button role="tab" aria-selected={tab === 'contacts'} onClick={() => { setTab('contacts'); setError(''); }} className={`rounded-md px-3 py-2 text-sm ${tab === 'contacts' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>{t('marketing.audience')}</button>
      </div>
      <div className="flex w-full flex-wrap gap-2 sm:w-auto">
        <label className="relative block min-w-0 flex-1 sm:w-64"><Search size={16} className="absolute left-3 top-2.5 text-zinc-500" /><span className="sr-only">{t('marketing.search')}</span><input value={search} onChange={(event) => { if (tab === 'campaigns') { setCampaignSearch(event.target.value); setCampaignPage(1); } else { setContactSearch(event.target.value); setContactPage(1); } }} placeholder={tab === 'campaigns' ? t('marketing.searchCampaigns') : t('marketing.searchContacts')} className={`${field} pl-9`} /></label>
        <label className="sr-only" htmlFor="marketing-country">{t('marketing.filterCountry')}</label><select id="marketing-country" value={country} onChange={(event) => { if (tab === 'campaigns') { setCampaignCountry(event.target.value); setCampaignPage(1); } else { setContactCountry(event.target.value); setContactPage(1); } }} className={field}><option value="">{t('marketing.allCountries')}</option>{Object.entries(countries).map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select>
      </div>
    </div>
    {error && !form && <p role="alert" className="my-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {tab === 'campaigns' ? <div role="tabpanel" className="divide-y divide-zinc-200">
      {campaigns.length === 0 && <p className="py-12 text-center text-sm text-zinc-500">{t('marketing.noCampaigns')}</p>}
      {campaigns.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
        <div className="min-w-0"><p className="font-medium">{item.name}</p><p className="mt-1 truncate text-sm text-zinc-600">{item.subject || t('marketing.noSubject')} · {countries[item.country] || t('marketing.multipleCountries')} · {item.locale || t('marketing.noLanguage')} · {item.status === 'draft' ? t('marketing.draft') : t('marketing.archived')}</p></div>
        <div className="flex items-center gap-2"><button disabled={busy || item.status !== 'draft'} onClick={() => openDeliveryQueue(item)} className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 disabled:opacity-40"><CalendarClock size={16}/>Preparar cola</button><button onClick={() => { setError(''); setEditing(item); setCampaign({ name: item.name, subject: item.subject, body: item.body, country: item.country }); setForm('campaign'); }} className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100">{t('marketing.edit')}</button><button disabled={busy} onClick={() => archive(item)} title={item.status === 'draft' ? t('marketing.archive') : t('marketing.restore')} aria-label={item.status === 'draft' ? t('marketing.archive') : t('marketing.restore')} className="rounded-md border border-zinc-300 p-2 hover:bg-zinc-100"><Archive size={17} /></button></div>
      </div>)}
    </div> : <div role="tabpanel" className="overflow-x-auto"><table className="w-full min-w-[670px] text-left text-sm"><thead><tr className="border-b border-zinc-200 text-xs text-zinc-500"><th className="py-3 font-medium">{t('marketing.contact')}</th><th className="py-3 font-medium">{t('marketing.countryLanguage')}</th><th className="py-3 font-medium">{t('marketing.consent')}</th><th className="py-3 font-medium">{t('marketing.status')}</th><th className="py-3 font-medium">{t('marketing.action')}</th></tr></thead><tbody>{contacts.map((item) => <tr key={item.id} className="border-b border-zinc-100"><td className="py-3"><span className="font-medium">{item.name || t('marketing.noName')}</span><br/><span className="text-zinc-600">{item.email}</span></td><td>{countries[item.country]}<br/><span className="text-xs text-zinc-500">{item.locale}</span></td><td>{item.consent_source}<br/><span className="text-xs text-zinc-500">{new Date(item.consent_at).toLocaleDateString(locale)}</span></td><td>{item.unsubscribed_at ? t('marketing.unsubscribed') : t('marketing.active')}</td><td>{!item.unsubscribed_at && <button disabled={busy} onClick={() => unsubscribe(item)} className="text-blue-700 hover:underline">{t('marketing.unsubscribe')}</button>}</td></tr>)}</tbody></table>{contacts.length === 0 && <p className="py-12 text-center text-sm text-zinc-500">{t('marketing.noContacts')}</p>}</div>}
    <div className="flex items-center justify-between border-t border-zinc-200 py-4 text-sm text-zinc-600"><span>{total} {t('marketing.results')} · {t('marketing.page')} {page} {t('marketing.of')} {pages}</span><div className="flex gap-2"><button type="button" title={t('marketing.previous')} aria-label={t('marketing.previous')} disabled={page <= 1} onClick={() => changePage(page - 1)} className="rounded-md border border-zinc-300 p-2 disabled:opacity-40"><ChevronLeft size={18}/></button><button type="button" title={t('marketing.next')} aria-label={t('marketing.next')} disabled={page >= pages} onClick={() => changePage(page + 1)} className="rounded-md border border-zinc-300 p-2 disabled:opacity-40"><ChevronRight size={18}/></button></div></div>

    <Modal isOpen={form === 'campaign'} onClose={closeForm} title={editing ? t('marketing.editCampaign') : t('marketing.newCampaign')}>
      <form onSubmit={saveCampaign} className="space-y-4">
        <label className="block text-sm">{t('marketing.name')}<input required maxLength={255} value={campaign.name} onChange={(event) => setCampaign({ ...campaign, name: event.target.value })} className={`${field} mt-1`}/></label>
        <label className="block text-sm">{t('marketing.countryRecipients')}<select required value={campaign.country} onChange={(event) => setCampaign({ ...campaign, country: event.target.value })} className={`${field} mt-1`}>{campaign.country === 'ALL' && <option value="ALL" disabled>{t('marketing.chooseCountry')}</option>}{Object.entries(countries).map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>
        <p className="text-xs text-zinc-600">{t('marketing.composeStart')} {languages[campaign.country] || t('marketing.selectedCountryLanguage')}. {t('marketing.composeEnd')}</p>
        <label className="block text-sm">{t('marketing.subject')}<input maxLength={255} value={campaign.subject} onChange={(event) => setCampaign({ ...campaign, subject: event.target.value })} className={`${field} mt-1`}/></label>
        <label className="block text-sm">{t('marketing.message')}<textarea rows={6} maxLength={20000} value={campaign.body} onChange={(event) => setCampaign({ ...campaign, body: event.target.value })} className={`${field} mt-1`}/></label>
        {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <div className="flex justify-end gap-2"><button type="button" onClick={closeForm} className="rounded-md border px-4 py-2 text-sm">{t('marketing.cancel')}</button><button disabled={busy || campaign.country === 'ALL'} className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50">{t('marketing.saveDraft')}</button></div>
      </form>
    </Modal>
    <Modal isOpen={form === 'contact'} onClose={closeForm} title={t('marketing.addContact')}>
      <form onSubmit={saveContact} className="space-y-4"><p className="text-sm text-zinc-600">{t('marketing.consentOnly')}</p>
        <label className="block text-sm">{t('marketing.email')}<input type="email" required maxLength={320} value={contact.email} onChange={(event) => setContact({ ...contact, email: event.target.value })} className={`${field} mt-1`}/></label>
        <label className="block text-sm">{t('marketing.name')}<input maxLength={255} value={contact.name} onChange={(event) => setContact({ ...contact, name: event.target.value })} className={`${field} mt-1`}/></label>
        <label className="block text-sm">{t('marketing.country')}<select value={contact.country} onChange={(event) => setContact({ ...contact, country: event.target.value })} className={`${field} mt-1`}>{Object.entries(countries).map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>
        <p className="text-xs text-zinc-600">{t('marketing.plannedLanguage')} {languages[contact.country]}.</p>
        <label className="block text-sm">{t('marketing.consentSource')}<input required maxLength={255} value={contact.consent_source} onChange={(event) => setContact({ ...contact, consent_source: event.target.value })} className={`${field} mt-1`}/></label>
        <label className="block text-sm">{t('marketing.consentDate')}<input type="datetime-local" required value={contact.consent_at} onChange={(event) => setContact({ ...contact, consent_at: event.target.value })} className={`${field} mt-1`}/></label>
        {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <div className="flex justify-end gap-2"><button type="button" onClick={closeForm} className="rounded-md border px-4 py-2 text-sm">{t('marketing.cancel')}</button><button disabled={busy} className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50">{t('marketing.add')}</button></div>
      </form>
    </Modal>
    <Modal isOpen={Boolean(deliveryCampaign)} onClose={() => { if (!busy) { setDeliveryCampaign(null); setError(''); } }} title="Preparar cola de correo">
      <div className="space-y-4"><p className="text-sm text-zinc-600">La cola prepara hasta 40 contactos activos de {deliveryCampaign && countries[deliveryCampaign.country]}. El sistema reserva como máximo 10 correos por hora y 40 por día. Gmail sigue desconectado: nada se enviará desde esta pantalla.</p>
        {deliveries.length > 0 ? <div className="space-y-2">{deliveries.map((delivery) => <div key={delivery.id} className="flex items-center justify-between gap-3 border-b border-zinc-100 py-2 text-sm"><span className="min-w-0 truncate">{delivery.name || delivery.email} · {delivery.status === 'queued' ? new Date(delivery.scheduled_at).toLocaleString(locale) : delivery.status}</span>{delivery.status === 'queued' && <button type="button" disabled={busy} onClick={() => cancelDelivery(delivery.id)} className="text-blue-700 hover:underline">Cancelar</button>}</div>)}</div> : <><div className="max-h-64 space-y-2 overflow-y-auto border-y border-zinc-200 py-2">{deliveryContacts.map((candidate) => <label key={candidate.id} className="flex items-center gap-2 py-1 text-sm"><input type="checkbox" checked={selectedDeliveryIds.includes(candidate.id)} onChange={(event) => setSelectedDeliveryIds((ids) => event.target.checked ? [...ids, candidate.id] : ids.filter((id) => id !== candidate.id))}/><span className="min-w-0 truncate">{candidate.name || candidate.email} · {candidate.email}</span></label>)}{!deliveryContacts.length && <p className="py-4 text-sm text-zinc-500">No hay contactos activos y autorizados para este país.</p>}</div><button type="button" disabled={busy || !selectedDeliveryIds.length} onClick={queueDeliveries} className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50">Preparar {selectedDeliveryIds.length || ''} entrega{selectedDeliveryIds.length === 1 ? '' : 's'}</button></>}
        {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</p>}</div>
    </Modal>
  </div>;
}
