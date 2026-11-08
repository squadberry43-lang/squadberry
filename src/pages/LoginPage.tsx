import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { BrandMark } from '../components/brand/BrandMark';
import { useLocale } from '../context/LocaleContext';

export function LoginPage() {
  const { login } = useAuth();
  const { t, locale } = useLocale();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) {
      setError(locale.startsWith('es') ? (result.message || t('auth.loginError')) : t('auth.loginError'));
    } else {
      const incident = searchParams.get('incident');
      navigate(incident ? `/tickets/new?incident=${encodeURIComponent(incident)}` : '/');
    }
  };

  return (
    <div className="min-h-screen-safe flex items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <BrandMark className="mb-4" />
          <h1 className="text-2xl font-semibold text-zinc-900 mb-2">{t('auth.welcome')}</h1>
          <p className="text-zinc-500 text-sm">{t('auth.loginLead')}</p>
        </div>

        <div className="card p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-[2.5rem] bg-crimson/10 text-crimson text-sm border border-crimson/20">
                {error}
              </div>
            )}

            <div>
              <Input
                label={t('auth.email')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>

            <div>
              <Input
                label={t('auth.password')}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.password')}
                required
              />
            </div>

            <Button type="submit" fullWidth loading={loading}>
              {t('auth.signIn')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-zinc-500">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-iris hover:text-iris/80 font-medium">
              {t('auth.registerLink')}
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
