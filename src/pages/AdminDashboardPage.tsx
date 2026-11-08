import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { AdminRecent } from '../services/api';
import { BrandMark } from '../components/brand/BrandMark';
import { Download } from 'lucide-react';
import { DataQaStatus } from '../components/admin/DataQaStatus';

interface DashboardData {
  clients: { total: number };
  tickets: {
    open: number;
    in_progress: number;
    closed: number;
    total: number;
  };
  reservations_today: number;
  invoices_pending: number;
}

interface InstallMetrics {
  total: number;
  last_30_days: number;
  by_device: Array<{ device_type: string; installations: number }>;
  by_country: Array<{ country_code: string; locale: string; installations: number }>;
  daily: Array<{ day: string; installations: number }>;
}

export function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [installMetrics, setInstallMetrics] = useState<InstallMetrics | null>(null);
  const [recent, setRecent] = useState<AdminRecent | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [data, installations, recentData] = await Promise.all([
        api.getDashboard(),
        api.getInstallMetrics(),
        api.getAdminRecent(),
      ]);
      setDashData(data);
      setInstallMetrics(installations);
      setRecent(recentData);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error al cargar datos');
      setLoading(false);
    }
  };

  const exportInstallMetrics = () => {
    if (!installMetrics) return;
    const rows = [
      ['tipo', 'clave', 'instalaciones'],
      ...installMetrics.by_device.map((item) => ['dispositivo', item.device_type, String(item.installations)]),
      ...installMetrics.by_country.map((item) => ['pais', item.country_code, String(item.installations)]),
      ...installMetrics.daily.map((item) => ['dia', item.day, String(item.installations)]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }));
    link.download = `doctor-tech-instalaciones-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  if (loading) {
    return (
      <div className="min-h-screen-safe flex items-center justify-center bg-zinc-50">
        <div className="text-center">
          <BrandMark compact className="mb-4 justify-center animate-pulse" />
          <p className="text-zinc-500 text-sm">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen-safe bg-zinc-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-900">Dashboard de Administración</h1>
          <p className="text-zinc-500 text-sm mt-1">Vista general del sistema Doctor Tech</p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-[2.5rem] bg-crimson/10 text-crimson text-sm border border-crimson/20">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[{ title: 'Tickets abiertos', value: dashData?.tickets.open || 0, subtitle: 'Requieren atención', icon: (<><path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 0 0-2 2v3a2 2 0 1 1 0 4v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5z" /></>), highlight: true },
          { title: 'En progreso', value: dashData?.tickets.in_progress || 0, subtitle: 'Asignados y trabajando', icon: (<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>) },
          { title: 'Reservas hoy', value: dashData?.reservations_today || 0, subtitle: 'Visitas programadas', icon: (<><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>) },
          { title: 'Facturas pendientes', value: dashData?.invoices_pending || 0, subtitle: 'Pendientes de pago', icon: (<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 16 8 22 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></>) }].map((card, i) => (
            <div key={i} className="text-center p-4">
              <div className="w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {card.icon}
                </svg>
              </div>
              <p className="text-2xl font-bold text-zinc-900 font-mono">{card.value}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{card.subtitle}</p>
            </div>
          ))}
        </div>

        <DataQaStatus />

        <section className="mb-8 border-y border-zinc-200 py-6" aria-labelledby="install-metrics-title">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="install-metrics-title" className="text-base font-semibold text-zinc-900">Instalaciones de la aplicación</h2>
              <p className="mt-1 text-sm text-zinc-500">Métrica privada visible solo para administración.</p>
            </div>
            <div className="flex items-end gap-5">
              <div className="flex gap-6 text-right">
                <div><p className="text-2xl font-semibold text-zinc-900">{installMetrics?.total ?? 0}</p><p className="text-xs text-zinc-500">Total</p></div>
                <div><p className="text-2xl font-semibold text-zinc-900">{installMetrics?.last_30_days ?? 0}</p><p className="text-xs text-zinc-500">Últimos 30 días</p></div>
              </div>
              <button type="button" onClick={exportInstallMetrics} className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50" title="Exportar métricas">
                <Download size={14} /> Exportar CSV
              </button>
            </div>
          </div>
          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-zinc-500">Por dispositivo</p>
              <div className="mt-3 space-y-2">
                {(installMetrics?.by_device || []).map((item) => {
                  const maximum = Math.max(...(installMetrics?.by_device || []).map((entry) => entry.installations), 1);
                  return <div key={item.device_type} className="flex items-center gap-3 text-xs"><span className="w-16 text-zinc-600">{item.device_type}</span><div className="h-2 flex-1 rounded-full bg-zinc-100"><div className="h-2 rounded-full bg-[#0071e3]" style={{ width: `${(item.installations / maximum) * 100}%` }} /></div><strong className="w-6 text-right text-zinc-800">{item.installations}</strong></div>;
                })}
                {!installMetrics?.by_device.length && <p className="text-sm text-zinc-500">Todavía no hay instalaciones registradas.</p>}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-zinc-500">Últimos 30 días</p>
              <div className="mt-3 flex h-20 items-end gap-1 border-b border-zinc-200 px-1">
                {(installMetrics?.daily || []).map((item) => {
                  const maximum = Math.max(...(installMetrics?.daily || []).map((entry) => entry.installations), 1);
                  return <div key={item.day} className="flex h-full flex-1 items-end" title={`${item.day}: ${item.installations}`}><div className="w-full min-w-[3px] rounded-t bg-[#0071e3]" style={{ height: `${Math.max((item.installations / maximum) * 100, 6)}%` }} /></div>;
                })}
              </div>
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-zinc-900">Clientes recientes</h2>
            <div className="flex items-center justify-between">
              <Link to="/clients" className="text-sm text-iris hover:text-iris/80 font-medium">
                Ver todos
              </Link>
            </div>
            <div className="divide-y divide-zinc-200 border-t border-zinc-200">
              {(recent?.clients || []).map((client) => (
                <Link key={client.id} to="/clients" className="flex items-center justify-between gap-4 py-3 hover:text-[#0071e3]">
                  <div><p className="text-sm font-medium">{client.name}</p><p className="text-xs text-zinc-500">{client.email}</p></div>
                  <span className="text-xs text-zinc-500">{client.city || 'Sin ciudad'}</span>
                </Link>
              ))}
              {!recent?.clients.length && <p className="py-4 text-sm text-zinc-500">Aún no hay clientes registrados.</p>}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-base font-semibold text-zinc-900">Tickets abiertos</h2>
            <div className="flex items-center justify-between">
              <Link to="/tickets" className="text-sm text-iris hover:text-iris/80 font-medium">
                Ver todos
              </Link>
            </div>
            <div className="divide-y divide-zinc-200 border-t border-zinc-200">
              {(recent?.tickets || []).map((ticket) => (
                <Link key={ticket.id} to={`/tickets/${ticket.id}`} className="flex items-center justify-between gap-4 py-3 hover:text-[#0071e3]">
                  <div><p className="text-sm font-medium">{ticket.title}</p><p className="text-xs text-zinc-500">{ticket.customer_name}</p></div>
                  <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-600">{ticket.status.replace('_', ' ')}</span>
                </Link>
              ))}
              {!recent?.tickets.length && <p className="py-4 text-sm text-zinc-500">No hay tickets abiertos.</p>}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-base font-semibold text-zinc-900">Empresas</h2>
            <div className="flex items-center justify-between">
              <Link to="/clients?type=enterprise" className="text-sm text-iris hover:text-iris/80 font-medium">
                Ver todas
              </Link>
            </div>
            <div className="divide-y divide-zinc-200 border-t border-zinc-200">
              {(recent?.enterprises || []).map((enterprise) => (
                <Link key={enterprise.id} to="/enterprises" className="flex items-center justify-between gap-4 py-3 hover:text-[#0071e3]">
                  <div><p className="text-sm font-medium">{enterprise.name}</p><p className="text-xs text-zinc-500">{enterprise.contact_name}</p></div>
                  <span className="text-xs text-zinc-500">{enterprise.city || 'Sin ciudad'}</span>
                </Link>
              ))}
              {!recent?.enterprises.length && <p className="py-4 text-sm text-zinc-500">Aún no hay empresas registradas.</p>}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-base font-semibold text-zinc-900 mb-4">Estado del sistema</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-[2.5rem] bg-green-50 border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-sprout animate-pulse" />
                  <span className="text-sm font-medium text-green-700">Base de datos</span>
                </div>
                <span className="text-xs text-green-600 font-mono">Conectado</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-[2.5rem] bg-zinc-50 border border-zinc-200">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-zinc-400" />
                  <span className="text-sm font-medium text-zinc-700">Backend</span>
                </div>
                <span className="text-xs text-zinc-500 font-mono">En ejecución</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-[2.5rem] bg-zinc-50 border border-zinc-200">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-zinc-400" />
                  <span className="text-sm font-medium text-zinc-700">Frontend</span>
                </div>
                <span className="text-xs text-zinc-500 font-mono">Servido por Vite</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
