import { useState, useEffect } from 'react';
import { Table } from '../components/ui/Table';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import api from '../services/api';
import { toast } from '../components/ui/Toast';
import { useLocale } from '../context/LocaleContext';

interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  quantity: number;
  stock_quantity?: number;
  min_quantity: number;
  min_stock?: number;
  unit: string;
  location: string | null;
  category: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function InventoryPage() {
  const { t } = useLocale();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [nameFilter, setNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ok' | 'low' | 'out'>('all');

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (nameFilter) params.name = nameFilter;
      const data = await api.getInventory(params);
      setItems(data);
      setLoading(false);
    } catch (err: any) {
      toast(err.message || t('inventory.loadError'), 'error');
      setLoading(false);
    }
  };

  const handleNameChange = (e: any) => setNameFilter(e.target.value);
  const handleStatusChange = (status: 'all' | 'ok' | 'low' | 'out') => {
    setStatusFilter(status);
    loadItems(); // Refetch to apply client-side filtering if needed
  };

  // Client-side status calculation
  const itemQuantity = (item: InventoryItem) => item.stock_quantity ?? item.quantity ?? 0;
  const itemMinStock = (item: InventoryItem) => item.min_stock ?? item.min_quantity ?? 0;

  const getStatus = (item: InventoryItem): 'ok' | 'low' | 'out' => {
    const quantity = itemQuantity(item);
    if (quantity === 0) return 'out';
    if (quantity <= itemMinStock(item)) return 'low';
    return 'ok';
  };

  const handleAdjustStock = async (item: InventoryItem) => {
    const nextValue = window.prompt(t('inventory.newStock'), String(itemQuantity(item)));
    if (nextValue === null) return;
    const nextStock = Number(nextValue);
    if (!Number.isInteger(nextStock) || nextStock < 0) {
      toast(t('inventory.invalidStock'), 'error');
      return;
    }
    const change = nextStock - itemQuantity(item);
    if (change === 0) return;
    try {
      await api.adjustInventoryStock(item.id, change, 'Ajuste desde inventario');
      toast(t('inventory.stockUpdated'), 'success');
      loadItems();
    } catch (err: any) {
      toast(err.message || t('inventory.updateError'), 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('inventory.deleteConfirm'))) return;
    try {
      await api.deleteInventory(id);
      toast(t('inventory.itemDeleted'), 'success');
      loadItems();
    } catch (err: any) {
      toast(err.message || t('inventory.deleteError'), 'error');
    }
  };

  return (
    <div className="p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-zinc-800">{t('inventory.title')}</h1>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <Input
            placeholder={t('inventory.searchHint')}
            value={nameFilter}
            onChange={handleNameChange}
            className="flex-1 rounded-md border-zinc-300 px-3 py-2 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value as any)}
            className="sm:w-48 rounded-md border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="all">{t('inventory.all')}</option>
            <option value="ok">{t('inventory.ok')}</option>
            <option value="low">{t('inventory.low')}</option>
            <option value="out">{t('inventory.out')}</option>
          </select>
          <Button onClick={loadItems} className="sm:ml-auto rounded-md border px-4 py-2 text-sm">
            {t('inventory.refresh')}
          </Button>
        </div>
      </header>

      {loading ? (
        <p className="text-zinc-400 text-sm">{t('inventory.loading')}</p>
      ) : items.length === 0 ? (
        <p className="text-zinc-500 text-sm p-4">{t('inventory.empty')}</p>
      ) : (
        <Table>
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('inventory.number')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('inventory.name')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">SKU</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('inventory.stock')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('inventory.minimum')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('inventory.unit')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('inventory.location')}</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">{t('inventory.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {items
              .filter(item => {
                if (statusFilter === 'all') return true;
                const status = getStatus(item);
                return status === statusFilter;
              })
              .map((item) => {
                return (
                  <tr key={item.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                    <td className="px-4 py-3 text-zinc-400 text-sm">{item.id.slice(0, 8)}...</td>
                    <td className="px-4 py-3 font-medium text-zinc-800 text-sm">{item.name}</td>
                    <td className="px-4 py-3 text-zinc-600 text-sm">{item.sku || '-'}</td>
                    <td className="px-4 py-3 text-zinc-600 text-sm">
                      {itemQuantity(item)} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 text-sm">{itemMinStock(item)}</td>
                    <td className="px-4 py-3 text-zinc-600 text-sm">{item.unit}</td>
                    <td className="px-4 py-3 text-zinc-600 text-sm">{item.location || '-'}</td>
                    <td className="px-4 py-3 text-right text-sm space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-zinc-500 text-xs"
                        onClick={() => handleAdjustStock(item)}
                      >
                        {t('inventory.edit')}
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        className="text-crimson text-xs"
                        onClick={() => handleDelete(item.id)}
                      >
                        {t('inventory.delete')}
                      </Button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </Table>
      )}
    </div>
  );
}
