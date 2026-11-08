import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, Laptop, Monitor, Smartphone, Wifi } from 'lucide-react';
import { Button } from '../components/ui/Button';
import api from '../services/api';
import { useLocale } from '../context/LocaleContext';

const devices = [
  { id: 'personal', icon: Smartphone, category: 'hardware', deviceType: 'phone_or_tablet' },
  { id: 'computers', icon: Laptop, category: 'hardware', deviceType: 'computer' },
  { id: 'network', icon: Wifi, category: 'network', deviceType: 'network' },
  { id: 'business', icon: Building2, category: 'hardware', deviceType: 'business_equipment' },
  { id: 'other', icon: Monitor, category: 'other', deviceType: 'other' },
] as const;

export function NewTicketPage() {
  const { t, locale } = useLocale();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [device, setDevice] = useState<(typeof devices)[number]['id']>('computers');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const incident = searchParams.get('incident');

  useEffect(() => {
    if (!incident) return;
    setTitle((current) => current || `${t('ticket.prefillTitle')}${incident}`);
    setDescription((current) => current || `${t('ticket.prefillDescription')}${incident}.${t('ticket.prefillQuestions')}`);
  }, [incident, locale]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) { setError(t('ticket.requiredSubject')); return; }
    if (!description.trim()) { setError(t('ticket.requiredDescription')); return; }
    setBusy(true); setError('');
    const selected = devices.find((item) => item.id === device)!;
    try {
      const result = await api.createTicket({
        title: title.trim(), description: description.trim(), problem_description: description.trim(),
        category: selected.category, priority: 'normal', device_type: selected.deviceType,
      });
      navigate(`/tickets/${result.id}`);
    } catch {
      setError(t('ticket.createError'));
    } finally { setBusy(false); }
  };

  return <div className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-900 sm:px-6">
    <div className="mx-auto max-w-2xl">
      <Link to="/tickets" className="text-sm font-medium text-[#0066cc]">← {t('ticket.back')}</Link>
      <h1 className="mt-6 text-3xl font-semibold">{t('ticket.newTitle')}</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600">{t('ticket.newLead')}</p>
      <form onSubmit={submit} className="mt-8 space-y-8">
        <fieldset>
          <legend className="mb-3 text-sm font-semibold">{t('ticket.device')}</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {devices.map((item) => {
              const Icon = item.icon;
              return <label key={item.id} className={`flex min-h-24 cursor-pointer flex-col items-start justify-center gap-2 rounded-md border p-4 transition-colors ${device === item.id ? 'border-[#0066cc] bg-blue-50' : 'border-zinc-200 bg-white hover:border-zinc-400'}`}>
                <input type="radio" name="device" value={item.id} checked={device === item.id} onChange={() => setDevice(item.id)} className="sr-only" />
                <Icon size={20} strokeWidth={1.7} aria-hidden="true" />
                <span className="text-sm font-medium">{t(`ticket.${item.id}`)}</span>
              </label>;
            })}
          </div>
        </fieldset>
        <label className="block text-sm font-semibold">{t('ticket.subject')}
          <input required maxLength={255} value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t('ticket.subjectPlaceholder')} className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-4 py-3 text-sm font-normal outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-blue-200" />
        </label>
        <label className="block text-sm font-semibold">{t('ticket.description')}
          <textarea required rows={7} maxLength={10000} value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t('ticket.descriptionPlaceholder')} className="mt-2 w-full resize-y rounded-md border border-zinc-300 bg-white px-4 py-3 text-sm font-normal outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-blue-200" />
        </label>
        {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        <Button type="submit" loading={busy}>{t('ticket.submit')}</Button>
        <p className="max-w-xl text-xs leading-5 text-zinc-500">{t('ticket.note')}</p>
      </form>
    </div>
  </div>;
}
