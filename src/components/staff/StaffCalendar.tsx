import { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer, type View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS, es, nl } from 'date-fns/locale';
import { useLocale } from '../../context/LocaleContext';
import type { StaffCalendarEvent } from '../../services/api';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './staff-calendar.css';

const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales: { es, en: enUS, nl } });

type ViewEvent = Omit<StaffCalendarEvent, 'start' | 'end'> & { start: Date; end: Date };

interface Props {
  events: StaffCalendarEvent[];
  onNavigate: (date: Date) => void;
  onSelect: (event: StaffCalendarEvent) => void;
}

export function StaffCalendar({ events, onNavigate, onSelect }: Props) {
  const [view, setView] = useState<View>(() => window.innerWidth < 640 ? 'day' : 'week');
  useEffect(() => {
    const query = window.matchMedia('(max-width: 639px)');
    const change = (event: MediaQueryListEvent) => setView(event.matches ? 'day' : 'week');
    query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);
  const { country, t } = useLocale();
  const language = country === 'NL' ? 'nl' : country === 'US' ? 'en' : 'es';
  const messages = {
    today: t('staffUi.today'), previous: t('staffUi.previous'), next: t('staffUi.next'),
    month: t('staffUi.month'), week: t('staffUi.week'), day: t('staffUi.day'),
    agenda: t('staffUi.agenda'), noEventsInRange: t('staffUi.noEvents'),
    allDay: t('staffUi.allDay'), date: t('staffUi.date'), time: t('staffUi.time'),
    event: t('staffUi.event'), showMore: (count: number) => `+${count} ${t('staffUi.more')}`,
  };
  const viewEvents: ViewEvent[] = events.map((event) => ({ ...event, start: new Date(event.start), end: new Date(event.end) }));

  return (
    <div className="staff-calendar" aria-label={t('staffUi.calendar')}>
      <Calendar<ViewEvent>
        localizer={localizer}
        culture={language}
        messages={messages}
        events={viewEvents}
        views={['week', 'month', 'day']}
        view={view}
        onView={setView}
        onNavigate={onNavigate}
        onSelectEvent={(event) => onSelect({ ...event, start: event.start.toISOString(), end: event.end.toISOString() })}
        eventPropGetter={(event) => ({ className: event.kind === 'visit' ? 'staff-event-visit' : 'staff-event-task' })}
        popup
        style={{ height: 580 }}
      />
    </div>
  );
}
