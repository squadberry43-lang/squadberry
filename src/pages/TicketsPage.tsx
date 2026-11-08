import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useIsTechnician, useIsSupervisor, useIsAdmin } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Button, ButtonLink } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal, ModalSection } from '../components/ui/Modal';
import api from '../services/api';
import { useLocale } from '../context/LocaleContext';

const STATUS_VALUES = ['', 'open', 'in_progress', 'pending_client', 'resolved', 'closed'];

export function TicketsPage() {
  const { t, locale } = useLocale();
  const isTech = useIsTechnician();
  const isSupervisor = useIsSupervisor();
  const isAdmin = useIsAdmin();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tickets, setTickets] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [showNew, setShowNew] = useState(false);
  const [newTicket, setNewTicket] = useState({ title: '', description: '', category: 'hardware', device: '' });
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    search: searchParams.get('search') || '',
    assigned: isTech ? '1' : '',
  });

  const page = parseInt(searchParams.get('page') || '1');
  const status = searchParams.get('status') || filters.status;

  const loadTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const paramsObj: any = {};
      if (status) paramsObj.status = status;
      if (filters.search) paramsObj.search = filters.search;
      if (filters.assigned) paramsObj.assigned = filters.assigned;
      if (page > 1) paramsObj.page = String(page);
      paramsObj.limit = '20';
      const res = await api.getTickets(paramsObj);
      setTickets(res.tickets || []);
      setTotal(res.total || res.tickets?.length || 0);
    } catch (e: any) {
      setError(t('tickets.loadError'));
      setTickets([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, filters.search, filters.assigned, page]);

  const StatusBadge = ({ status }: { status?: string }) => {
    if (!status) return <Badge variant="default">{t('tickets.unknown')}</Badge>;
    const map: Record<string, any> = {
      open: 'success',
      in_progress: 'warning',
      pending_client: 'info',
      resolved: 'success',
      closed: 'default',
    };
    return <Badge variant={map[status] || 'default'}>{t(`tickets.${map[status] ? status : 'unknown'}`)}</Badge>;
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: any = {
        title: newTicket.title,
        description: newTicket.description,
        category: newTicket.category,
        device_model: newTicket.device || undefined,
      };
      const created = await api.createTicket(payload);
      setShowNew(false);
      setNewTicket({ title: '', description: '', category: 'hardware', device: '' });
      navigate(`/tickets/${created.id}`);
    } catch (e: any) {
      setError(t('tickets.createError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen-safe bg-zinc-50">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">{t('tickets.title')}</h1>
            <p className="text-zinc-500 text-sm mt-1">
              {t(isAdmin ? 'tickets.adminLead' : isSupervisor ? 'tickets.supervisorLead' : isTech ? 'tickets.techLead' : 'tickets.userLead')}
            </p>
          </div>
          <Button onClick={() => setShowNew(true)}>+ {t('tickets.new')}</Button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-[2.5rem] bg-crimson/10 text-crimson text-sm border border-crimson/20">
            {error}
          </div>
        )}

        {/* Filtros */}
        <Card padding="md" className="mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[160px]">
              <Input
                placeholder={t('tickets.search')}
                aria-label={t('tickets.search')}
                value={filters.search}
                onChange={(e) => {
                  const v = e.target.value;
                  setFilters(f => ({ ...f, search: v }));
                  setSearchParams({ status, search: v, page: '1' });
                }}
                className="w-full"
              />
            </div>
            <Select
              label={t('tickets.status')}
              value={filters.status}
              onChange={(val) => {
                setFilters(f => ({ ...f, status: val }));
                setSearchParams({ status: val, search: filters.search, page: '1' });
              }}
              options={STATUS_VALUES.map((value) => ({ value, label: t(`tickets.${value || 'all'}`) }))}
            />
            {isTech && (
              <Select
                label={t('tickets.visibility')}
                value={filters.assigned}
                onChange={(val) => {
                  setFilters(f => ({ ...f, assigned: val }));
                  setSearchParams({ status, search: filters.search, assigned: val, page: '1' });
                }}
                options={[
                  { value: '', label: t('tickets.allTickets') },
                  { value: '1', label: t('tickets.assignedOnly') },
                ]}
              />
            )}
          </div>
        </Card>

        {loading ? (
          <div className="text-center py-12 text-zinc-400 text-sm">{t('tickets.loading')}</div>
        ) : tickets.length === 0 ? (
          <Card padding="lg" className="text-center">
            <p className="text-zinc-400 mb-3">{t('tickets.empty')}</p>
            <Button variant="secondary" onClick={() => setShowNew(true)}>{t('tickets.first')}</Button>
          </Card>
        ) : (
          <Card padding="none">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>{t('tickets.subject')}</TableHead>
                  <TableHead>{t('tickets.client')}</TableHead>
                  <TableHead>{t('tickets.service')}</TableHead>
                  <TableHead>{t('tickets.status')}</TableHead>
                  <TableHead>{t('tickets.technician')}</TableHead>
                  <TableHead>{t('tickets.created')}</TableHead>
                  <TableHead className="w-[80px]"> </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-xs">#{ticket.id?.slice(-8) || ticket.id}</TableCell>
                    <TableCell>
                      <Link to={`/tickets/${ticket.id}`} className="text-zinc-900 hover:text-iris font-medium">
                        {ticket.title || ticket.subject || t('tickets.noSubject')}
                      </Link>
                      {ticket.service_name && (
                        <span className="block text-xs text-zinc-400 mt-0.5">{ticket.service_name}</span>
                      )}
                    </TableCell>
                    <TableCell>{ticket.client_name || ticket.client?.full_name || '-'}</TableCell>
                    <TableCell>{ticket.service_name || '-'}</TableCell>
                    <TableCell><StatusBadge status={ticket.status} /></TableCell>
                    <TableCell>{ticket.technician_name || ticket.assigned_technician?.full_name || '-'}</TableCell>
                    <TableCell>{ticket.created_at ? new Date(ticket.created_at).toLocaleDateString(locale) : '-'}</TableCell>
                    <TableCell>
                      <ButtonLink variant="ghost" size="sm" to={`/tickets/${ticket.id}`}>
                        {t('tickets.openAction')}
                      </ButtonLink>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {/* Pagination */}
            {total > 20 && (
              <div className="flex items-center justify-between mt-4 p-4">
                <p className="text-xs text-zinc-400">
                  {t('tickets.showing')} {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} {t('tickets.of')} {total}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: String(page - 1) })}
                  >
                    ← {t('tickets.previous')}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page * 20 >= total}
                    onClick={() => setSearchParams({ ...Object.fromEntries(searchParams), page: String(page + 1) })}
                  >
                    {t('tickets.next')} →
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Nuevo ticket modal */}
        <Modal open={showNew} onClose={() => setShowNew(false)} title={t('tickets.new')}>
          <ModalSection className="space-y-4">
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <Input
                label={t('tickets.subject')}
                placeholder={t('tickets.subjectHint')}
                required
                value={newTicket.title}
                onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
              />
              <Input
                label={t('tickets.description')}
                placeholder={t('tickets.descriptionHint')}
                required
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
              />
              <Select
                label={t('tickets.category')}
                value={newTicket.category}
                onChange={(value) => setNewTicket({ ...newTicket, category: value })}
                options={[
                  { value: 'hardware', label: t('tickets.hardware') },
                  { value: 'software', label: t('tickets.software') },
                  { value: 'network', label: t('tickets.network') },
                  { value: 'security', label: t('tickets.security') },
                  { value: 'data', label: t('tickets.data') },
                  { value: 'other', label: t('tickets.other') },
                ]}
              />
              <Input
                label={t('tickets.device')}
                placeholder={t('tickets.deviceHint')}
                value={newTicket.device}
                onChange={(e) => setNewTicket({ ...newTicket, device: e.target.value })}
              />
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" onClick={() => setShowNew(false)} type="button">{t('tickets.cancel')}</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? t('tickets.creating') : t('tickets.create')}
                </Button>
              </div>
            </form>
          </ModalSection>
        </Modal>
      </div>
    </div>
  );
}
