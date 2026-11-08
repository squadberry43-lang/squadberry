import { useEffect, useState, useRef, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CountryCode, LocaleCode, useLocale } from '../context/LocaleContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { toast } from '../components/ui/Toast';
import api, { UserSettings } from '../services/api';

const localeByCountry: Record<CountryCode, LocaleCode> = {
  AR: 'es-AR', CL: 'es-CL', ES: 'es-ES', NL: 'nl-NL', US: 'en-US',
};

export function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const { setCountry, t } = useLocale();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.profile?.address || '',
    city: user?.profile?.city || '',
    province: user?.profile?.province || '',
    postal_code: user?.profile?.postal_code || '',
  });
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [preferences, setPreferences] = useState<UserSettings | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.profile?.avatar_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getSettings()
      .then(setPreferences)
      .catch(() => toast(t('management.preferencesLoadError'), 'error'));
  }, []);

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast(t('management.imageOnly'), 'error');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      toast(t('management.imageSize'), 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await updateProfile({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        province: form.province,
        postal_code: form.postal_code,
      });
      if (!result.success) {
        toast(t('management.profileError'), 'error');
        return;
      }

      toast(t('management.profileSaved'), 'success');
    } catch (err: any) {
      toast(t('management.profileError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      toast(t('management.passwordMismatch'), 'error');
      return;
    }
    setLoading(true);
    try {
      await api.changePassword({
        currentPassword: securityForm.currentPassword,
        newPassword: securityForm.newPassword,
      });
      await logout();
      navigate('/login', { replace: true });
      toast(t('management.passwordChanged'), 'success');
    } catch (err: any) {
      toast(t('management.passwordError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!preferences) return;
      const updated = await api.updateSettings(preferences);
      setPreferences(updated);
      void setCountry(updated.country, true);
      toast(t('management.preferencesSaved'), 'success');
    } catch (err: any) {
      toast(t('management.preferencesError'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  return (
    <div className="min-h-screen-safe bg-zinc-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-semibold text-zinc-900 mb-6">{t('management.profileTitle')}</h1>

        {/* Tabs */}
        <div className="border-b border-zinc-200 mb-6">
          <nav className="flex -mb-px" aria-label={t('management.profileTitle')}>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'profile'
                  ? 'border-iris-600 text-iris-600'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
              }`}
            >
              {t('management.profileTab')}
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'security'
                  ? 'border-iris-600 text-iris-600'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
              }`}
            >
              {t('management.securityTab')}
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'preferences'
                  ? 'border-iris-600 text-iris-600'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300'
              }`}
            >
              {t('management.preferencesTab')}
            </button>
          </nav>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden border-2 border-zinc-200">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt={t('management.photoAlt')} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-12 h-12 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-iris-600 text-white rounded-full flex items-center justify-center hover:bg-iris-700 transition-colors"
                  aria-label={t('management.changePhoto')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.2A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.2A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-upload"
                />
              </div>
            </div>

            <Input
              label={t('management.firstName')}
              value={form.first_name}
              onChange={(e) => update('first_name', e.target.value)}
              required
            />
            <Input
              label={t('management.lastName')}
              value={form.last_name}
              onChange={(e) => update('last_name', e.target.value)}
              required
            />
            <Input
              label={t('management.email')}
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              required
              type="email"
            />
            <Input
              label={t('management.phone')}
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="+00 000 000 0000"
            />
            <div className="border-t border-zinc-200 pt-4 mt-4">
              <h4 className="text-sm font-medium text-zinc-900 mb-3">{t('management.address')}</h4>
              <Input
                label={t('management.address')}
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                placeholder={t('management.address')}
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Input
                  label={t('management.city')}
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                />
                <Input
                  label={t('management.province')}
                  value={form.province}
                  onChange={(e) => update('province', e.target.value)}
                />
                <Input
                  label={t('management.postalCode')}
                  value={form.postal_code}
                  onChange={(e) => update('postal_code', e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200">
              <Button type="submit" disabled={loading}>
                {loading ? t('management.saving') : t('management.saveChanges')}
              </Button>
            </div>
          </form>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <form onSubmit={handleSecuritySubmit} className="space-y-4">
            <div className="text-zinc-600 text-sm mb-4">
              {t('management.securityHelp')}
            </div>
            <Input
              label={t('management.currentPassword')}
              type="password"
              value={securityForm.currentPassword}
              onChange={(e) => setSecurityForm(s => ({ ...s, currentPassword: e.target.value }))}
              required
            />
            <Input
              label={t('management.newPassword')}
              type="password"
              value={securityForm.newPassword}
              onChange={(e) => setSecurityForm(s => ({ ...s, newPassword: e.target.value }))}
              required
              minLength={8}
            />
            <Input
              label={t('management.confirmPassword')}
              type="password"
              value={securityForm.confirmPassword}
              onChange={(e) => setSecurityForm(s => ({ ...s, confirmPassword: e.target.value }))}
              required
            />
            <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200">
              <Button type="button" variant="secondary" onClick={() => setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' })}>
                {t('management.cancel')}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? t('management.changing') : t('management.changePassword')}
              </Button>
            </div>
          </form>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <form onSubmit={handlePreferencesSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">{t('management.countryLanguage')}</label>
              <select
                value={preferences?.country || ''}
                disabled={!preferences}
                onChange={(e) => {
                  const country = e.target.value as CountryCode;
                  setPreferences((current) => current ? { ...current, country, locale: localeByCountry[country] } : current);
                }}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
              >
                {Object.entries(localeByCountry).map(([code, countryLocale]) => <option key={code} value={code}>{t(`country.${code}`)} · {countryLocale === 'nl-NL' ? 'Nederlands' : countryLocale === 'en-US' ? 'English' : 'Español'}</option>)}
              </select>
            </div>
            <div className="border-t border-zinc-200 pt-4 mt-4">
              <h4 className="text-sm font-medium text-zinc-900 mb-3">{t('management.notifications')}</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={preferences?.email_notifications || false}
                    disabled={!preferences}
                    onChange={(e) => setPreferences((current) => current ? { ...current, email_notifications: e.target.checked } : current)}
                    className="h-4 w-4 accent-[#0071e3]"
                  />
                  <span className="text-sm text-zinc-700">{t('management.emailNotifications')}</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200">
              <Button type="submit" disabled={loading || !preferences}>
                {loading ? t('management.saving') : t('management.savePreferences')}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
