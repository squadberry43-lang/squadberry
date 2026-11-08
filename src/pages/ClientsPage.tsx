import { useState, useEffect } from 'react';
import { Table } from '../components/ui/Table';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import api from '../services/api';
import { toast } from '../components/ui/Toast';
import { useAuth } from '../context/AuthContext';
import { ProspectContactHistory } from '../components/prospects/ProspectContactHistory';
import { useLocale } from '../context/LocaleContext';

interface Client {
  id: string;
  company_name?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  enterprise_id: string | null;
  is_active: boolean;
  created_at: string;
}

export function ClientsPage() {
  const { t } = useLocale();
  const { user } = useAuth();
  const isAdmin = user?.role_name === 'admin' || user?.role_id === 'role_admin';
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [contactClient, setContactClient] = useState<Client | null>(null);
  const [nameFilter, setNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadClients = async (nextStatus: typeof statusFilter = statusFilter) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (nameFilter) params.name = nameFilter;
      if (nextStatus !== 'all') params.status = nextStatus;
      const data = await api.getClients(params);
      setClients(data);
      setLoading(false);
    } catch (err: any) {
      toast(t('management.clientsError'), 'error');
      setLoading(false);
    }
  };

  const handleNameChange = (e: any) => setNameFilter(e.target.value);
  const handleStatusChange = (status: 'all' | 'active' | 'inactive') => {
    setStatusFilter(status);
    loadClients(status);
  };

  const clientName = (client: Client) =>
    client.company_name || [client.first_name, client.last_name].filter(Boolean).join(' ') || t('management.unnamed');

  const handleEdit = async (client: Client) => {
    const company_name = window.prompt(t('management.clientNamePrompt'), clientName(client));
    if (!company_name || company_name === clientName(client)) return;
    try {
      await api.updateClient(client.id, { company_name } as any);
      toast(t('management.clientUpdated'), 'success');
      loadClients();
    } catch (err: any) {
      toast(t('management.clientUpdateError'), 'error');
    }
  };

  const handleDelete = async (client: Client) => {
    if (!window.confirm(t('management.clientDeleteConfirm').replace('{name}', clientName(client)))) return;
    try {
      await api.deleteClient(client.id);
      toast(t('management.clientDeleted'), 'success');
      loadClients();
    } catch (err: any) {
      toast(t('management.clientDeleteError'), 'error');
    }
  };

  return (
    <div className="p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-zinc-800">{t('management.clients')}</h1>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <Input
            placeholder={t('management.clientsSearch')}
            value={nameFilter}
            onChange={handleNameChange}
            className="flex-1 rounded-md border-zinc-300 px-3 py-2 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value as any)}
            className="sm:w-48 rounded-md border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="all">{t('management.all')}</option>
            <option value="active">{t('management.active')}</option>
            <option value="inactive">{t('management.inactive')}</option>
          </select>
          <Button onClick={() => loadClients()} className="sm:ml-auto rounded-md border px-4 py-2 text-sm">
            {t('management.refresh')}
          </Button>
        </div>
      </header>

      {loading ? (
        <p className="text-zinc-400 text-sm">{t('management.loading')}</p>
      ) : clients.length === 0 ? (
        <p className="text-zinc-500 text-sm p-4">{t('management.clientsEmpty')}</p>
      ) : (
        <Table>
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('management.number')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('management.name')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('management.email')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('management.phone')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('management.city')}</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('management.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="px-4 py-3 text-zinc-400 text-sm">{client.id.slice(0, 8)}...</td>
                <td className="px-4 py-3 font-medium text-zinc-800 text-sm">
                  {clientName(client)}
                </td>
                <td className="px-4 py-3 text-zinc-600 text-sm">{client.email || '-'}</td>
                <td className="px-4 py-3 text-zinc-600 text-sm">{client.phone || '-'}</td>
                <td className="px-4 py-3 text-zinc-600 text-sm">{client.city || '-'}</td>
                <td className="px-4 py-3 text-right text-sm space-x-2">
                  {isAdmin && <Button size="sm" variant="ghost" aria-label={t('management.contactHistory').replace('{name}', clientName(client))} onClick={() => setContactClient(client)}>{t('management.history')}</Button>}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-zinc-500 text-xs"
                    onClick={() => handleEdit(client)}
                  >
                    {t('management.edit')}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    className="text-crimson text-xs"
                    onClick={() => handleDelete(client)}
                  >
                    {t('management.delete')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      {contactClient && <ProspectContactHistory
        subjectId={contactClient.enterprise_id || contactClient.id}
        subjectName={clientName(contactClient)}
        subjectType={contactClient.enterprise_id ? 'enterprise' : 'client'}
        isAdmin={isAdmin}
        open={Boolean(contactClient)}
        onClose={() => setContactClient(null)}
      />}
    </div>
  );
}
