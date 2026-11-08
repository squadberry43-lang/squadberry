import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import api from '../services/api';
import { useLocale } from '../context/LocaleContext';

const roleKeys: Record<string, string> = {
  admin: 'dashboard.roleAdmin', supervisor: 'dashboard.roleSupervisor',
  technician: 'dashboard.roleTechnician', marketing: 'dashboard.roleMarketing', client: 'dashboard.roleClient',
};
const ticketStatusKeys: Record<string, string> = {
  open: 'dashboard.statusOpen', in_progress: 'dashboard.statusInProgress',
  closed: 'dashboard.statusClosed', pending_client: 'dashboard.statusPendingClient',
};

export function DashboardPage() {
  const { t } = useLocale();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const role = user?.role_name || user?.role_id?.replace('role_', '');
  const isTech = role === 'technician';
  const isSupervisor = role === 'supervisor';
  const isAdmin = role === 'admin';

  useEffect(() => {
    const load = async () => {
      try {
        const [s, t] = await Promise.all([
          api.getDashboard(),
          api.getTickets({ limit: 5, ...(isTech || isSupervisor ? { assigned: 'true' } : {}) }),
        ]);
        setStats(s);
        setRecentTickets(t.tickets || []);
      } catch (e: any) {
        setError(e.message || t('dashboard.loadError'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isTech, isSupervisor, t]);

  if (loading) {
    return (
      <div className="min-h-screen-safe bg-zinc-50 flex items-center justify-center">
        <div className="text-zinc-400 text-sm">{t('dashboard.loading')}</div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen-safe bg-zinc-50 flex items-center justify-center">
        <div className="text-crimson text-sm">{error}</div>
      </div>
    );
  }

  const statCards: { label: string; value: string | number; icon: string; color: string; href: string }[] = [];

  if (isAdmin || isSupervisor) {
    statCards.push(
      { label: t('dashboard.openTickets'), value: stats?.tickets?.open ?? 0, icon: '📋', color: 'text-sky-600 bg-sky-50 border-sky-200', href: '/tickets' },
      { label: t('dashboard.inRepair'), value: stats?.tickets?.in_progress ?? 0, icon: '🔧', color: 'text-citron-600 bg-citron-50 border-citron-200', href: '/tickets?status=in_progress' },
      { label: t('dashboard.awaitingEstimate'), value: stats?.tickets?.pending_client ?? 0, icon: '📝', color: 'text-poppy-600 bg-poppy-50 border-poppy-200', href: '/tickets?status=pending_client' },
      { label: t('dashboard.pendingPayments'), value: stats?.invoices_pending ?? 0, icon: '💳', color: 'text-crimson-600 bg-crimson-50 border-crimson-200', href: '/invoices?status=pending' },
    );
  }

  if (isTech) {
    statCards.push(
      { label: t('dashboard.assignedTickets'), value: stats?.tickets?.in_progress ?? 0, icon: '📋', color: 'text-sky-600 bg-sky-50 border-sky-200', href: '/tickets?assigned=true' },
      { label: t('dashboard.inRepair'), value: stats?.tickets?.in_progress ?? 0, icon: '🔧', color: 'text-citron-600 bg-citron-50 border-citron-200', href: '/tickets?status=in_progress&assigned=true' },
      { label: t('dashboard.visitsToday'), value: stats?.reservations_today ?? 0, icon: '📅', color: 'text-sky-700 bg-sky-50 border-sky-200', href: '/visits' },
      { label: t('dashboard.activeEstimates'), value: stats?.clients?.total ?? 0, icon: '📝', color: 'text-poppy-600 bg-poppy-50 border-poppy-200', href: '/budgets' },
    );
  }

  if (!isTech && !isSupervisor && !isAdmin) {
    statCards.push(
      { label: t('dashboard.myOpenTickets'), value: stats?.tickets?.open ?? 0, icon: '📋', color: 'text-sky-600 bg-sky-50 border-sky-200', href: '/tickets' },
      { label: t('dashboard.inRepair'), value: stats?.tickets?.in_progress ?? 0, icon: '🔧', color: 'text-citron-600 bg-citron-50 border-citron-200', href: '/tickets?status=in_progress' },
      { label: t('dashboard.pendingEstimates'), value: stats?.clients?.total ?? 0, icon: '📝', color: 'text-poppy-600 bg-poppy-50 border-poppy-200', href: '/budgets?status=pending' },
      { label: t('dashboard.pendingAccounts'), value: stats?.invoices_pending ?? 0, icon: '💳', color: 'text-crimson-600 bg-crimson-50 border-crimson-200', href: '/invoices?status=pending' },
    );
  }

  return (
    <div className="min-h-screen-safe bg-zinc-50">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">
              {t(isAdmin ? 'dashboard.admin' : isSupervisor ? 'dashboard.supervisor' : isTech ? 'dashboard.technician' : 'dashboard.mine')}
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              {user?.full_name || t('dashboard.user')} · {role ? (roleKeys[role] ? t(roleKeys[role]) : role.replace('_', ' ')) : t('dashboard.noRole')}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => navigate('/settings')}>
              {t('dashboard.settings')}
            </Button>
            <Button onClick={() => { api.logout(); navigate('/login'); }}>
              {t('dashboard.logout')}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card) => (
            <Link key={card.label} to={card.href} className="block">
              <div className="hover:border-zinc-300 transition-colors cursor-pointer p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">{card.label}</p>
                    <p className="mt-1 text-2xl font-semibold text-zinc-900">{card.value}</p>
                  </div>
                  <span className={`text-lg p-2 rounded-full border ${card.color}`}>{card.icon}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent tickets */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-900">{t('dashboard.recent')}</h2>
            <Link to="/tickets">
              <Button variant="ghost" size="sm">
                {t('dashboard.viewAll')}
              </Button>
            </Link>
          </div>
          {recentTickets.length === 0 ? (
            <p className="text-zinc-400 text-sm py-4 text-center">{t('dashboard.noRecent')}</p>
          ) : (
            <div className="space-y-2">
              {recentTickets.map((ticket: any) => (
                <Link key={ticket.id} to={`/tickets/${ticket.id}`} className="block p-3 rounded-[2.5rem] bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{ticket.title || t('dashboard.noSubject')}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {t(ticket.client_id ? 'dashboard.client' : 'dashboard.noClient')} · {t(ticket.service_id ? 'dashboard.service' : 'dashboard.noService')}
                      </p>
                    </div>
                    <span className={`text-xs px-2 rounded-full ${ticket.status === 'closed' ? 'bg-green-100 text-green-800' : ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                      {t(ticketStatusKeys[ticket.status] || 'dashboard.unknown')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
