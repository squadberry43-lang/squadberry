import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CalendarDays, ListTodo, Plus } from 'lucide-react';
import api, { type StaffAssignee, type StaffCalendarEvent, type StaffTask, type StaffTaskInput, type StaffTaskStatus } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { toast } from '../components/ui/Toast';
import { StaffCalendar } from '../components/staff/StaffCalendar';
import { StaffBoard } from '../components/staff/StaffBoard';
import { TaskEditor } from '../components/staff/TaskEditor';

interface Props { team?: boolean }

export function StaffWorkPage({ team = false }: Props) {
  const { user } = useAuth();
  const { locale, t } = useLocale();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const canManage = user?.role_name === 'admin' || user?.role_name === 'supervisor';
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [view, setView] = useState<'calendar' | 'list' | 'board'>(team ? 'board' : 'calendar');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [tasks, setTasks] = useState<StaffTask[]>([]);
  const [events, setEvents] = useState<StaffCalendarEvent[]>([]);
  const [assignees, setAssignees] = useState<StaffAssignee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editorOpen, setEditorOpen] = useState(Boolean(searchParams.get('ticket') || searchParams.get('visit')));
  const [selectedTask, setSelectedTask] = useState<StaffTask | null>(null);

  const range = useMemo(() => {
    const from = new Date(anchorDate);
    const to = new Date(anchorDate);
    from.setDate(from.getDate() - 45);
    to.setDate(to.getDate() + 45);
    return { from: from.toISOString(), to: to.toISOString() };
  }, [anchorDate]);

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const assigned_to = team ? assigneeFilter || undefined : user.id;
      const [nextTasks, nextEvents, nextAssignees] = await Promise.all([
        api.getStaffTasks(assigned_to ? { assigned_to } : undefined),
        api.getStaffCalendar({ ...range, assigned_to }),
        api.getStaffAssignees(),
      ]);
      setTasks(nextTasks);
      setEvents(nextEvents);
      setAssignees(nextAssignees);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('work.loadError'));
    } finally {
      setLoading(false);
    }
  }, [user, team, assigneeFilter, range, t]);

  useEffect(() => { void reload(); }, [reload]);

  const saveTask = async (values: Record<string, unknown>) => {
    if (selectedTask) await api.updateStaffTask(selectedTask.id, values as Partial<StaffTaskInput> & { status?: StaffTaskStatus; progress_notes?: string });
    else await api.createStaffTask(values as unknown as StaffTaskInput);
    toast(t(selectedTask ? 'work.updated' : 'work.created'), 'success');
    await reload();
  };

  const updateStatus = async (task: StaffTask, status: StaffTaskStatus) => {
    if (status === task.status) return;
    try {
      await api.updateStaffTask(task.id, { status });
      toast(t('work.statusUpdated'), 'success');
      await reload();
    } catch (reason) {
      toast(reason instanceof Error ? reason.message : t('work.updateError'), 'error');
    }
  };

  const selectEvent = (event: StaffCalendarEvent) => {
    if (event.kind === 'visit') return navigate(event.href);
    const task = tasks.find((item) => `task:${item.id}` === event.id);
    if (task) { setSelectedTask(task); setEditorOpen(true); }
  };

  return (
    <div className="mx-auto max-w-[1380px] px-4 pb-14 pt-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-black/10 pb-5">
        <div>
          <h1 className="text-2xl font-semibold text-[#202124] sm:text-3xl">{t(team ? 'work.team' : 'work.mine')}</h1>
          <p className="mt-1 text-sm text-[#6e6e73]">{t(team ? 'work.teamLead' : 'work.mineLead')}</p>
        </div>
        {team && canManage && <button type="button" onClick={() => { setSelectedTask(null); setEditorOpen(true); }} className="inline-flex items-center gap-2 rounded-md bg-[#202124] px-4 py-2 text-sm font-medium text-white hover:bg-[#3c4043]"><Plus size={16} />{t('work.newTask')}</button>}
      </header>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-md border border-[#dadce0] bg-white p-1" role="group" aria-label={t('work.view')}>
          <button type="button" onClick={() => setView('calendar')} aria-pressed={view === 'calendar'} className={`inline-flex items-center gap-2 rounded px-3 py-1.5 text-sm ${view === 'calendar' ? 'bg-[#202124] text-white' : 'text-[#5f6368]'}`}><CalendarDays size={16} />{t('work.calendar')}</button>
          <button type="button" onClick={() => setView(team ? 'board' : 'list')} aria-pressed={view !== 'calendar'} className={`inline-flex items-center gap-2 rounded px-3 py-1.5 text-sm ${view !== 'calendar' ? 'bg-[#202124] text-white' : 'text-[#5f6368]'}`}><ListTodo size={16} />{t(team ? 'work.board' : 'work.list')}</button>
        </div>
        {team && <label className="flex items-center gap-2 text-sm text-[#5f6368]">{t('work.assignee')}
          <select value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)} className="rounded-md border border-[#dadce0] bg-white px-3 py-2 text-[#202124]">
            <option value="">{t('work.all')}</option>
            {assignees.map((person) => <option key={person.id} value={person.id}>{person.full_name}</option>)}
          </select>
        </label>}
      </div>

      {error && <div role="alert" className="mb-5 border-l-2 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{error} <button type="button" onClick={() => void reload()} className="ml-2 font-medium underline">{t('work.retry')}</button></div>}
      {loading ? <p className="py-16 text-center text-sm text-[#6e6e73]">{t('work.loading')}</p> : <>
        {view === 'calendar' && <>
          <StaffCalendar events={events} onNavigate={setAnchorDate} onSelect={selectEvent} />
          {events.length === 0 && <p className="border-b border-[#e5e5e7] py-5 text-center text-sm text-[#6e6e73]">{t('work.noEvents')}</p>}
        </>}
        {view === 'board' && team && <div className="overflow-x-auto pb-3"><StaffBoard tasks={tasks} onOpen={(task) => { setSelectedTask(task); setEditorOpen(true); }} onStatusChange={updateStatus} /></div>}
        {view === 'list' && !team && <section aria-label={t('work.assignedTasks')} className="divide-y divide-[#e5e5e7] border-y border-[#e5e5e7] bg-white">
          {tasks.length === 0 && <p className="py-12 text-center text-sm text-[#6e6e73]">{t('work.noTasks')}</p>}
          {tasks.map((task) => <div key={task.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0"><button type="button" onClick={() => { setSelectedTask(task); setEditorOpen(true); }} className="text-left text-sm font-medium text-[#202124] hover:text-[#0066cc]">{task.title}</button>
              <p className="text-xs text-[#6e6e73]">{task.due_at ? `${t('work.due')} ${new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(task.due_at))}` : t('work.noDue')}</p></div>
            <select aria-label={`${t('work.statusOf')} ${task.title}`} value={task.status} onChange={(event) => void updateStatus(task, event.target.value as StaffTaskStatus)} className="rounded-md border border-[#dadce0] bg-white px-2 py-1.5 text-xs text-[#202124]">
              <option value="pending">{t('work.pending')}</option><option value="in_progress">{t('work.inProgress')}</option><option value="blocked">{t('work.blocked')}</option><option value="done">{t('work.done')}</option>
            </select>
          </div>)}
        </section>}
      </>}

      {team && <div className="mt-6 text-sm text-[#6e6e73]"><Link to="/agenda" className="text-[#0066cc] hover:underline">{t('work.openMine')}</Link></div>}
      {editorOpen && user && <TaskEditor key={selectedTask?.id || 'new'} task={selectedTask} assignees={assignees} currentUserId={user.id} canManage={Boolean(canManage)} initialTicketId={searchParams.get('ticket')} initialVisitId={searchParams.get('visit')} onClose={() => { setEditorOpen(false); setSelectedTask(null); }} onSave={saveTask} />}
    </div>
  );
}
