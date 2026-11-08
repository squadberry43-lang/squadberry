import { useState, type FormEvent } from 'react';
import { Modal } from '../ui/Modal';
import type { StaffAssignee, StaffTask, StaffTaskPriority, StaffTaskStatus } from '../../services/api';
import { useLocale } from '../../context/LocaleContext';

function localInput(iso: string | null | undefined) {
  if (!iso) return '';
  const date = new Date(iso);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

interface Props {
  task: StaffTask | null;
  assignees: StaffAssignee[];
  currentUserId: string;
  canManage: boolean;
  initialTicketId?: string | null;
  initialVisitId?: string | null;
  onClose: () => void;
  onSave: (values: Record<string, unknown>) => Promise<void>;
}

export function TaskEditor({ task, assignees, currentUserId, canManage, initialTicketId, initialVisitId, onClose, onSave }: Props) {
  const { t } = useLocale();
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [progressNotes, setProgressNotes] = useState(task?.progress_notes || '');
  const [assignedTo, setAssignedTo] = useState(task?.assigned_to || currentUserId);
  const [priority, setPriority] = useState<StaffTaskPriority>(task?.priority || 'normal');
  const [status, setStatus] = useState<StaffTaskStatus>(task?.status || 'pending');
  const [startsAt, setStartsAt] = useState(localInput(task?.starts_at));
  const [dueAt, setDueAt] = useState(localInput(task?.due_at));
  const [duration, setDuration] = useState(task?.duration_minutes || 60);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (canManage && !title.trim()) return setError(t('staffUi.titleRequired'));
    setSaving(true);
    try {
      const values: Record<string, unknown> = canManage
        ? {
            title: title.trim(), description, progress_notes: progressNotes,
            assigned_to: assignedTo, priority, starts_at: startsAt ? new Date(startsAt).toISOString() : null,
            due_at: dueAt ? new Date(dueAt).toISOString() : null,
            duration_minutes: startsAt ? duration : null,
            ...(task ? { status } : {}),
            ...(!task && initialTicketId ? { ticket_id: initialTicketId } : {}),
            ...(!task && initialVisitId ? { visit_id: initialVisitId } : {}),
          }
        : { status, progress_notes: progressNotes };
      await onSave(values);
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('staffUi.saveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={t(task ? 'staffUi.taskDetail' : 'staffUi.newTask')} size="lg">
      <form onSubmit={submit} className="space-y-4">
        {canManage && <>
          <label className="block text-sm font-medium text-[#3c4043]">{t('staffUi.title')}
            <input required maxLength={255} value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1 w-full rounded-md border border-[#dadce0] px-3 py-2 text-[#202124]" />
          </label>
          <label className="block text-sm font-medium text-[#3c4043]">{t('staffUi.description')}
            <textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1 w-full rounded-md border border-[#dadce0] px-3 py-2 text-[#202124]" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-[#3c4043]">{t('staffUi.assignee')}
              <select value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)} className="mt-1 w-full rounded-md border border-[#dadce0] bg-white px-3 py-2 text-[#202124]">
                {assignees.map((person) => <option key={person.id} value={person.id}>{person.full_name}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-[#3c4043]">{t('staffUi.priority')}
              <select value={priority} onChange={(event) => setPriority(event.target.value as StaffTaskPriority)} className="mt-1 w-full rounded-md border border-[#dadce0] bg-white px-3 py-2 text-[#202124]">
                <option value="low">{t('staffUi.low')}</option><option value="normal">{t('staffUi.normal')}</option><option value="high">{t('staffUi.high')}</option><option value="critical">{t('staffUi.critical')}</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-[#3c4043]">{t('staffUi.scheduledStart')}
              <input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="mt-1 w-full rounded-md border border-[#dadce0] px-3 py-2 text-[#202124]" />
            </label>
            <label className="block text-sm font-medium text-[#3c4043]">{t('staffUi.duration')}
              <input type="number" min={15} max={480} step={15} value={duration} disabled={!startsAt} onChange={(event) => setDuration(Number(event.target.value))} className="mt-1 w-full rounded-md border border-[#dadce0] px-3 py-2 text-[#202124] disabled:bg-[#f5f5f7]" />
            </label>
            <label className="block text-sm font-medium text-[#3c4043] sm:col-span-2">{t('staffUi.dueDate')}
              <input type="datetime-local" value={dueAt} onChange={(event) => setDueAt(event.target.value)} className="mt-1 w-full rounded-md border border-[#dadce0] px-3 py-2 text-[#202124]" />
            </label>
          </div>
        </>}
        {task && <label className="block text-sm font-medium text-[#3c4043]">{t('staffUi.status')}
          <select value={status} onChange={(event) => setStatus(event.target.value as StaffTaskStatus)} className="mt-1 w-full rounded-md border border-[#dadce0] bg-white px-3 py-2 text-[#202124]">
            <option value="pending">{t('staffUi.pending')}</option><option value="in_progress">{t('staffUi.inProgress')}</option><option value="blocked">{t('staffUi.blocked')}</option><option value="done">{t('staffUi.done')}</option>
          </select>
        </label>}
        <label className="block text-sm font-medium text-[#3c4043]">{t('staffUi.progressNotes')}
          <textarea rows={3} value={progressNotes} onChange={(event) => setProgressNotes(event.target.value)} className="mt-1 w-full rounded-md border border-[#dadce0] px-3 py-2 text-[#202124]" />
        </label>
        {task?.ticket_id && <a className="text-sm text-[#0066cc]" href={`/tickets/${task.ticket_id}`}>{t('staffUi.relatedTicket')}</a>}
        {task?.visit_id && <a className="text-sm text-[#0066cc]" href={`/visits/${task.visit_id}`}>{t('staffUi.relatedVisit')}</a>}
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-[#e5e5e7] pt-4">
          <button type="button" onClick={onClose} className="rounded-md border border-[#dadce0] px-4 py-2 text-sm font-medium">{t('staffUi.cancel')}</button>
          <button type="submit" disabled={saving} className="rounded-md bg-[#202124] px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{t(saving ? 'staffUi.saving' : 'staffUi.save')}</button>
        </div>
      </form>
    </Modal>
  );
}
