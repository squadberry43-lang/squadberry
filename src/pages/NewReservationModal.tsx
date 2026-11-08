import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { toast } from '../components/ui/Toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData?: { service_id?: string; service_name?: string; price?: number; ticket_id?: string };
  onCreated?: () => void;
}

const VISIT_TYPE_OPTIONS = [
  { value: 'home', label: 'Visita a domicilio' },
  { value: 'enterprise', label: 'Visita empresarial' },
];

const SERVICE_OPTIONS = [
  { value: '', label: 'Seleccionar servicio...' },
  { value: 'reparacion-telefono', label: 'Reparación de teléfono' },
  { value: 'reparacion-tablet', label: 'Reparación de tablet' },
  { value: 'reparacion-computadora', label: 'Reparación de computadora' },
  { value: 'diagnostico', label: 'Diagnóstico técnico' },
  { value: 'instalacion', label: 'Instalación de sistemas' },
  { value: 'mantenimiento', label: 'Mantenimiento preventivo' },
  { value: 'clases-tic', label: 'Clases de tecnología' },
];

export function NewReservationModal({ isOpen, onClose, initialData, onCreated }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    visit_type: 'home',
    service_name: initialData?.service_name || '',
    service_id: initialData?.service_id || '',
    ticket_id: initialData?.ticket_id || '',
    date: '',
    time: '',
    observations: '',
    address: user?.profile?.address || '',
    city: user?.profile?.city || '',
    province: user?.profile?.province || '',
    postal_code: user?.profile?.postal_code || '',
    enterprise_name: '',
    enterprise_address: '',
    phone: user?.phone || '',
    full_name: user?.full_name || '',
  });

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.time) {
      toast('Seleccioná fecha y hora', 'warning');
      return;
    }
    setLoading(true);
    try {
      let payload: any = {
        visit_type: form.visit_type,
        service_name: form.service_name,
        service_id: form.service_id,
        ticket_id: form.ticket_id,
        date: form.date,
        time: form.time,
        observations: form.observations,
        phone: form.phone,
        full_name: form.full_name,
      };

      if (form.visit_type === 'home') {
        payload = {
          ...payload,
          address: form.address,
          city: form.city,
          province: form.province,
          postal_code: form.postal_code,
        };
      } else {
        payload = {
          ...payload,
          enterprise_name: form.enterprise_name,
          enterprise_address: form.enterprise_address,
        };
      }

      await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      toast('Reserva creada exitosamente', 'success');
      onCreated?.();
      onClose();
      setForm({
        visit_type: 'home',
        service_name: '',
        service_id: '',
        ticket_id: '',
        date: '',
        time: '',
        observations: '',
        address: user?.profile?.address || '',
        city: user?.profile?.city || '',
        province: user?.profile?.province || '',
        postal_code: user?.profile?.postal_code || '',
        enterprise_name: '',
        enterprise_address: '',
        phone: user?.phone || '',
        full_name: user?.full_name || '',
      });
    } catch (err: any) {
      toast(err.message || 'Error al crear reserva', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nueva visita" size="lg">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <Select
            label="Tipo de visita"
            value={form.visit_type}
            onChange={(val) => update('visit_type', val)}
            options={VISIT_TYPE_OPTIONS}
          />

          {form.visit_type === 'home' ? (
            <div className="space-y-3 p-3 rounded-[2.5rem] bg-zinc-50 border border-zinc-200">
              <Input label="Dirección" value={form.address} onChange={(e) => update('address', e.target.value)} required placeholder="Av. Corrientes 1234" />
              <div className="grid grid-cols-3 gap-3">
                <Input label="Ciudad" value={form.city} onChange={(e) => update('city', e.target.value)} />
                <Input label="Provincia" value={form.province} onChange={(e) => update('province', e.target.value)} />
                <Input label="CP" value={form.postal_code} onChange={(e) => update('postal_code', e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-3 rounded-[2.5rem] bg-zinc-50 border border-zinc-200">
              <Input label="Nombre de la empresa" value={form.enterprise_name} onChange={(e) => update('enterprise_name', e.target.value)} required placeholder="Empresa S.A." />
              <Input label="Dirección de la empresa" value={form.enterprise_address} onChange={(e) => update('enterprise_address', e.target.value)} required placeholder="Av. Industria 567" />
            </div>
          )}

          <Select
            label="Servicio"
            value={form.service_id}
            onChange={(val) => {
              update('service_id', val);
              const found = SERVICE_OPTIONS.find(o => o.value === val);
              update('service_name', found?.label || '');
            }}
            options={SERVICE_OPTIONS}
          />

          <Input label="Ticket relacionado (opcional)" value={form.ticket_id} onChange={(e) => update('ticket_id', e.target.value)} placeholder="#12345" />

          <div className="grid grid-cols-2 gap-3">
            <Input type="date" label="Fecha" value={form.date} onChange={(e) => update('date', e.target.value)} required min={new Date().toISOString().split('T')[0]} />
            <Input type="time" label="Hora" value={form.time} onChange={(e) => update('time', e.target.value)} required />
          </div>

          <Input label="Teléfono de contacto" value={form.phone} onChange={(e) => update('phone', e.target.value)} required placeholder="+54 11 5555-0000" />
          <Input label="Nombre del solicitante" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} required />
          <div className="w-full">
            <label className="block text-xs font-medium text-zinc-600 mb-1.5">Observaciones</label>
            <textarea
              value={form.observations}
              onChange={(e) => update('observations', e.target.value)}
              placeholder="Información adicional para el técnico..."
              className="w-full px-3 py-2 rounded-[2.5rem] border border-zinc-300 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent min-h-[80px] resize-y"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={loading}>
            Reservar visita
          </Button>
        </div>
      </form>
    </Modal>
  );
}