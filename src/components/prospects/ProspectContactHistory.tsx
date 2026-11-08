import { useEffect, useMemo, useState } from 'react';
import { Clock3, Link2, MessageSquare, Plus, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import api, { CrmChannel, CrmDirection, CrmInteraction, CrmMatch, CrmOutcome } from '../../services/api';
import { useLocale } from '../../context/LocaleContext';

interface Props {
  subjectId: string;
  subjectName: string;
  subjectType: 'prospect' | 'client' | 'enterprise';
  isAdmin: boolean;
  open: boolean;
  onClose: () => void;
}

export function ProspectContactHistory({ subjectId, subjectName, subjectType, isAdmin, open, onClose }: Props) {
  const { t, locale } = useLocale();
  const p = (key: string) => t(`prospects.${key}`);
  const channelLabels = Object.fromEntries((['email', 'phone', 'whatsapp', 'web', 'in_person', 'other'] as CrmChannel[]).map((key) => [key, p(`channel.${key}`)])) as Record<CrmChannel, string>;
  const directionLabels = Object.fromEntries((['inbound', 'outbound'] as CrmDirection[]).map((key) => [key, p(`direction.${key}`)])) as Record<CrmDirection, string>;
  const outcomeLabels = Object.fromEntries((['attempted', 'sent', 'connected', 'replied', 'no_answer', 'failed', 'meeting_scheduled', 'other'] as CrmOutcome[]).map((key) => [key, p(`outcome.${key}`)])) as Record<CrmOutcome, string>;
  const [items, setItems] = useState<CrmInteraction[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [channel, setChannel] = useState<CrmChannel>('email');
  const [direction, setDirection] = useState<CrmDirection>('outbound');
  const [outcome, setOutcome] = useState<CrmOutcome>('attempted');
  const [notes, setNotes] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [matches, setMatches] = useState<CrmMatch[] | null>(null);
  const [matchMessage, setMatchMessage] = useState('');
  const [matchBusy, setMatchBusy] = useState(false);

  const reload = async () => {
    setLoading(true);
    setError('');
    try {
      const data = subjectType === 'prospect'
        ? await api.getProspectInteractions(subjectId)
        : await api.getRecordInteractions(subjectType, subjectId);
      setItems(data.interactions);
    } catch (err: any) {
      console.error('Prospect history load failed', err);
      setError(p('history.errorLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    setMatches(null);
    setMatchMessage('');
    void reload();
  }, [open, subjectId, subjectType]);

  const latestByChannel = useMemo(() => {
    const latest = new Map<CrmChannel, CrmInteraction>();
    for (const item of items) latest.set(item.channel, item);
    return latest;
  }, [items]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        channel, direction, outcome, notes: notes.trim() || null,
        follow_up_at: followUp ? new Date(followUp).toISOString() : null,
      };
      if (subjectType === 'prospect') await api.createProspectInteraction(subjectId, payload);
      else await api.createRecordInteraction(subjectType, subjectId, payload);
      setNotes('');
      setFollowUp('');
      await reload();
    } catch (err: any) {
      console.error('Prospect activity save failed', err);
      setError(p('history.errorSave'));
    } finally {
      setSaving(false);
    }
  };

  const loadMatches = async () => {
    setMatchBusy(true);
    setMatchMessage('');
    try {
      setMatches((await api.getProspectMatches(subjectId)).matches);
    } catch (err: any) {
      console.error('Prospect match lookup failed', err);
      setError(p('history.errorMatches'));
    } finally {
      setMatchBusy(false);
    }
  };

  const decideMatch = async (match: CrmMatch, decision: 'confirmed' | 'rejected') => {
    setMatchBusy(true);
    setError('');
    try {
      await api.decideProspectMatch(subjectId, match, decision);
      setMatches((current) => (current || []).filter((item) => !(item.type === match.type && item.id === match.id)));
      setMatchMessage(p('history.matchSaved'));
    } catch (err: any) {
      console.error('Prospect match decision failed', err);
      setError(p('history.errorDecision'));
    } finally {
      setMatchBusy(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title={`${p('history.title')} ${subjectName}`} size="lg">
      <div className="space-y-6">
        <section aria-label={p('history.summary')}>
          <h3 className="text-sm font-semibold text-zinc-900">{p('history.latestByChannel')}</h3>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {(['email', 'phone', 'whatsapp'] as const).map((itemChannel) => {
              const latest = latestByChannel.get(itemChannel);
              return <div key={itemChannel} className="rounded-md border border-zinc-200 px-3 py-2 text-sm">
                <span className="text-zinc-500">{channelLabels[itemChannel]}:</span>{' '}
                <span className="font-medium text-zinc-900">{latest ? `${directionLabels[latest.direction]} · ${outcomeLabels[latest.outcome]}` : p('history.none')}</span>
              </div>;
            })}
          </div>
        </section>

        <form onSubmit={submit} className="space-y-3 border-y border-zinc-200 py-4">
          <div className="flex items-center gap-2"><Plus size={16} /><h3 className="text-sm font-semibold text-zinc-900">{p('history.registerDone')}</h3></div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-sm text-zinc-700">{p('history.channel')}
              <select aria-label={p('history.channel')} value={channel} onChange={(event) => setChannel(event.target.value as CrmChannel)} className="mt-1 h-10 w-full rounded-md border border-zinc-300 bg-white px-2 text-sm">
                {Object.entries(channelLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="text-sm text-zinc-700">{p('history.direction')}
              <select aria-label={p('history.direction')} value={direction} onChange={(event) => setDirection(event.target.value as CrmDirection)} className="mt-1 h-10 w-full rounded-md border border-zinc-300 bg-white px-2 text-sm">
                {Object.entries(directionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="text-sm text-zinc-700">{p('history.outcome')}
              <select aria-label={p('history.outcome')} value={outcome} onChange={(event) => setOutcome(event.target.value as CrmOutcome)} className="mt-1 h-10 w-full rounded-md border border-zinc-300 bg-white px-2 text-sm">
                {Object.entries(outcomeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          </div>
          <label className="block text-sm text-zinc-700">{p('history.note')} <span className="text-zinc-500">({p('history.optional')})</span>
            <textarea aria-label={p('history.note')} maxLength={500} value={notes} onChange={(event) => setNotes(event.target.value)} rows={2} className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm" />
          </label>
          <label className="block max-w-sm text-sm text-zinc-700">{p('history.nextFollowUp')} <span className="text-zinc-500">({p('history.optional')})</span>
            <input aria-label={p('history.nextFollowUp')} type="datetime-local" value={followUp} onChange={(event) => setFollowUp(event.target.value)} className="mt-1 h-10 w-full rounded-md border border-zinc-300 px-3 text-sm" />
          </label>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <Button type="submit" disabled={saving}><Plus size={15} />{saving ? p('history.saving') : p('history.register')}</Button>
        </form>

        {isAdmin && subjectType === 'prospect' && <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div><h3 className="text-sm font-semibold text-zinc-900">{p('history.matches')}</h3><p className="mt-1 text-xs text-zinc-500">{p('history.matchesHint')}</p></div>
            <Button variant="secondary" size="sm" onClick={loadMatches} disabled={matchBusy}><Link2 size={14} />{p('history.reviewMatches')}</Button>
          </div>
          {matchMessage && <p role="status" className="text-sm text-emerald-800">{matchMessage}</p>}
          {matches?.length === 0 && <p className="text-sm text-zinc-600">{p('history.noMatches')}</p>}
          {matches?.map((match) => <div key={`${match.type}:${match.id}`} className="rounded-md border border-zinc-200 p-3">
            <p className="font-medium text-zinc-900">{match.display_name}</p>
            <p className="mt-1 text-sm text-zinc-600">{match.signals.map((signal) => signal === 'email' ? p('history.emailMatch') : p('history.phoneMatch')).join(' · ')}</p>
            {!match.country_verified && <p className="mt-1 text-xs text-amber-800">{p('history.countryUnknown')}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => decideMatch(match, 'confirmed')} disabled={matchBusy}>{p('history.same')}</Button>
              <Button size="sm" variant="secondary" onClick={() => decideMatch(match, 'rejected')} disabled={matchBusy}>{p('history.different')}</Button>
            </div>
          </div>)}
        </section>}

        <section>
          <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold text-zinc-900">{p('history')}</h3><Button variant="ghost" size="sm" onClick={reload} disabled={loading}><RefreshCw size={14} />{p('refresh')}</Button></div>
          {loading && <p className="mt-3 text-sm text-zinc-500">{p('history.loading')}</p>}
          {!loading && items.length === 0 && <p className="mt-3 text-sm text-zinc-500">{p('history.empty')}</p>}
          <ol className="mt-3 space-y-3">
            {items.map((item) => <li key={item.id} className="border-l-2 border-zinc-200 pl-3">
              <p className="text-sm font-medium text-zinc-900">{channelLabels[item.channel]} · {directionLabels[item.direction]} · {outcomeLabels[item.outcome]}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-zinc-500"><Clock3 size={12} />{new Date(item.occurred_at).toLocaleString(locale)}{item.created_by_name ? ` · ${item.created_by_name}` : ''}</p>
              {item.notes && <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700">{item.notes}</p>}
              {item.follow_up_at && <p className="mt-1 flex items-center gap-1 text-xs text-zinc-600"><MessageSquare size={12} />{p('history.followUp')}: {new Date(item.follow_up_at).toLocaleString(locale)}</p>}
            </li>)}
          </ol>
        </section>
      </div>
    </Modal>
  );
}
