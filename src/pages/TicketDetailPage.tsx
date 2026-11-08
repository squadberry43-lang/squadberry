import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import api from '../services/api';
import type { Ticket } from '../services/api';
import { useLocale } from '../context/LocaleContext';
import { RemoteSupportPanel } from '../components/RemoteSupportPanel';
import { TicketConversation } from '../components/TicketConversation';

export function TicketDetailPage() {
  const { t, locale } = useLocale();
  const { id: ticketId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const role = user?.role_name || user?.role_id?.replace('role_', '');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ticket, setTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    if (!ticketId) {
      navigate('/tickets');
      return;
    }
    loadTicket();
  }, [ticketId, navigate]);

  const loadTicket = async () => {
    setLoading(true);
    try {
      const data = await api.getTicket(ticketId!);
      setTicket(data);
      setLoading(false);
    } catch (err: any) {
      setError(t('tickets.loadError'));
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen-safe bg-zinc-50 flex items-center justify-center">
        <p className="text-zinc-400 text-sm">{t('tickets.loadingOne')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen-safe bg-zinc-50 flex items-center justify-center">
        <p className="text-crimson text-sm">{error}</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen-safe bg-zinc-50 flex items-center justify-center">
        <p className="text-zinc-500 text-sm">{t('tickets.notFound')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen-safe bg-zinc-50">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Ticket #{ticket.id.slice(0, 8)}...</h1>
            <p className="text-zinc-500 text-sm mt-1">
              {user?.full_name || t('tickets.user')} · {role && ['admin', 'supervisor', 'technician', 'client', 'enterprise', 'marketing', 'particular', 'empresa'].includes(role) ? t(`tickets.role.${role}`) : t('tickets.noRole')}
            </p>
          </div>
          <div className="flex gap-3">
            {(role === 'admin' || role === 'supervisor') && <Link to={`/equipo?ticket=${ticket.id}`} className="text-sm font-medium text-[#0066cc] hover:underline">{t('tickets.createTask')}</Link>}
            <Link to="/tickets" className="text-sm text-iris hover:text-iris/80 font-medium">
              ← {t('tickets.back')}
            </Link>
            <Button variant="secondary" onClick={() => window.print()}>
              {t('tickets.print')}
            </Button>
          </div>
        </div>

        {/* Ticket info */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-zinc-900 mb-4">{ticket.title}</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">{t('tickets.clientId')}</p>
                <p className="mt-1 text-zinc-800">{ticket.client_id}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">{t('tickets.service')}</p>
                <p className="mt-1 text-zinc-800">{ticket.service_id}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">{t('tickets.priority')}</p>
                <p className="mt-1 text-zinc-800">{t(`tickets.${ticket.priority}`)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">{t('tickets.status')}</p>
                <Badge
                  variant={
                    ticket.status === 'open'
                      ? 'warning'
                      : ticket.status === 'in_progress'
                      ? 'info'
                      : ticket.status === 'pending_client'
                      ? 'neutral'
                      : ticket.status === 'resolved'
                      ? 'success'
                      : 'danger'
                  }
                >
                  {t(`tickets.${['open', 'in_progress', 'pending_client', 'resolved', 'closed'].includes(ticket.status) ? ticket.status : 'unknown'}`)}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">{t('tickets.scheduled')}</p>
                <p className="mt-1 text-zinc-800">
                  {ticket.scheduled_date
                    ? new Date(ticket.scheduled_date).toLocaleDateString(locale)
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">{t('tickets.address')}</p>
                <p className="mt-1 text-zinc-800 line-clamp-2">
                  {ticket.address || '-'}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold text-zinc-900 mb-3">{t('tickets.description')}</h3>
              <p className="text-zinc-700">{ticket.description}</p>
            </div>

            {ticket.diagnosis_notes && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-zinc-900 mb-3">{t('tickets.diagnosis')}</h3>
                <p className="text-zinc-700">{ticket.diagnosis_notes}</p>
              </div>
            )}

            {ticket.resolution && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-zinc-900 mb-3">{t('tickets.resolution')}</h3>
                <p className="text-zinc-700">{ticket.resolution}</p>
              </div>
            )}
          </Card>
          <RemoteSupportPanel ticketId={ticket.id} customer={false} />
          <TicketConversation ticketId={ticket.id} />
        </div>
      </div>
    </div>
  );
}
