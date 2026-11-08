import { FormEvent, useEffect, useState } from 'react';
import { Bell, Globe2, KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { toast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { CountryCode, LocaleCode, useLocale } from '../context/LocaleContext';
import api, { UserSettings } from '../services/api';

const localeByCountry: Record<CountryCode, LocaleCode> = {
  AR: 'es-AR', CL: 'es-CL', ES: 'es-ES', NL: 'nl-NL', US: 'en-US',
};

export function SettingsPage() {
  const { user, logout } = useAuth();
  const { setCountry, t } = useLocale();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmation: '' });

  useEffect(() => {
    api.getSettings()
      .then((value) => {
        setSettings(value);
        void setCountry(value.country, true);
      })
      .catch(() => toast(t('management.preferencesLoadError'), 'error'))
      .finally(() => setLoading(false));
  }, [setCountry]);

  const saveSettings = async (event: FormEvent) => {
    event.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      void setCountry(updated.country, true);
      toast(t('management.preferencesSaved'), 'success');
    } catch (error: any) {
      toast(t('management.preferencesError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (passwords.newPassword !== passwords.confirmation) {
      toast(t('management.passwordMismatch'), 'error');
      return;
    }
    setChangingPassword(true);
    try {
      await api.changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      await logout();
      navigate('/login', { replace: true });
      toast(t('management.passwordChanged'), 'success');
    } catch (error: any) {
      toast(t('management.passwordError'), 'error');
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen-safe bg-zinc-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase text-zinc-500">{t('management.account')}</p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-950">{t('management.settingsTitle')}</h1>
          <p className="mt-2 text-sm text-zinc-600">{t('management.settingsLead')}</p>
        </div>

        <section className="border-y border-zinc-200 py-6" aria-labelledby="session-title">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 text-[#0071e3]" size={20} />
            <div>
              <h2 id="session-title" className="font-semibold text-zinc-900">{t('management.activeSession')}</h2>
              <p className="mt-1 text-sm text-zinc-600">{user?.email}</p>
            </div>
          </div>
        </section>

        <form onSubmit={saveSettings} className="border-b border-zinc-200 py-7">
          <div className="flex items-start gap-3">
            <Globe2 className="mt-0.5 text-[#0071e3]" size={20} />
            <div className="flex-1">
              <h2 className="font-semibold text-zinc-900">{t('management.countryLanguage')}</h2>
              <p className="mt-1 text-sm text-zinc-600">{t('management.countryHelp')}</p>
              <select
                aria-label={t('management.countryLanguage')}
                value={settings?.country || ''}
                disabled={loading || !settings}
                onChange={(event) => {
                  const country = event.target.value as CountryCode;
                  setSettings((current) => current ? { ...current, country, locale: localeByCountry[country] } : current);
                }}
                className="mt-4 w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 focus:border-[#0071e3] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
              >
                {Object.keys(localeByCountry).map((code) => <option key={code} value={code}>{t(`country.${code}`)}</option>)}
              </select>

              <label className="mt-5 flex items-center justify-between gap-4 border-t border-zinc-100 pt-5">
                <span className="flex items-center gap-3 text-sm text-zinc-700"><Bell size={18} /> {t('management.emailNotifications')}</span>
                <input
                  type="checkbox"
                  checked={settings?.email_notifications || false}
                  disabled={loading || !settings}
                  onChange={(event) => setSettings((current) => current ? { ...current, email_notifications: event.target.checked } : current)}
                  className="h-5 w-5 accent-[#0071e3]"
                />
              </label>
              <Button type="submit" size="sm" className="mt-5" loading={saving} disabled={loading || !settings}>{t('management.savePreferences')}</Button>
            </div>
          </div>
        </form>

        <form onSubmit={changePassword} className="border-b border-zinc-200 py-7">
          <div className="flex items-start gap-3">
            <KeyRound className="mt-0.5 text-[#0071e3]" size={20} />
            <div className="flex-1">
              <h2 className="font-semibold text-zinc-900">{t('management.changePassword')}</h2>
              <p className="mt-1 text-sm text-zinc-600">{t('management.passwordHelp')}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Input label={t('management.currentPassword')} type="password" autoComplete="current-password" required value={passwords.currentPassword} onChange={(event) => setPasswords((value) => ({ ...value, currentPassword: event.target.value }))} />
                <div />
                <Input label={t('management.newPassword')} type="password" autoComplete="new-password" minLength={8} required value={passwords.newPassword} onChange={(event) => setPasswords((value) => ({ ...value, newPassword: event.target.value }))} />
                <Input label={t('management.repeatPassword')} type="password" autoComplete="new-password" minLength={8} required value={passwords.confirmation} onChange={(event) => setPasswords((value) => ({ ...value, confirmation: event.target.value }))} />
              </div>
              <Button type="submit" size="sm" className="mt-5" loading={changingPassword}>{t('management.updatePassword')}</Button>
            </div>
          </div>
        </form>

        <div className="flex justify-end pt-7">
          <Button variant="danger" size="sm" onClick={handleLogout}><LogOut size={16} /> {t('management.signOut')}</Button>
        </div>
      </div>
    </div>
  );
}
