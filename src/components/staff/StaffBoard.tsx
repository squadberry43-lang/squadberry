import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import { GripVertical } from 'lucide-react';
import type { StaffTask, StaffTaskStatus } from '../../services/api';
import { useLocale } from '../../context/LocaleContext';

const COLUMNS: Array<{ status: StaffTaskStatus; key: string }> = [
  { status: 'pending', key: 'staffUi.pending' },
  { status: 'in_progress', key: 'staffUi.inProgress' },
  { status: 'blocked', key: 'staffUi.blocked' },
  { status: 'done', key: 'staffUi.done' },
];

interface Props {
  tasks: StaffTask[];
  onOpen: (task: StaffTask) => void;
  onStatusChange: (task: StaffTask, status: StaffTaskStatus) => void;
}

export function StaffBoard({ tasks, onOpen, onStatusChange }: Props) {
  const { locale, t } = useLocale();
  const onDragEnd = (result: DropResult) => {
    if (!result.destination || result.destination.droppableId === result.source.droppableId) return;
    const task = tasks.find((item) => item.id === result.draggableId);
    if (task) onStatusChange(task, result.destination.droppableId as StaffTaskStatus);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid min-w-[760px] grid-cols-4 gap-3" aria-label={t('staffUi.board')}>
        {COLUMNS.map(({ status, key }) => {
          const label = t(key);
          const items = tasks.filter((task) => task.status === status);
          return (
            <section key={status} className="min-h-[380px] rounded-md bg-[#f5f5f7] p-3" aria-label={label}>
              <div className="mb-3 flex items-center justify-between gap-2 px-1">
                <h2 className="text-sm font-semibold text-[#202124]">{label}</h2>
                <span className="text-xs tabular-nums text-[#6e6e73]">{items.length}</span>
              </div>
              <Droppable droppableId={status}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="min-h-[300px] space-y-2">
                    {items.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(drag) => (
                          <article ref={drag.innerRef} {...drag.draggableProps} className="rounded-md border border-black/10 bg-white p-3 shadow-sm">
                            <div className="flex items-start gap-2">
                              <span {...drag.dragHandleProps} title={t('staffUi.move')} aria-label={t('staffUi.move')} className="mt-0.5 cursor-grab text-[#86868b]"><GripVertical size={16} /></span>
                              <button type="button" onClick={() => onOpen(task)} className="min-w-0 flex-1 text-left text-sm font-medium text-[#202124] hover:text-[#0066cc] focus-visible:underline">{task.title}</button>
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-2 text-xs text-[#6e6e73]">
                              <span className="truncate">{task.assignee_name || t('staffUi.unassigned')}</span>
                              {task.due_at && <time dateTime={task.due_at}>{new Date(task.due_at).toLocaleDateString(locale)}</time>}
                            </div>
                            <label className="mt-3 block text-xs text-[#6e6e73]">
                              {t('staffUi.status')}
                              <select aria-label={`${t('staffUi.statusFor')} ${task.title}`} value={task.status} onChange={(event) => onStatusChange(task, event.target.value as StaffTaskStatus)} className="mt-1 w-full rounded-md border border-[#dadce0] bg-white px-2 py-1.5 text-xs text-[#202124]">
                                {COLUMNS.map((option) => <option key={option.status} value={option.status}>{t(option.key)}</option>)}
                              </select>
                            </label>
                          </article>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </section>
          );
        })}
      </div>
    </DragDropContext>
  );
}
