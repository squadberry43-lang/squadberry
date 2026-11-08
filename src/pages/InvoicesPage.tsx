import { useState, useEffect } from 'react';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import api from '../services/api';
import { toast } from '../components/ui/Toast';
import { useLocale } from '../context/LocaleContext';

interface Invoice {
  id: string;
  client_id: string;
  client_name?: string;
  ticket_id: string | null;
  amount?: number;
  total?: number;
  total_amount?: number;
  invoice_number?: string;
  status: 'pending' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  due_date: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export function InvoicesPage() {
  const { t, locale } = useLocale();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | Invoice['status']>('all');

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async (nextStatus: 'all' | Invoice['status'] = statusFilter) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (nextStatus !== 'all') params.status = nextStatus;
      const data = await api.getInvoices(params);
      setInvoices(data);
      setLoading(false);
    } catch (err: any) {
      toast(t('management.invoicesError'), 'error');
      setLoading(false);
    }
  };

  const handleStatusChange = (status: 'all' | Invoice['status']) => {
    setStatusFilter(status);
    loadInvoices(status);
  };

  const invoiceTotal = (invoice: Invoice) => invoice.total_amount ?? invoice.total ?? invoice.amount ?? 0;

  const handleView = (invoice: Invoice) => {
    window.alert([
      `${t('management.invoice')}: ${invoice.invoice_number || invoice.id}`,
      `${t('management.client')}: ${invoice.client_name || invoice.client_id || '-'}`,
      `${t('management.status')}: ${t(`management.invoice.${invoice.status}`)}`,
      `${t('management.total')}: $${invoiceTotal(invoice).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ].join('\n'));
  };

  const handleCancel = async (invoice: Invoice) => {
    if (!window.confirm(t('management.invoiceConfirm'))) return;
    try {
      await api.updateInvoice(invoice.id, { status: 'cancelled' });
      toast(t('management.invoiceCancelled'), 'success');
      loadInvoices();
    } catch (err: any) {
      toast(t('management.invoiceCancelError'), 'error');
    }
  };

  return (
    <div className="p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-zinc-800">{t('management.invoices')}</h1>
        <div className="mt-2 flex flex-col sm:flex-row gap-2">
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value as any)}
            className="sm:w-48 rounded-md border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="all">{t('management.all')}</option>
            <option value="pending">{t('management.invoice.pending')}</option>
            <option value="paid">{t('management.invoice.paid')}</option>
            <option value="partially_paid">{t('management.invoice.partially_paid')}</option>
            <option value="overdue">{t('management.invoice.overdue')}</option>
            <option value="cancelled">{t('management.invoice.cancelled')}</option>
          </select>
          <Button onClick={() => loadInvoices()} className="sm:ml-auto rounded-md border px-4 py-2 text-sm">
            {t('management.refresh')}
          </Button>
        </div>
      </header>

      {loading ? (
        <p className="text-zinc-400 text-sm">{t('management.loading')}</p>
      ) : invoices.length === 0 ? (
        <p className="text-zinc-500 text-sm p-4">{t('management.invoicesEmpty')}</p>
      ) : (
        <Table>
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('management.number')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('management.client')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('management.ticket')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('management.status')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('management.total')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('management.due')}</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('management.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="px-4 py-3 text-zinc-400 text-sm">{inv.id.slice(0, 8)}...</td>
                <td className="px-4 py-3 text-zinc-600 text-sm">{inv.client_name || (inv.client_id ? `${t('management.client')} ${inv.client_id.slice(0, 6)}...` : '-')}</td>
                <td className="px-4 py-3 text-zinc-600 text-sm">{inv.ticket_id ? `${t('management.ticket')} ${inv.ticket_id.slice(0, 6)}...` : '-'}</td>
                <td className="px-4 py-3 text-zinc-600 text-sm capitalize">
                  {t(`management.invoice.${inv.status}`)}
                </td>
                <td className="px-4 py-3 font-medium text-zinc-800 text-sm">${invoiceTotal(inv).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-zinc-600 text-sm">{new Date(inv.due_date).toLocaleDateString(locale)}</td>
                <td className="px-4 py-3 text-right text-sm space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-zinc-500 text-xs"
                    onClick={() => handleView(inv)}
                  >
                    {t('management.view')}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    className="text-crimson text-xs"
                    disabled={inv.status === 'cancelled' || inv.status === 'paid'}
                    onClick={() => handleCancel(inv)}
                  >
                    {t('management.cancel')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
