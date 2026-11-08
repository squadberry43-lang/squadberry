import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button, ButtonLink } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { toast } from '../components/ui/Toast';
import api from '../services/api';
import type { Repair } from '../services/api';
import { useLocale } from '../context/LocaleContext';

const STATUS_KEYS: Record<Repair['status'], string> = {
  pending: 'repair.pending', diagnosed: 'repair.diagnosed', in_repair: 'repair.inRepair',
  ready: 'repair.ready', delivered: 'repair.delivered', closed: 'repair.closed',
};

const DEVICE_KEYS: Record<string, string> = {
  phone: 'repair.phone', tablet: 'repair.tablet', laptop: 'repair.laptop',
  desktop: 'repair.desktop', peripheral: 'repair.peripheral', other: 'repair.other',
};

const NEXT_STATUS: Partial<Record<Repair['status'], Repair['status']>> = {
  pending: 'diagnosed',
  diagnosed: 'in_repair',
  in_repair: 'ready',
  ready: 'delivered',
  delivered: 'closed',
};

const STATUS_VARIANT: Record<Repair['status'], 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  pending: 'default',
  diagnosed: 'info',
  in_repair: 'warning',
  ready: 'success',
  delivered: 'neutral',
  closed: 'default',
};

function money(value?: number | null) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function RepairsPage() {
  const { t } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    device_type: searchParams.get('device_type') || '',
    search: searchParams.get('search') || '',
  });

  const query = useMemo(() => {
    const params: { status?: string; device_type?: string; search?: string } = {};
    if (filters.status) params.status = filters.status;
    if (filters.device_type) params.device_type = filters.device_type;
    if (filters.search) params.search = filters.search;
    return params;
  }, [filters]);

  const loadRepairs = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getRepairs(query);
      setRepairs(data || []);
    } catch (err: any) {
      setError(err.message || t('repair.loadError'));
      setRepairs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRepairs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const updateFilter = (key: keyof typeof filters, value: string) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    setSearchParams(Object.fromEntries(Object.entries(next).filter(([, v]) => v)));
  };

  const advanceStatus = async (repair: Repair) => {
    const nextStatus = NEXT_STATUS[repair.status];
    if (!nextStatus) return;

    setSavingId(repair.id);
    try {
      const updated = await api.updateRepairStatus(repair.id, nextStatus);
      setRepairs((items) => items.map((item) => item.id === updated.id ? updated : item));
      toast(`${t('repair.title')}: ${t(STATUS_KEYS[nextStatus])}`, 'success');
    } catch (err: any) {
      toast(err.message || t('repair.updateError'), 'error');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen-safe bg-zinc-50">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">{t('repair.title')}</h1>
            <p className="text-zinc-500 text-sm mt-1">{t('repair.lead')}</p>
          </div>
          <Button variant="secondary" onClick={loadRepairs} loading={loading}>
            {t('repair.refresh')}
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-[2.5rem] bg-crimson/10 text-crimson text-sm border border-crimson/20">
            {error}
          </div>
        )}

        <Card padding="md" className="mb-6">
          <div className="grid gap-3 md:grid-cols-[1fr_220px_220px] md:items-end">
            <Input
              label={t('repair.search')}
              placeholder={t('repair.searchHint')}
              value={filters.search}
              onChange={(event) => updateFilter('search', event.target.value)}
            />
            <Select
              label={t('repair.status')}
              value={filters.status}
              onChange={(value) => updateFilter('status', value)}
              options={[{ value: '', label: t('repair.all') }, ...Object.entries(STATUS_KEYS).map(([value, key]) => ({ value, label: t(key) }))]}
            />
            <Select
              label={t('repair.deviceFilter')}
              value={filters.device_type}
              onChange={(value) => updateFilter('device_type', value)}
              options={[{ value: '', label: t('repair.all') }, ...Object.entries(DEVICE_KEYS).map(([value, key]) => ({ value, label: t(key) }))]}
            />
          </div>
        </Card>

        {loading ? (
          <div className="text-center py-12 text-zinc-400 text-sm">{t('repair.loading')}</div>
        ) : repairs.length === 0 ? (
          <Card padding="lg" className="text-center">
            <p className="text-zinc-400">{t('repair.empty')}</p>
          </Card>
        ) : (
          <Card padding="none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('repair.device')}</TableHead>
                  <TableHead>{t('repair.client')}</TableHead>
                  <TableHead>{t('repair.problem')}</TableHead>
                  <TableHead>{t('repair.status')}</TableHead>
                  <TableHead>{t('repair.cost')}</TableHead>
                  <TableHead>{t('repair.created')}</TableHead>
                  <TableHead className="w-[170px]"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repairs.map((repair) => {
                  const nextStatus = NEXT_STATUS[repair.status];
                  return (
                    <TableRow key={repair.id}>
                      <TableCell>
                        <p className="font-medium text-zinc-900">
                          {[repair.device_brand, repair.device_model].filter(Boolean).join(' ') || t(DEVICE_KEYS[repair.device_type] || 'repair.other')}
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {repair.serial_number || repair.ticket_title || repair.ticket_id || t('repair.noReference')}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-zinc-800">{repair.client_full_name || repair.enterprise_name || '-'}</p>
                        {repair.client_email && <p className="text-xs text-zinc-400">{repair.client_email}</p>}
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        <p className="text-sm text-zinc-700 line-clamp-2">{repair.problem_description}</p>
                        {repair.diagnosis && <p className="text-xs text-zinc-400 mt-1 line-clamp-1">{repair.diagnosis}</p>}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[repair.status]}>{t(STATUS_KEYS[repair.status])}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-zinc-900">{money(repair.total_cost)}</p>
                        <p className="text-xs text-zinc-400">{t('repair.parts')} {money(repair.parts_cost)}</p>
                      </TableCell>
                      <TableCell>{repair.created_at?.split('T')[0] || '-'}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {repair.ticket_id && (
                            <ButtonLink variant="ghost" size="sm" to={`/tickets/${repair.ticket_id}`}>
                              {t('repair.ticket')}
                            </ButtonLink>
                          )}
                          {nextStatus && (
                            <Button
                              variant="secondary"
                              size="sm"
                              loading={savingId === repair.id}
                              onClick={() => advanceStatus(repair)}
                            >
                              {t(STATUS_KEYS[nextStatus])}
                            </Button>
                          )}
                          {!nextStatus && <span className="text-xs text-zinc-400 py-2">{t('repair.finished')}</span>}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}

        <div className="mt-4">
          <Link to="/tickets" className="text-sm text-iris hover:text-iris/80 font-medium">
            {t('repair.back')}
          </Link>
        </div>
      </div>
    </div>
  );
}
