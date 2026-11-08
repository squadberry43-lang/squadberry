import { useState, useEffect } from 'react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import api from '../services/api';
import { toast } from '../components/ui/Toast';
import { useLocale } from '../context/LocaleContext';

interface Budget {
  id: string;
  title: string;
  client_name: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';
  created_at: string;
  validity_date: string;
  notes?: string | null;
  total: number;
}

export function BudgetsPage() {
  const { t, locale } = useLocale();
  const [loading, setLoading] = useState(true);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | Budget['status']>('all');
  const [selected, setSelected] = useState<Budget | null>(null);
  const formatDate = (value?: string) => value && !Number.isNaN(new Date(value).getTime())
    ? new Date(value).toLocaleDateString(locale) : '—';

  useEffect(() => {
    void loadBudgets();
  }, [statusFilter]);

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const data = await api.getBudgets();
      let filtered = Array.isArray(data) ? data : (data as any).budgets || [];
      if (statusFilter !== 'all') {
        filtered = filtered.filter((b: Budget) => b.status === statusFilter);
      }
      setBudgets(filtered);
      setLoading(false);
    } catch (err: any) {
      toast(t('management.budgetsError'), 'error');
      setLoading(false);
    }
  };

  const handleStatusChange = (status: 'all' | Budget['status']) => {
    setStatusFilter(status);
  };

  return (
    <div className="p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-zinc-800">{t('management.budgets')}</h1>
        <div className="mt-2 flex flex-col sm:flex-row gap-2">
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value as any)}
            className="sm:w-48 rounded-md border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="all">{t('management.all')}</option>
            <option value="draft">{t('management.budget.draft')}</option>
            <option value="sent">{t('management.budget.sent')}</option>
            <option value="accepted">{t('management.budget.accepted')}</option>
            <option value="rejected">{t('management.budget.rejected')}</option>
            <option value="expired">{t('management.budget.expired')}</option>
            <option value="converted">{t('management.budget.converted')}</option>
          </select>
          <Button onClick={loadBudgets} className="sm:ml-auto rounded-md border px-4 py-2 text-sm">
            {t('management.refresh')}
          </Button>
        </div>
      </header>

      {loading ? (
        <p className="text-zinc-400 text-sm">{t('management.loading')}</p>
      ) : budgets.length === 0 ? (
        <p className="text-zinc-500 text-sm p-4">{t('management.budgetsEmpty')}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('management.number')}</TableHead>
              <TableHead>{t('management.client')}</TableHead>
              <TableHead>{t('management.status')}</TableHead>
              <TableHead>{t('management.issued')}</TableHead>
              <TableHead>{t('management.due')}</TableHead>
              <TableHead>{t('management.total')}</TableHead>
              <TableHead className="text-right w-32">{t('management.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {budgets.map((bud) => (
              <TableRow key={bud.id}>
                <TableCell>{bud.id.slice(0, 8)}...</TableCell>
                <TableCell className="font-medium text-zinc-800">{bud.client_name}</TableCell>
                <TableCell>
                  <Badge variant={bud.status === 'converted' ? 'success' : bud.status === 'accepted' ? 'info' : bud.status === 'sent' ? 'warning' : 'danger'}>
                    {t(`management.budget.${bud.status}`)}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(bud.created_at)}</TableCell>
                <TableCell>{formatDate(bud.validity_date)}</TableCell>
                <TableCell className="font-medium">{Number(bud.total || 0).toLocaleString(locale)}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" className="text-zinc-500 text-xs" onClick={() => setSelected(bud)}>
                    {t('management.view')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <Modal isOpen={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.title || t('management.budgets')}>
        {selected && (
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div><dt className="text-zinc-500">{t('management.client')}</dt><dd>{selected.client_name || '—'}</dd></div>
            <div><dt className="text-zinc-500">{t('management.status')}</dt><dd>{t(`management.budget.${selected.status}`)}</dd></div>
            <div><dt className="text-zinc-500">{t('management.issued')}</dt><dd>{formatDate(selected.created_at)}</dd></div>
            <div><dt className="text-zinc-500">{t('management.due')}</dt><dd>{formatDate(selected.validity_date)}</dd></div>
            <div><dt className="text-zinc-500">{t('management.total')}</dt><dd>{Number(selected.total || 0).toLocaleString(locale)}</dd></div>
            {selected.notes && <div className="sm:col-span-2"><dt className="text-zinc-500">{t('management.notes')}</dt><dd className="whitespace-pre-wrap">{selected.notes}</dd></div>}
          </dl>
        )}
      </Modal>
    </div>
  );
}
