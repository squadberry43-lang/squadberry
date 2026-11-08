import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useHasAccess, useIsAdmin } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button, ButtonLink } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { toast } from '../components/ui/Toast';
import api from '../services/api';
import { useLocale } from '../context/LocaleContext';

const VISIT_STATUS_KEYS: Record<string, string> = {
  scheduled: 'visit.scheduled', confirmed: 'visit.confirmed', in_progress: 'visit.inProgress',
  completed: 'visit.completed', cancelled: 'visit.cancelled',
};

function visitStatusOptions(t: (key: string) => string) {
  return Object.entries(VISIT_STATUS_KEYS).map(([value, key]) => ({ value, label: t(key) }));
}

export function VisitPage() {
  const { id } = useParams<{ id: string }>();
  const isAdmin = useIsAdmin();
  const canCoordinate = useHasAccess('admin', 'supervisor');
  const { locale, t } = useLocale();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [visit, setVisit] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.getVisit(id);
        setVisit(res);
      } catch (e: any) {
        setError(e.message || t('visit.loadError'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, t]);

  const handleStatusChange = async (status: string) => {
    setSaving(true);
    try {
      const res = await api.updateVisit(id!, { status } as any);
      setVisit(res);
      toast(`${t('visit.status')}: ${t(VISIT_STATUS_KEYS[status] || 'visit.unknown')}`, 'success');
    } catch (e: any) {
      toast(e.message || t('visit.updateError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen-safe bg-zinc-50 flex items-center justify-center">
        <div className="text-zinc-400 text-sm">{t('visit.loading')}</div>
      </div>
    );
  }

  if (error && !visit) {
    return (
      <div className="min-h-screen-safe bg-zinc-50 flex items-center justify-center">
        <div className="text-crimson text-sm">{error}</div>
      </div>
    );
  }

  if (!visit) return null;

  return (
    <div className="min-h-screen-safe bg-zinc-50">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Badge variant={
              visit.status === 'completed' ? 'success' :
              visit.status === 'cancelled' ? 'danger' :
              visit.status === 'in_progress' ? 'warning' :
              visit.status === 'confirmed' ? 'info' :
              'default'
            }>
              {t(VISIT_STATUS_KEYS[visit.status] || 'visit.unknown')}
            </Badge>
            <span className="text-sm text-zinc-400 font-mono">#{visit.id?.slice(-8) || visit.id}</span>
            <Link to="/visits" className="text-zinc-400 hover:text-zinc-600 text-sm ml-2">
              ← {t('visit.back')}
            </Link>
            {canCoordinate && <Link to={`/equipo?visit=${visit.id}`} className="text-sm font-medium text-[#0066cc] hover:underline">{t('visit.createTask')}</Link>}
          </div>
          {isAdmin && visit.status !== 'cancelled' && visit.status !== 'completed' && (
            <Select
              label={t('visit.status')}
              value={visit.status}
              onChange={(val) => handleStatusChange(val)}
              options={visitStatusOptions(t)}
            />
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mb-6">
          <Card padding="md">
            <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">{t('visit.date')}</p>
            <p className="text-zinc-900 font-medium">
              {visit.date ? new Date(visit.date).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}
            </p>
          </Card>
          <Card padding="md">
            <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">{t('visit.client')}</p>
            <p className="text-zinc-900 font-medium">{visit.client?.full_name || visit.client_name || 'N/A'}</p>
            {visit.client?.phone && <p className="text-sm text-zinc-500 mt-1">{visit.client.phone}</p>}
            {visit.client?.email && <p className="text-sm text-zinc-500 mt-1">{visit.client.email}</p>}
          </Card>
          <Card padding="md">
            <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">{t('visit.type')}</p>
            <p className="text-zinc-900 font-medium">{t(visit.visit_type === 'enterprise' ? 'visit.enterprise' : 'visit.home')}</p>
            {visit.address && (
              <p className="text-sm text-zinc-500 mt-1">{visit.address}</p>
            )}
            {visit.city && (
              <p className="text-sm text-zinc-500">{visit.city}, {visit.province} {visit.postal_code ? ('(' + visit.postal_code + ')') : ''}</p>
            )}
          </Card>
          <Card padding="md">
            <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">{t('visit.technician')}</p>
            <p className="text-zinc-900 font-medium">{visit.technician?.full_name || visit.technician_name || t('visit.unassigned')}</p>
            {visit.technician?.phone && (<p className="text-sm text-zinc-500 mt-1">{visit.technician.phone}</p>) }
          </Card>
        </div>

        {visit.ticket_id && (
          <Card padding="md" className="mb-6">
            <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">{t('visit.ticket')}</p>
            <Link to={`/tickets/${visit.ticket_id}`} className="text-iris hover:underline font-medium">
              #{visit.ticket_id?.slice(-8) || visit.ticket_id}
            </Link>
          </Card>
        )}

        {visit.notes && (
          <Card padding="lg" className="mb-6">
            <h2 className="text-base font-semibold text-zinc-900 mb-3">{t('visit.notes')}</h2>
            <p className="text-zinc-700 whitespace-pre-wrap">{visit.notes}</p>
          </Card>
        )}

        <div className="flex gap-3">
          {visit.status !== 'completed' && visit.status !== 'cancelled' && (
            <ButtonLink variant="ghost" size="sm" to={`/visits/${id}/complete`}>
              {t('visit.markComplete')}
            </ButtonLink>
          )}
          {visit.status !== 'cancelled' && (
            <Button variant="danger" onClick={() => handleStatusChange('cancelled')} loading={saving}>
              {t('visit.cancel')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function VisitListPage() {
  const isAdmin = useIsAdmin();
  const { locale, t } = useLocale();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [visits, setVisits] = useState<any[]>([]);

  const status = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        if (page > 1) params.set('page', String(page));
        params.set('limit', '20');
        const res = await api.getVisits(Object.fromEntries(params));
        setVisits(res || []);
      } catch (e: any) {
        setError(e.message || t('visit.loadError'));
        setVisits([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [status, page, t]);

  return (
    <div className="min-h-screen-safe bg-zinc-50">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">{t('visit.title')}</h1>
            <p className="text-zinc-500 text-sm mt-1">
              {t(isAdmin ? 'visit.all' : 'visit.mine')}
            </p>
          </div>
        </div>

        {error && <div className="mb-4 p-3 rounded-[2.5rem] bg-crimson/10 text-crimson text-sm">{error}</div>}

        {loading ? (
          <div className="text-center py-12 text-zinc-400 text-sm">{t('visit.loadingList')}</div>
        ) : visits.length === 0 ? (
          <Card padding="lg" className="text-center">
            <p className="text-zinc-400">{t('visit.empty')}</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {visits.map((v) => (
              <Card key={v.id} padding="md" className="hover:border-zinc-300 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        v.status === 'completed' ? 'success' :
                        v.status === 'cancelled' ? 'danger' :
                        v.status === 'in_progress' ? 'warning' :
                        v.status === 'confirmed' ? 'info' :
                        'default'
                      }>
                        {t(VISIT_STATUS_KEYS[v.status] || 'visit.unknown')}
                      </Badge>
                      <span className="text-sm font-mono text-zinc-400">#{v.id?.slice(-8)}</span>
                    </div>
                    <p className="text-sm font-medium text-zinc-900 mt-2">
                      {v.client?.full_name || v.client_name}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {v.date ? new Date(v.date).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' }) : ''}
                      {v.visit_time ? ` · ${v.visit_time}` : ''}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {t(v.visit_type === 'enterprise' ? 'visit.enterpriseShort' : 'visit.homeShort')} · {v.address || v.city}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" to={`/visits/${v.id}`}>
                      {t('visit.view')}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
