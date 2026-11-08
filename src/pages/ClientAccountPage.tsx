import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CountryCode, LocaleCode, useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import api, { UserSettings } from '../services/api';

const countries: CountryCode[] = ['AR', 'CL', 'ES', 'NL', 'US'];
const locales: Record<CountryCode, LocaleCode> = { AR: 'es-AR', CL: 'es-CL', ES: 'es-ES', NL: 'nl-NL', US: 'en-US' };
const input = 'mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-blue-200';

export function ClientAccountPage() {
  const { user, updateProfile, logout } = useAuth();
  const { t, setCountry } = useLocale();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [contact, setContact] = useState({ email: user?.email || '', phone: user?.phone || '', address: user?.profile?.address || '', city: user?.profile?.city || '', province: user?.profile?.province || '', postal_code: user?.profile?.postal_code || '' });
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmation: '' });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => setError(t('account.loadError')));
  }, []);
  const saveContact = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const result = await updateProfile({ ...contact, phone: contact.phone || undefined });
      if (!result.success) throw new Error(result.message);
      setNotice(t('account.saved'));
    } catch { setError(t('account.saveError')); } finally { setBusy(false); }
  };
  const saveSettings = async (event: FormEvent) => {
    event.preventDefault(); if (!settings) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      await setCountry(updated.country, true);
      setNotice(t('account.saved'));
    } catch { setError(t('account.saveError')); } finally { setBusy(false); }
  };
  const changePassword = async (event: FormEvent) => {
    event.preventDefault(); setError('');
    if (password.newPassword !== password.confirmation) { setError(t('account.passwordMismatch')); return; }
    setBusy(true);
    try {
      await api.changePassword({ currentPassword: password.currentPassword, newPassword: password.newPassword });
      await logout(); navigate('/login', { replace: true });
    } catch { setError(t('account.passwordError')); setBusy(false); }
  };
  return <div className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-900 sm:px-6"><div className="mx-auto max-w-2xl">
    <h1 className="text-3xl font-semibold">{t('account.title')}</h1><p className="mt-2 text-sm text-zinc-600">{t('account.lead')}</p>
    {error && <p role="alert" className="mt-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {notice && <p role="status" className="mt-6 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
    <section className="mt-9 border-t border-zinc-200 py-7"><h2 className="text-xl font-semibold">{t('account.contact')}</h2>
      <form onSubmit={saveContact} className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><span className="text-sm font-medium">{t('account.name')}</span><p className="mt-2 text-sm text-zinc-600">{user?.full_name}</p></div>
        <label className="text-sm font-medium">{t('account.email')}<input type="email" required value={contact.email} onChange={(event) => setContact({ ...contact, email: event.target.value })} className={input}/></label>
        <label className="text-sm font-medium">{t('account.phone')}<input type="tel" value={contact.phone} onChange={(event) => setContact({ ...contact, phone: event.target.value })} className={input}/></label>
        <label className="text-sm font-medium sm:col-span-2">{t('account.address')}<input value={contact.address} onChange={(event) => setContact({ ...contact, address: event.target.value })} className={input}/></label>
        <label className="text-sm font-medium">{t('account.city')}<input value={contact.city} onChange={(event) => setContact({ ...contact, city: event.target.value })} className={input}/></label>
        <label className="text-sm font-medium">{t('account.province')}<input value={contact.province} onChange={(event) => setContact({ ...contact, province: event.target.value })} className={input}/></label>
        <label className="text-sm font-medium">{t('account.postal')}<input value={contact.postal_code} onChange={(event) => setContact({ ...contact, postal_code: event.target.value })} className={input}/></label>
        <div className="sm:col-span-2"><button disabled={busy} className="rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">{t('account.saveContact')}</button></div>
      </form>
    </section>
    <section className="border-t border-zinc-200 py-7"><h2 className="text-xl font-semibold">{t('account.preferences')}</h2><p className="mt-2 text-sm text-zinc-600">{t('account.preferencesLead')}</p>
      <form onSubmit={saveSettings} className="mt-5 space-y-5"><label className="block text-sm font-medium">{t('account.country')}<select disabled={!settings} value={settings?.country || ''} onChange={(event) => { const country = event.target.value as CountryCode; setSettings((current) => current ? { ...current, country, locale: locales[country] } : current); }} className={input}>{countries.map((country) => <option key={country} value={country}>{t(`country.${country}`)}</option>)}</select></label>
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" disabled={!settings} checked={settings?.email_notifications || false} onChange={(event) => setSettings((current) => current ? { ...current, email_notifications: event.target.checked } : current)} className="h-4 w-4 accent-[#0066cc]"/>{t('account.notifications')}</label>
        <button disabled={busy || !settings} className="rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">{t('account.savePreferences')}</button></form>
    </section>
    <section className="border-t border-zinc-200 py-7"><h2 className="text-xl font-semibold">{t('account.security')}</h2><p className="mt-2 text-sm text-zinc-600">{t('account.securityLead')}</p>
      <form onSubmit={changePassword} className="mt-5 space-y-4"><label className="block text-sm font-medium">{t('account.currentPassword')}<input type="password" required value={password.currentPassword} onChange={(event) => setPassword({ ...password, currentPassword: event.target.value })} className={input}/></label><label className="block text-sm font-medium">{t('account.newPassword')}<input type="password" required minLength={8} value={password.newPassword} onChange={(event) => setPassword({ ...password, newPassword: event.target.value })} className={input}/></label><label className="block text-sm font-medium">{t('account.confirmPassword')}<input type="password" required minLength={8} value={password.confirmation} onChange={(event) => setPassword({ ...password, confirmation: event.target.value })} className={input}/></label><button disabled={busy} className="rounded-md border border-zinc-300 px-4 py-2.5 text-sm font-medium disabled:opacity-50">{t('account.changePassword')}</button></form>
    </section>
    <div className="border-t border-zinc-200 py-7"><button type="button" onClick={() => { void logout().then(() => navigate('/login')); }} className="text-sm font-medium text-zinc-600 underline underline-offset-4">{t('account.signOut')}</button></div>
  </div></div>;
}
