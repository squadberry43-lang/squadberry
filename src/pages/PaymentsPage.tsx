import { useState, useEffect } from 'react';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import api from '../services/api';
import { toast } from '../components/ui/Toast';
import { useLocale } from '../context/LocaleContext';

interface Payment {
  id: string;
  client_id?: string;
  invoice_id: string;
  amount: number;
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_date?: string;
  payment_method?: 'cash' | 'card' | 'transfer' | 'check' | 'mobile';
  method?: 'cash' | 'card' | 'transfer' | 'check';
  reference_number?: string;
  created_at: string;
  updated_at: string;
}

export function PaymentsPage() {
  const { t, locale } = useLocale();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'failed' | 'refunded'>('all');

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async (nextStatus: typeof statusFilter = statusFilter) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (nextStatus !== 'all') params.status = nextStatus;
      const data = await api.getPayments(params);
      setPayments(data);
      setLoading(false);
    } catch (err: any) {
      toast(t('management.paymentsError'), 'error');
      setLoading(false);
    }
  };

  const handleStatusChange = (status: 'all' | 'pending' | 'completed' | 'failed' | 'refunded') => {
    setStatusFilter(status);
    loadPayments(status);
  };

  const paymentDate = (payment: Payment) => payment.payment_date || payment.created_at;
  const paymentMethod = (payment: Payment) => payment.payment_method || payment.method || '-';

  const handleView = (payment: Payment) => {
    window.alert([
      `${t('management.payments')}: ${payment.id}`,
      `${t('management.invoice')}: ${payment.invoice_id || '-'}`,
      `${t('management.amount')}: $${Number(payment.amount || 0).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `${t('management.method')}: ${paymentMethod(payment) === '-' ? '-' : t(`management.paymentMethod.${paymentMethod(payment)}`)}`,
      `${t('management.reference')}: ${payment.reference_number || '-'}`,
    ].join('\n'));
  };

  return (
    <div className="p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-zinc-800">{t('management.payments')}</h1>
        <div className="mt-2 flex flex-col sm:flex-row gap-2">
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value as any)}
            className="sm:w-48 rounded-md border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="all">{t('management.all')}</option>
            <option value="pending">{t('management.payment.pending')}</option>
            <option value="completed">{t('management.payment.completed')}</option>
            <option value="failed">{t('management.payment.failed')}</option>
            <option value="refunded">{t('management.payment.refunded')}</option>
          </select>
          <Button onClick={() => loadPayments()} className="sm:ml-auto rounded-md border px-4 py-2 text-sm">
            {t('management.refresh')}
          </Button>
        </div>
      </header>

      {loading ? (
        <p className="text-zinc-400 text-sm">{t('management.loading')}</p>
      ) : payments.length === 0 ? (
        <p className="text-zinc-500 text-sm p-4">{t('management.paymentsEmpty')}</p>
      ) : (
        <Table>
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('management.number')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('management.client')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('management.invoice')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('management.amount')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('management.status')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('management.date')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('management.method')}</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('management.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((pay) => (
              <tr key={pay.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="px-4 py-3 text-zinc-400 text-sm">{pay.id.slice(0, 8)}...</td>
                <td className="px-4 py-3 text-zinc-600 text-sm">{pay.client_id ? `${t('management.client')} ${pay.client_id.slice(0, 6)}...` : '-'}</td>
                <td className="px-4 py-3 text-zinc-600 text-sm">{pay.invoice_id ? `${t('management.invoice')} ${pay.invoice_id.slice(0, 6)}...` : '-'}</td>
                <td className="px-4 py-3 font-medium text-zinc-800 text-sm">${Number(pay.amount || 0).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td className="px-4 py-3 text-zinc-600 text-sm capitalize">
                  {t(`management.payment.${pay.status || 'recorded'}`)}
                </td>
                <td className="px-4 py-3 text-zinc-600 text-sm">{new Date(paymentDate(pay)).toLocaleDateString(locale)}</td>
                <td className="px-4 py-3 text-zinc-600 text-sm capitalize">
                  {paymentMethod(pay) === '-' ? '-' : t(`management.paymentMethod.${paymentMethod(pay)}`)}
                </td>
                <td className="px-4 py-3 text-right text-sm space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-zinc-500 text-xs"
                    onClick={() => handleView(pay)}
                  >
                    {t('management.view')}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    className="text-crimson text-xs"
                    disabled
                  >
                    {t('management.delete')}
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
