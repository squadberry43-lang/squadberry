import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { BrandMark } from '../components/brand/BrandMark';
import { CountryCode, useLocale } from '../context/LocaleContext';
import api, { PublicLocation } from '../services/api';

const locationSelectClass = 'mt-1 block min-h-11 w-full min-w-0 rounded-md border border-zinc-300 bg-white px-3 py-2 text-base sm:text-sm';
const administrativeAreaCopy: Record<CountryCode, { label: string; prompt: string }> = {
  AR: { label: 'Provincia', prompt: 'Seleccioná una provincia' },
  CL: { label: 'Región', prompt: 'Selecciona una región' },
  ES: { label: 'Provincia', prompt: 'Selecciona una provincia' },
  NL: { label: 'Provincie', prompt: 'Kies een provincie' },
  US: { label: 'State', prompt: 'Select a state' },
};

export function RegisterPage() {
  const { register } = useAuth();
  const { country, setCountry, t, locale } = useLocale();
  const administrativeArea = administrativeAreaCopy[country];
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [provinces, setProvinces] = useState<PublicLocation[]>([]);
  const [cities, setCities] = useState<PublicLocation[]>([]);
  const [zones, setZones] = useState<PublicLocation[]>([]);
  const [provinceId, setProvinceId] = useState('');
  const [cityId, setCityId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const previousCountry = useRef(country);

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirm_password: '',
    full_name: '',
    document_number: '',
    phone: '',
    type: 'particular' as 'particular' | 'enterprise',
    corporate_name: '',
    trade_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    billing_email: '',
    address: '',
    city: '',
    province: '',
    zone: '',
    postal_code: '',
  });

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (previousCountry.current !== country) {
      previousCountry.current = country;
      setProvinceId('');
      setCityId('');
      setZoneId('');
      setForm((current) => ({ ...current, province: '', city: '', zone: '' }));
      setCities([]);
      setZones([]);
      setCitySearch('');
    }
    let active = true;
    setProvinces([]);
    void api.getPublicLocations(country, 'provinces').then((result) => {
      if (active) setProvinces(result.locations);
    }).catch(() => {
      if (active) setProvinces([]);
    });
    return () => { active = false; };
  }, [country]);

  useEffect(() => {
    if (!provinceId || provinceId === '__other__') {
      setCities([]);
      return;
    }
    let active = true;
    const timer = window.setTimeout(() => {
      void api.getPublicLocations(country, 'cities', provinceId, citySearch).then((result) => {
        if (active) setCities(result.locations);
      }).catch(() => {
        if (active) setCities([]);
      });
    }, 200);
    return () => { active = false; window.clearTimeout(timer); };
  }, [country, provinceId, citySearch]);

  useEffect(() => {
    if (!cityId || cityId === '__other__') {
      setZones([]);
      return;
    }
    let active = true;
    setZones([]);
    void api.getPublicLocations(country, 'zones', cityId).then((result) => {
      if (active) setZones(result.locations);
    }).catch(() => {
      if (active) setZones([]);
    });
    return () => { active = false; };
  }, [country, cityId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (form.password !== form.confirm_password) {
      setError(t('auth.passwordMismatch'));
      return;
    }
    if (form.type === 'enterprise' && !form.corporate_name) {
      setError(t('auth.businessRequired'));
      return;
    }
    setLoading(true);
    const result = await register({
      country,
      email: form.email,
      password: form.password,
      full_name: form.full_name,
      document_type: form.type === 'enterprise' ? ({ AR: 'CUIT', CL: 'RUT', ES: 'NIF', NL: 'KvK', US: 'EIN' } as Record<CountryCode, string>)[country] : undefined,
      document_number: form.type === 'enterprise' ? form.document_number : undefined,
      phone: form.phone,
      type: form.type,
      corporate_name: form.corporate_name,
      trade_name: form.trade_name,
      contact_name: form.type === 'enterprise' ? form.contact_name : form.full_name,
      contact_email: form.type === 'enterprise' ? form.contact_email : form.email,
      contact_phone: form.type === 'enterprise' ? form.contact_phone : form.phone,
      billing_email: form.type === 'enterprise' ? form.billing_email : form.email,
      address: form.address,
      city: form.city,
      province: form.province,
      zone: form.zone,
      postal_code: form.postal_code,
    });
    setLoading(false);
    if (!result.success) {
      setError(locale.startsWith('es') ? (result.message || t('auth.registerError')) : t('auth.registerError'));
    } else {
      setSuccess(t('auth.registerSuccess'));
      const incident = searchParams.get('incident');
      const next = incident ? `/login?incident=${encodeURIComponent(incident)}` : '/login';
      setTimeout(() => navigate(next), 2000);
    }
  };

  const isEnterprise = form.type === 'enterprise';

  return (
    <div className="min-h-screen-safe flex items-start justify-center bg-zinc-50 p-4 pt-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <BrandMark className="mb-4" />
          <h1 className="text-2xl font-semibold text-zinc-900 mb-2">{t('auth.create')}</h1>
          <p className="text-zinc-500 text-sm">{t('auth.registerLead')}</p>
        </div>

        <Card padding="lg" className="">
          <form onSubmit={handleSubmit} className="space-y-5 [&_input]:text-base sm:[&_input]:text-sm">
            {error && (
              <div className="p-3 rounded-[2.5rem] bg-crimson/10 text-crimson text-sm border border-crimson/20">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 rounded-[2.5rem] bg-sprout/10 text-sprout text-sm border border-sprout/20">
                {success}
              </div>
            )}

            <label className="block text-sm font-medium text-zinc-700">
              {t('auth.country')}
              <select value={country} onChange={(event) => { void setCountry(event.target.value as CountryCode); }} className={locationSelectClass}>
                {(['AR', 'CL', 'ES', 'NL', 'US'] as CountryCode[]).map((code) => <option key={code} value={code}>{t(`country.${code}`)}</option>)}
              </select>
              <span className="mt-1 block text-xs font-normal text-zinc-500">{t('auth.countryHint')}</span>
            </label>

            {/* Tipo de cuenta */}
            <div className="flex gap-3">
              <label className={`flex-1 relative cursor-pointer p-4 rounded-[2.5rem] border-2 transition-all duration-200 ${form.type === 'particular' ? 'border-iris bg-iris/5' : 'border-zinc-200 bg-white hover:border-zinc-300'}`}>
                <input
                  type="radio"
                  name="type"
                  value="particular"
                  checked={form.type === 'particular'}
                  onChange={() => setForm(prev => ({ ...prev, type: 'particular' }))}
                  className="sr-only"
                />
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${form.type === 'particular' ? 'bg-iris/10' : 'bg-zinc-100'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={form.type === 'particular' ? '#0071e3' : '#71717a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <span className={`text-sm font-medium ${form.type === 'particular' ? 'text-iris' : 'text-zinc-600'}`}>{t('auth.personal')}</span>
                  <span className="text-xs text-zinc-500">{t('auth.personalUse')}</span>
                </div>
              </label>
              <label className={`flex-1 relative cursor-pointer p-4 rounded-[2.5rem] border-2 transition-all duration-200 ${form.type === 'enterprise' ? 'border-cobalt bg-cobalt/5' : 'border-zinc-200 bg-white hover:border-zinc-300'}`}>
                <input
                  type="radio"
                  name="type"
                  value="enterprise"
                  checked={form.type === 'enterprise'}
                  onChange={() => setForm(prev => ({ ...prev, type: 'enterprise' }))}
                  className="sr-only"
                />
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${form.type === 'enterprise' ? 'bg-cobalt/10' : 'bg-zinc-100'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={form.type === 'enterprise' ? '#3f71d4' : '#71717a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    </svg>
                  </div>
                  <span className={`text-sm font-medium ${form.type === 'enterprise' ? 'text-cobalt' : 'text-zinc-600'}`}>{t('auth.business')}</span>
                  <span className="text-xs text-zinc-500">{t('auth.businessUse')}</span>
                </div>
              </label>
            </div>

            {/* Datos principales */}
            <div>
              <Input
                label={t('auth.fullName')}
                value={form.full_name}
                onChange={(e) => update('full_name', e.target.value)}
                placeholder={t('auth.fullName')}
                required
              />
            </div>

            <div>
              <Input
                label={t('auth.email')}
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>

            {form.type === 'enterprise' && <Input
              label={`${t('auth.documentNumber')} (${({ AR: 'CUIT', CL: 'RUT', ES: 'NIF', NL: 'KvK', US: 'EIN' } as Record<CountryCode, string>)[country]})`}
              value={form.document_number}
              onChange={(e) => update('document_number', e.target.value)}
              required
            />}

            <div>
              <Input
                  label={t('auth.phone')}
                value={form.phone}
                onChange={(e) => update('phone', e.target.value)}
                  placeholder={({ AR: '+54', CL: '+56', ES: '+34', NL: '+31', US: '+1' } as Record<CountryCode, string>)[country]}
              />
            </div>

            {/* Empresa fields */}
            {isEnterprise && (
              <div className="pt-2 border-t border-zinc-200">
                <p className="text-sm font-medium text-zinc-700 mb-3">{t('auth.businessDetails')}</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <Input
                      label={t('auth.legalName')}
                      value={form.corporate_name}
                      onChange={(e) => update('corporate_name', e.target.value)}
                      placeholder="TechSolutions SA"
                      required
                    />
                  </div>
                  <div>
                    <Input
                      label={t('auth.tradeName')}
                      value={form.trade_name}
                      onChange={(e) => update('trade_name', e.target.value)}
                      placeholder="TechSolutions"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <Input
                      label={t('auth.contactName')}
                      value={form.contact_name}
                      onChange={(e) => update('contact_name', e.target.value)}
                      placeholder={t('auth.contactName')}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      label={t('auth.contactEmail')}
                      type="email"
                      value={form.contact_email}
                      onChange={(e) => update('contact_email', e.target.value)}
                      placeholder="contact@example.com"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <Input
                      label={t('auth.contactPhone')}
                      value={form.contact_phone}
                      onChange={(e) => update('contact_phone', e.target.value)}
                      placeholder={({ AR: '+54', CL: '+56', ES: '+34', NL: '+31', US: '+1' } as Record<CountryCode, string>)[country]}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      label={t('auth.billingEmail')}
                      type="email"
                      value={form.billing_email}
                      onChange={(e) => update('billing_email', e.target.value)}
                      placeholder="billing@example.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Ubicación */}
            <div className="pt-2 border-t border-zinc-200">
              <p className="mb-3 text-sm font-medium text-zinc-700">{t('auth.location')}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  {provinceId === '__other__' ? (
                    <Input label={administrativeArea.label} value={form.province} onChange={(event) => update('province', event.target.value)} required />
                  ) : (
                    <label htmlFor="registration-province" className="block min-w-0 text-sm font-medium text-zinc-700">
                      {administrativeArea.label}
                      <select id="registration-province" required value={provinceId} onChange={(event) => {
                        const nextId = event.target.value;
                        setProvinceId(nextId);
                        setCityId('');
                        setZoneId('');
                        setCitySearch('');
                        const selected = provinces.find((item) => item.id === nextId);
                        setForm((current) => ({ ...current, province: nextId === '__other__' ? '' : selected?.name || '', city: '', zone: '' }));
                      }} className={locationSelectClass}>
                        <option value="">{administrativeArea.prompt}</option>
                        {provinces.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        <option value="__other__">{t('auth.otherLocation')}</option>
                      </select>
                    </label>
                  )}
                </div>
                <div>
                  {provinceId === '__other__' || cityId === '__other__' ? (
                    <Input label={t('auth.city')} value={form.city} onChange={(event) => update('city', event.target.value)} required />
                  ) : (
                    <div className="min-w-0">
                      <Input
                        label={t('auth.findCity')}
                        value={citySearch}
                        onChange={(event) => {
                          setCitySearch(event.target.value);
                          setCityId('');
                          setZoneId('');
                          setForm((current) => ({ ...current, city: '', zone: '' }));
                        }}
                        placeholder={t('auth.findCityPlaceholder')}
                        disabled={!provinceId}
                      />
                      <label htmlFor="registration-city" className="mt-2 block text-sm font-medium text-zinc-700">
                        {t('auth.city')}
                        <select id="registration-city" required disabled={!provinceId} value={cityId} onChange={(event) => {
                          const nextId = event.target.value;
                          setCityId(nextId);
                          setZoneId('');
                          const selected = cities.find((item) => item.id === nextId);
                          setForm((current) => ({ ...current, city: nextId === '__other__' ? '' : selected?.name || '', zone: '' }));
                        }} className={locationSelectClass}>
                          <option value="">{t('auth.selectCity')}</option>
                          {cities.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                          {provinceId && <option value="__other__">{t('auth.otherLocation')}</option>}
                        </select>
                      </label>
                    </div>
                  )}
                </div>
                <div>
                  {zoneId === '__other__' ? (
                    <Input label={t('auth.zone')} value={form.zone} onChange={(event) => update('zone', event.target.value)} />
                  ) : (
                    <label htmlFor="registration-zone" className="block min-w-0 text-sm font-medium text-zinc-700">
                      {t('auth.zone')}
                      <select id="registration-zone" value={zoneId} onChange={(event) => {
                        const nextId = event.target.value;
                        setZoneId(nextId);
                        const selected = zones.find((item) => item.id === nextId);
                        setForm((current) => ({ ...current, zone: nextId === '__other__' ? '' : selected?.name || '' }));
                      }} className={locationSelectClass}>
                        <option value="">{zones.length ? t('auth.selectZone') : t('auth.noZones')}</option>
                        {zones.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                        <option value="__other__">{t('auth.otherLocation')}</option>
                      </select>
                    </label>
                  )}
                </div>
                <div>
                  <Input
                    label={t('auth.postalCodeOptional')}
                    value={form.postal_code}
                    onChange={(event) => update('postal_code', event.target.value)}
                    placeholder={t('auth.postalCode')}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    label={t('auth.addressOptional')}
                    value={form.address}
                    onChange={(event) => update('address', event.target.value)}
                    placeholder={t('auth.fullAddress')}
                    className="!text-base sm:!text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Contraseña */}
            <div className="pt-2 border-t border-zinc-200">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Input
                    label={t('auth.password')}
                    type="password"
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    placeholder={t('auth.minPassword')}
                    required
                  />
                </div>
                <div>
                  <Input
                    label={t('auth.confirmPassword')}
                    type="password"
                    value={form.confirm_password}
                    onChange={(e) => update('confirm_password', e.target.value)}
                    placeholder={t('auth.repeatPassword')}
                    required
                  />
                </div>
              </div>
            </div>

            <Button type="submit" fullWidth loading={loading} className="mt-2">
              {t('auth.createButton')}
            </Button>

            <p className="text-center text-xs text-zinc-500">
              {t('auth.agreePrefix')} <Link to="/terms" className="text-[#0066cc] underline underline-offset-2">{t('auth.terms')}</Link> {t('auth.agreeMiddle')} <Link to="/privacy" className="text-[#0066cc] underline underline-offset-2">{t('auth.privacy')}</Link>.
            </p>
          </form>
        </Card>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-zinc-500 hover:text-zinc-700 font-medium">
            {t('auth.hasAccount')}
          </Link>
        </div>
      </div>
    </div>
  );
}
