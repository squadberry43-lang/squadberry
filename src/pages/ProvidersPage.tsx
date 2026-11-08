import { useState, useEffect } from 'react';
import { Table } from '../components/ui/Table';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import api from '../services/api';
import { toast } from '../components/ui/Toast';

interface Provider {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postal_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function ProvidersPage() {
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [nameFilter, setNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (nameFilter) params.name = nameFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      const data = await api.getProviders(params);
      setProviders(data);
      setLoading(false);
    } catch (err: any) {
      toast(err.message || 'Error al cargar proveedores', 'error');
      setLoading(false);
    }
  };

  const handleNameChange = (e: any) => setNameFilter(e.target.value);
  const handleStatusChange = (status: 'all' | 'active' | 'inactive') => {
    setStatusFilter(status);
    loadProviders();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que quieres eliminar este proveedor?')) return;
    try {
      await api.delete(`/providers/${id}`);
      toast('Proveedor eliminado', 'success');
      loadProviders();
    } catch (err: any) {
      toast(err.message || 'Error al eliminar proveedor', 'error');
    }
  };

  return (
    <div className="p-4">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-zinc-800">Proveedores</h1>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <Input
            placeholder="Buscar por nombre o contacto..."
            value={nameFilter}
            onChange={handleNameChange}
            className="flex-1 rounded-md border-zinc-300 px-3 py-2 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value as any)}
            className="sm:w-48 rounded-md border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
          <Button onClick={loadProviders} className="sm:ml-auto rounded-md border px-4 py-2 text-sm">
            Actualizar
          </Button>
        </div>
      </header>

      {loading ? (
        <p className="text-zinc-400 text-sm">Cargando proveedores...</p>
      ) : providers.length === 0 ? (
        <p className="text-zinc-500 text-sm p-4">No hay proveedores registrados</p>
      ) : (
        <Table>
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">N°</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Nombre</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Contacto</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Email</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Teléfono</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">Dirección</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-zinc-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((provider) => (
              <tr key={provider.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="px-4 py-3 text-zinc-400 text-sm">{provider.id.slice(0, 8)}...</td>
                <td className="px-4 py-3 font-medium text-zinc-800 text-sm">{provider.name}</td>
                <td className="px-4 py-3 text-zinc-600 text-sm">{provider.contact}</td>
                <td className="px-4 py-3 text-zinc-600 text-sm">{provider.email}</td>
                <td className="px-4 py-3 text-zinc-600 text-sm">{provider.phone || '-'}</td>
                <td className="px-4 py-3 text-zinc-600 text-sm">
                  {provider.address}, {provider.city}, {provider.province} {provider.postal_code}
                </td>
                <td className="px-4 py-3 text-right text-sm space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-zinc-500 text-xs"
                    disabled
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    className="text-crimson text-xs"
                    onClick={() => handleDelete(provider.id)}
                  >
                    Eliminar
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
