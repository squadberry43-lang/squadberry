import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Download,
  ExternalLink,
  Filter,
  Globe2,
  Clock3,
  Mail,
  MapPin,
  MessageSquare,
  Pause,
  Pencil,
  Play,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { CampaignStatus } from '../components/prospects/CampaignStatus';
import { ScrapeMetrics } from '../components/prospects/ScrapeMetrics';
import { ProspectContactHistory } from '../components/prospects/ProspectContactHistory';
import { Input } from '../components/ui/Input';
import { Table } from '../components/ui/Table';
import { toast } from '../components/ui/Toast';
import api, { Prospect, ProspectCampaign, ProspectCampaignCoverage, ProspectCampaignLatestTask, ProspectCampaignProgress, ProspectCampaignTask, ProspectCategory, ProspectJob, ProspectScrapeMetrics, ProspectWorkerMonitor } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { prospectCountryName as displayCountry } from '../i18n/prospects';

function scraperIndicator(
  monitor: ProspectWorkerMonitor | null,
  campaign: ProspectCampaign | undefined,
  hasError: boolean,
  t: (key: string) => string,
  locale: string,
) {
  const p = (key: string) => t(`prospects.${key}`);
  const campaignActive = campaign?.status === 'running';
  const campaignPaused = campaign?.status === 'paused';
  const isGlobal = campaign?.countries.length === 5;
  const campaignName = isGlobal ? p('global') : p('campaign');
  if (hasError) return { tone: 'amber', title: p('worker.unknownTitle'), detail: p('worker.unknownDetail') };
  if (!monitor) return { tone: 'neutral', title: p('worker.loadingTitle'), detail: p('worker.loadingDetail') };

  const { worker, current_task: task } = monitor;
  if (worker.status === 'conflict') return { tone: 'red', title: p('worker.conflictTitle'), detail: p('worker.conflictDetail') };
  if (worker.status === 'cooling') return { tone: 'amber', title: p('worker.coolingTitle'), detail: p('worker.coolingDetail') };
  if (worker.status === 'thermal_unavailable') return { tone: 'amber', title: p('worker.thermalTitle'), detail: p('worker.thermalDetail') };
  if (worker.status === 'catching_up') return {
    tone: 'amber', title: p('worker.catchupTitle'),
    detail: task?.stage === 'scan'
      ? `${(task.scan_replay_count || 0).toLocaleString(locale)} ${p('of')} ${task.processed_count.toLocaleString(locale)} ${p('worker.catchupDetail')}`
      : p('worker.catchupFallback'),
  };
  if (worker.status === 'handoff') return { tone: 'amber', title: p('worker.handoffTitle'), detail: p('worker.handoffDetail') };
  if (worker.status === 'waiting') return { tone: 'amber', title: p('worker.waitingTitle'), detail: p('worker.waitingDetail') };
  if (worker.status === 'working' && task?.task_status === 'running') {
    const lastSignal = Date.parse(task.stage === 'scan'
      ? task.scan_heartbeat_at || task.task_updated_at : task.task_updated_at);
    if (!Number.isFinite(lastSignal) || Date.now() - lastSignal > 5 * 60 * 1000) {
      return {
        tone: 'amber', title: p('worker.staleTitle'),
        detail: `${worker.owner === 'mac' ? 'Mac' : 'Ubuntu'} ${p('worker.staleDetail')}`,
      };
    }
    return {
      tone: 'green',
      title: `${campaignName} ${p('worker.activeTitle')}`,
      detail: `${worker.owner === 'mac' ? 'Mac' : 'Ubuntu'} · ${task.stage === 'scan' ? p('worker.scanning') : p('worker.processing')}`,
    };
  }
  if (worker.status === 'working') return {
    tone: 'green', title: `${campaignActive ? campaignName : 'Scraper'} ${p('worker.activeTitle')}`,
    detail: `${worker.owner === 'mac' ? 'Mac' : 'Ubuntu'} ${p('worker.connected')}`,
  };
  if (campaignPaused) return { tone: 'neutral', title: `${campaignName} ${p('worker.paused')}`, detail: p('worker.pausedDetail') };
  if (campaignActive) return { tone: 'amber', title: `${campaignName} ${p('worker.disconnected')}`, detail: p('worker.disconnectedDetail') };
  return { tone: 'neutral', title: p('worker.stoppedTitle'), detail: p('worker.stoppedDetail') };
}

const businessTypes = ['empresa', 'local', 'profesional', 'comercio', 'industria', 'servicio'];

const provinces = ['Buenos Aires', 'CABA', 'Cordoba', 'Santa Fe', 'Mendoza'];
const cities = ['Buenos Aires', 'CABA', 'La Plata', 'Mar del Plata', 'Cordoba', 'Rosario', 'Mendoza'];
const zones = [
  'Palermo',
  'Recoleta',
  'Belgrano',
  'Caballito',
  'Villa Crespo',
  'Almagro',
  'Nunez',
  'Puerto Madero',
  'San Telmo',
  'Monserrat',
  'Flores',
  'Villa Urquiza',
  'Colegiales',
  'Chacarita',
  'Retiro',
  'Microcentro',
];

function sourceLabel(prospect: Prospect, t: (key: string) => string) {
  if (prospect.source_engine === 'google_places') return 'Google Places API';
  if (prospect.source_engine === 'free_web') return t('prospects.source.free_web');
  if (prospect.source_web) return t('prospects.source.website');
  return t('prospects.source.manual');
}

function displayCampaignName(name: string, t: (key: string) => string) {
  return name === 'Búsqueda global' ? t('prospects.global') : name;
}

function verificationClass(status: Prospect['verification_status']) {
  const classes: Record<Prospect['verification_status'], string> = {
    pending: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    verified: 'bg-emerald/10 text-emerald border-emerald/20',
    incomplete: 'bg-saffron/10 text-zinc-700 border-saffron/30',
    no_email: 'bg-cobalt/10 text-cobalt border-cobalt/20',
    needs_review: 'bg-saffron/10 text-zinc-700 border-saffron/30',
    failed: 'bg-crimson/10 text-crimson border-crimson/20',
  };
  return classes[status];
}

function contactClass(status: Prospect['contact_status']) {
  const classes: Record<Prospect['contact_status'], string> = {
    new: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    contacted: 'bg-cobalt/10 text-cobalt border-cobalt/20',
    interested: 'bg-emerald/10 text-emerald border-emerald/20',
    not_interested: 'bg-crimson/10 text-crimson border-crimson/20',
    follow_up: 'bg-iris/10 text-iris border-iris/20',
  };
  return classes[status];
}

export function ProspectsPage() {
  const { user } = useAuth();
  const { t, locale, country: regionCountry } = useLocale();
  const p = (key: string) => t(`prospects.${key}`);
  const n = (value: number) => value.toLocaleString(locale);
  const date = (value: string) => new Date(value).toLocaleDateString(locale);
  const time = (value: string) => new Date(value).toLocaleTimeString(locale);
  const regionCountryName = ({ AR: 'Argentina', CL: 'Chile', ES: 'España', NL: 'Países Bajos', US: 'Estados Unidos' } as const)[regionCountry];
  const isAdmin = user?.role_name === 'admin';
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [contactProspect, setContactProspect] = useState<Prospect | null>(null);
  const [totalProspects, setTotalProspects] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 50;
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchMode, setSearchMode] = useState<'complete' | 'filtered'>(isAdmin ? 'complete' : 'filtered');
  const [businessType, setBusinessType] = useState('');
  const [rubro, setRubro] = useState('');
  const [newRubro, setNewRubro] = useState('');
  const [country, setCountry] = useState<string>(regionCountryName);
  const [catalog, setCatalog] = useState<{ countries: Array<{ code: string; name: string }>; categories: string[]; locations: Array<{ country: string; province: string | null; city: string | null; zone: string | null }> }>({ countries: [], categories: [], locations: [] });
  const [exportRefreshing, setExportRefreshing] = useState(false);
  const [exportDownloading, setExportDownloading] = useState(false);
  const [exportGeneratedAt, setExportGeneratedAt] = useState<string | null>(null);
  const [exportExpiresAt, setExportExpiresAt] = useState<string | null>(null);
  const downloadWhenReady = useRef(false);
  const [jobs, setJobs] = useState<ProspectJob[]>([]);
  const [campaigns, setCampaigns] = useState<ProspectCampaign[]>([]);
  const [scrapeMetrics, setScrapeMetrics] = useState<{ metrics: ProspectScrapeMetrics; generated_at: string } | null>(null);
  const [scrapeMetricsError, setScrapeMetricsError] = useState(false);
  const [workerMonitor, setWorkerMonitor] = useState<ProspectWorkerMonitor | null>(null);
  const [workerMonitorError, setWorkerMonitorError] = useState(false);
  const [campaignStatus, setCampaignStatus] = useState<{
    campaignId: string; progress: ProspectCampaignProgress;
    latestTask: ProspectCampaignLatestTask | null; fetchedAt: number;
  } | null>(null);
  const [campaignStatusError, setCampaignStatusError] = useState(false);
  const [campaignTasks, setCampaignTasks] = useState<ProspectCampaignTask[]>([]);
  const [campaignCoverage, setCampaignCoverage] = useState<ProspectCampaignCoverage | null>(null);
  const [selectedCoverageId, setSelectedCoverageId] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [campaignBusy, setCampaignBusy] = useState(false);
  const [managedCategories, setManagedCategories] = useState<ProspectCategory[]>([]);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [jobName, setJobName] = useState('');
  const [jobTime, setJobTime] = useState('09:00');
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [jobBusy, setJobBusy] = useState(false);
  const [province, setProvince] = useState(regionCountry === 'AR' ? 'Buenos Aires' : '');
  const [city, setCity] = useState(regionCountry === 'AR' ? 'Buenos Aires' : '');
  const [zone, setZone] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Prospect['verification_status']>('all');
  const [contactFilter, setContactFilter] = useState<'all' | Prospect['contact_status']>('all');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterProvince, setFilterProvince] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterBusinessType, setFilterBusinessType] = useState('');
  const [filterRubro, setFilterRubro] = useState('');
  const [minRating, setMinRating] = useState('');
  const [minReviews, setMinReviews] = useState('');
  const [minConfidence, setMinConfidence] = useState('');
  const [hasEmail, setHasEmail] = useState(false);
  const [hasPhone, setHasPhone] = useState(false);
  const [hasWhatsapp, setHasWhatsapp] = useState(false);
  const [hasSocial, setHasSocial] = useState(false);
  const [verificationMode, setVerificationMode] = useState<'auto' | 'always' | 'never'>('auto');
  const activeCampaign = campaigns.find((item) => item.status === 'running' || item.status === 'paused');
  const highlightedCampaignId = activeCampaign?.id || campaigns[0]?.id;

  useEffect(() => {
    setCountry(regionCountryName);
    setProvince(regionCountry === 'AR' ? 'Buenos Aires' : '');
    setCity(regionCountry === 'AR' ? 'Buenos Aires' : '');
    setZone('');
  }, [regionCountry]);

  const stats = useMemo(() => {
    const withEmail = prospects.filter((prospect) => Boolean(prospect.email)).length;
    const withPhone = prospects.filter((prospect) => Boolean(prospect.phone_web || prospect.phone_google)).length;
    const withWhatsapp = prospects.filter((prospect) => Boolean(prospect.whatsapp)).length;
    const needsReview = prospects.filter((prospect) => prospect.verification_status === 'needs_review' || prospect.verification_status === 'pending').length;

    return [
      { label: p('onPage'), value: prospects.length, icon: Search },
      { label: p('withEmail'), value: withEmail, icon: Mail },
      { label: p('withPhone'), value: withPhone, icon: Phone },
      { label: p('toReview'), value: needsReview, icon: ShieldCheck },
      { label: 'WhatsApp', value: withWhatsapp, icon: Globe2 },
    ];
  }, [prospects, locale]);

  useEffect(() => {
    loadProspects('all', '', 1);
    api.getProspectCatalog().then(setCatalog).catch(() => toast(p('error.catalog'), 'error'));
    api.getProspectExportStatus().then((status) => {
      setExportRefreshing(Boolean(status.refreshing));
      setExportGeneratedAt(status.generated_at);
      setExportExpiresAt(status.expires_at);
    }).catch(() => {});
    if (isAdmin) {
      api.getProspectJobs().then((data) => setJobs(data.jobs)).catch(() => toast(p('error.jobs'), 'error'));
      api.getProspectCampaigns().then((data) => setCampaigns(data.campaigns)).catch(() => toast(p('error.campaigns'), 'error'));
      api.getManagedProspectCategories().then((data) => setManagedCategories(data.categories)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!exportRefreshing) return;
    const timer = window.setInterval(() => {
      api.getProspectExportStatus().then((status) => {
        setExportGeneratedAt(status.generated_at);
        setExportExpiresAt(status.expires_at);
        if (status.refreshing) return;
        setExportRefreshing(false);
        if (status.error) {
          downloadWhenReady.current = false;
          toast(p('exportFailed'), 'error');
        } else if (status.exists && downloadWhenReady.current) {
          downloadWhenReady.current = false;
          downloadWorkbook();
        }
      }).catch(() => {});
    }, 10000);
    return () => window.clearInterval(timer);
  }, [exportRefreshing, locale]);

  useEffect(() => {
    if (!isAdmin) return;
    const refreshStatus = () => {
      if (!highlightedCampaignId) return;
      api.getProspectCampaignStatus(highlightedCampaignId)
        .then((data) => {
          setCampaignStatus({ campaignId: highlightedCampaignId,
            progress: data.progress, latestTask: data.latest_task, fetchedAt: Date.now() });
          setCampaignStatusError(false);
        })
        .catch(() => setCampaignStatusError(true));
    };
    const refreshCampaigns = () => {
      if (document.hidden) return;
      api.getProspectCampaigns().then((data) => setCampaigns(data.campaigns)).catch(() => {});
      api.getProspectScrapeMetrics().then((data) => {
        setScrapeMetrics(data);
        setScrapeMetricsError(false);
      }).catch(() => setScrapeMetricsError(true));
      refreshStatus();
      if (selectedCampaignId) api.getProspectCampaignTasks(selectedCampaignId)
        .then((data) => setCampaignTasks(data.tasks)).catch(() => {});
    };
    refreshCampaigns();
    const timer = window.setInterval(refreshCampaigns, 30000);
    document.addEventListener('visibilitychange', refreshCampaigns);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refreshCampaigns);
    };
  }, [isAdmin, highlightedCampaignId, selectedCampaignId]);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    const refresh = () => {
      if (document.hidden) return;
      api.getProspectWorkerStatus().then((result) => {
        if (active) {
          setWorkerMonitor(result);
          setWorkerMonitorError(false);
        }
      }).catch(() => { if (active) setWorkerMonitorError(true); });
    };
    refresh();
    const timer = window.setInterval(refresh, 30000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      active = false;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [isAdmin]);

  const refreshJobs = async () => setJobs((await api.getProspectJobs()).jobs);
  const refreshCampaigns = async () => setCampaigns((await api.getProspectCampaigns()).campaigns);

  const toggleCoverage = async (id: string) => {
    if (selectedCoverageId === id) { setSelectedCoverageId(null); return; }
    setSelectedCoverageId(id);
    setCampaignCoverage(null);
    try { setCampaignCoverage(await api.getProspectCampaignCoverage(id)); }
    catch { toast(p('error.coverage'), 'error'); }
  };

  const addRubro = async () => {
    try {
      const { category } = await api.addProspectCategory(newRubro.trim());
      setCatalog(await api.getProspectCatalog());
      setManagedCategories((await api.getManagedProspectCategories()).categories);
      setRubro(category.name);
      setNewRubro('');
      toast(p('categoryAdded'), 'success');
    } catch (err) { console.error('Prospect category create failed', err); toast(p('error.addCategory'), 'error'); }
  };

  const startGlobalSearch = async () => {
    setCampaignBusy(true);
    try {
      if (activeCampaign) {
        const { addedCountries } = await api.expandProspectCampaign(activeCampaign.id);
        toast(addedCountries.length
          ? `${addedCountries.length} ${p('countriesAdded')}`
          : p('alreadyRunning'), 'success');
      } else {
        await api.createProspectCampaign({ name: 'Búsqueda global' });
        toast(p('globalStarted'), 'success');
      }
      await refreshCampaigns();
    } catch (err) { console.error('Prospect campaign start failed', err); toast(p('error.startCampaign'), 'error'); }
    finally { setCampaignBusy(false); }
  };

  const changeCampaign = async (campaign: ProspectCampaign, status: 'paused' | 'running' | 'cancelled' | 'retry') => {
    setCampaignBusy(true);
    try {
      if (status === 'retry') await api.retryProspectCampaign(campaign.id);
      else await api.updateProspectCampaign(campaign.id, status);
      await refreshCampaigns();
    } catch (err) { console.error('Prospect campaign update failed', err); toast(p('error.updateCampaign'), 'error'); }
    finally { setCampaignBusy(false); }
  };

  const changeCategory = async (category: ProspectCategory, data: Partial<Pick<ProspectCategory, 'name' | 'active' | 'approved'>>) => {
    try {
      await api.updateProspectCategory(category.id, data);
      setManagedCategories((await api.getManagedProspectCategories()).categories);
      setCatalog(await api.getProspectCatalog());
    } catch (err) { console.error('Prospect category update failed', err); toast(p('error.updateCategory'), 'error'); }
  };

  const createJob = async () => {
    if (!jobName.trim() || !rubro || !country) {
      toast(p('error.jobRequired'), 'error');
      return;
    }
    setJobBusy(true);
    try {
      const data = { name: jobName.trim(), category: rubro, business_type: businessType,
        country, province, city, zone, verification_mode: verificationMode, local_time: jobTime };
      if (editingJobId) await api.updateProspectJob(editingJobId, data);
      else await api.createProspectJob(data);
      setJobName('');
      setEditingJobId(null);
      await refreshJobs();
      toast(editingJobId ? p('jobUpdated') : p('jobScheduled'), 'success');
    } catch (err) { console.error('Prospect job scheduling failed', err); toast(p('error.schedule'), 'error'); }
    finally { setJobBusy(false); }
  };

  const editJob = (job: ProspectJob) => {
    setEditingJobId(job.id);
    setJobName(job.name);
    setJobTime(job.local_time.slice(0, 5));
    setRubro(job.category);
    setBusinessType(job.business_type || 'empresa');
    setCountry(job.country);
    setProvince(job.province || '');
    setCity(job.city || '');
    setZone(job.zone || '');
    setVerificationMode(job.verification_mode);
  };

  const changeJob = async (job: ProspectJob, action: 'toggle' | 'delete' | 'run') => {
    setJobBusy(true);
    try {
      if (action === 'toggle') await api.setProspectJobActive(job.id, !job.active);
      if (action === 'delete') await api.deleteProspectJob(job.id);
      if (action === 'run') {
        const result = await api.runProspectJob(job.id);
        toast(`${result.counts.created} ${p('jobFoundNew')} ${result.counts.updated} ${p('jobFoundUpdated')}`, 'success');
        await loadProspects(statusFilter, searchFilter, 1);
      }
      await refreshJobs();
    } catch (err) { console.error('Prospect job update failed', err); toast(p('error.updateJob'), 'error'); }
    finally { setJobBusy(false); }
  };

  const availableLocations = catalog.locations.filter((item) => item.country === country);
  const locationOptions = (field: 'province' | 'city' | 'zone') => [...new Set(availableLocations.map((item) => item[field]).filter((value): value is string => Boolean(value)))];

  const loadProspects = async (nextStatus = statusFilter, nextSearch = searchFilter, nextPage = page) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (nextSearch) params.search = nextSearch;
      if (nextStatus !== 'all') params.status = nextStatus;
      if (contactFilter !== 'all') params.contact_status = contactFilter;
      if (filterCountry) params.country = filterCountry;
      if (filterProvince) params.province = filterProvince;
      if (filterCity) params.city = filterCity;
      if (filterZone) params.zone = filterZone;
      if (filterBusinessType) params.business_type = filterBusinessType;
      if (filterRubro) params.category = filterRubro;
      if (minRating) params.min_rating = minRating;
      if (minReviews) params.min_reviews = minReviews;
      if (minConfidence) params.min_confidence = minConfidence;
      if (hasEmail) params.has_email = 'true';
      if (hasPhone) params.has_phone = 'true';
      if (hasWhatsapp) params.has_whatsapp = 'true';
      if (hasSocial) params.has_social = 'true';
      params.page = String(nextPage);
      params.limit = String(pageSize);
      const response = await api.getProspects(params);
      setProspects(response.prospects);
      setTotalProspects(response.total);
      setPage(response.page);
    } catch (err) {
      console.error('Prospect list load failed', err);
      toast(p('error.load'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFreeSearch = async () => {
    setSearching(true);
    try {
      const results = await api.searchWebProspects({
        query: rubro,
        businessType,
        rubro,
        country,
        province,
        city,
        zone,
        verificationMode,
        verifyWebsite: verificationMode !== 'never',
      });
      await loadProspects(statusFilter, searchFilter, 1);
      toast(`${results.length} ${p('searchFound')}`, 'success');
    } catch (err) {
      console.error('Prospect search failed', err);
      toast(p('error.search'), 'error');
    } finally {
      setSearching(false);
    }
  };

  const handleVerify = async (prospect: Prospect) => {
    if (!prospect.website) {
      toast(p('error.noWebsite'), 'error');
      return;
    }
    try {
      const updated = await api.verifyProspect(prospect.id);
      setProspects((items) => items.map((item) => (item.id === updated.id ? updated : item)));
      toast(p('prospectVerified'), 'success');
    } catch (err) {
      console.error('Prospect website verification failed', err);
      toast(p('error.verifyWebsite'), 'error');
    }
  };

  const handleContactStatus = async (prospect: Prospect, contact_status: Prospect['contact_status']) => {
    try {
      const updated = await api.updateProspect(prospect.id, { contact_status });
      setProspects((items) => items.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      console.error('Prospect status update failed', err);
      toast(p('error.updateStatus'), 'error');
    }
  };

  const downloadWorkbook = async () => {
    setExportDownloading(true);
    try {
      const response = await api.downloadProspectsWorkbook();
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'doctor-tech-prospectos.xlsx';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      const status = await api.getProspectExportStatus();
      setExportGeneratedAt(status.generated_at);
      setExportExpiresAt(status.expires_at);
    } catch (err) {
      console.error('Prospect export download failed', err);
      toast(p('error.download'), 'error');
    } finally {
      setExportDownloading(false);
    }
  };

  const exportExcel = async () => {
    try {
      const status = await api.requestProspectsWorkbook();
      setExportGeneratedAt(status.generated_at);
      setExportExpiresAt(status.expires_at);
      if (status.exists) return downloadWorkbook();
      downloadWhenReady.current = true;
      setExportRefreshing(true);
      toast(p('exportRefreshing'), 'info');
    } catch (err) {
      console.error('Prospect export request failed', err);
      toast(p('exportFailed'), 'error');
    }
  };

  const scraperStatus = scraperIndicator(workerMonitor, activeCampaign, workerMonitorError, t, locale);
  const scraperTone = scraperStatus.tone === 'green'
    ? 'border-green-200 bg-green-50 text-green-950'
    : scraperStatus.tone === 'amber'
      ? 'border-amber-200 bg-amber-50 text-amber-950'
      : scraperStatus.tone === 'red'
        ? 'border-red-200 bg-red-50 text-red-950'
        : 'border-zinc-200 bg-zinc-50 text-zinc-800';

  return (
    <div className="min-h-screen bg-[#f5f5f7] p-4 sm:p-6">
      <header className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">Marketing</p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-950">{p('title')}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
            {p('lead')}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" onClick={() => loadProspects()} disabled={loading}>
            <RefreshCw size={16} />
            {p('refresh')}
          </Button>
          <Button variant="secondary" onClick={exportExcel} disabled={exportRefreshing || exportDownloading}>
            {exportRefreshing ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
            {p('download')}
          </Button>
        </div>
      </header>

      {(exportRefreshing || exportExpiresAt) && <p className="mb-4 text-xs text-zinc-600" role="status">
        {exportRefreshing ? p('exportRefreshing') : `${p('exportGenerated')} ${new Date(exportGeneratedAt!).toLocaleString(locale)} · ${p('exportExpires')} ${new Date(exportExpiresAt!).toLocaleString(locale)}`}
      </p>}

      {isAdmin && <section className="mb-5 border-y border-zinc-200 bg-white px-4 py-4" aria-live="polite">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase text-zinc-500">{p('scraperStatus')}</p>
            <div data-testid="scraper-state" className={`mt-2 inline-flex max-w-full flex-col gap-1 rounded-md border px-3 py-2 ${scraperTone}`} role="status">
              <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full ${scraperStatus.tone === 'green' ? 'bg-green-600' : scraperStatus.tone === 'amber' ? 'bg-amber-500' : scraperStatus.tone === 'red' ? 'bg-red-600' : 'bg-zinc-400'}`} />
                {scraperStatus.title}
              </span>
              <span className="text-sm leading-5">{scraperStatus.detail}</span>
            </div>
            {workerMonitor?.current_task && <p className="mt-1 text-sm text-zinc-600">
              {workerMonitor.current_task.stage === 'scan' ? p('extractReading') : p('processingBusinesses')}
              {' · '}{displayCountry(workerMonitor.current_task.country, t)}{workerMonitor.current_task.city ? ` · ${workerMonitor.current_task.city}` : ''}
              {workerMonitor.current_task.category ? ` · ${workerMonitor.current_task.category}` : ''}
              {' · '}{n(workerMonitor.current_task.processed_count)} {workerMonitor.current_task.stage === 'scan'
                ? p('detectedNotSaved')
                : `${p('reviewed')} · ${n(workerMonitor.current_task.new_count)} ${p('new')} · ${n(workerMonitor.current_task.updated_count)} ${p('updated')}`}
            </p>}
            {workerMonitor?.progress && <p className="mt-1 text-xs text-zinc-500">
              {p('campaign')} {workerMonitor.current_task?.campaign_name ? displayCampaignName(workerMonitor.current_task.campaign_name, t) : activeCampaign?.name ? displayCampaignName(activeCampaign.name, t) : p('active')}: {n(workerMonitor.progress.completed)} {p('of')} {n(workerMonitor.progress.total)} {p('tasks')} · {n(workerMonitor.progress.pending)} {p('pending')} · {n(workerMonitor.progress.failed)} {p('failed')}
            </p>}
          </div>
          <p className="shrink-0 text-xs text-zinc-500">
            {workerMonitor?.worker.checked_at ? `${p('checked')} ${time(workerMonitor.worker.checked_at)}` : p('notChecked')}
          </p>
        </div>
      </section>}

      {isAdmin && <div className="mb-4 inline-flex gap-1 border-b border-zinc-200" role="tablist" aria-label={p('searchMode')}>
        <button type="button" role="tab" aria-selected={searchMode === 'complete'} onClick={() => setSearchMode('complete')}
          className={`px-4 py-3 text-sm font-medium ${searchMode === 'complete' ? 'border-b-2 border-[#0071e3] text-zinc-950' : 'text-zinc-600 hover:text-zinc-950'}`}>
          {p('global')}
        </button>
        <button type="button" role="tab" aria-selected={searchMode === 'filtered'} onClick={() => setSearchMode('filtered')}
          className={`px-4 py-3 text-sm font-medium ${searchMode === 'filtered' ? 'border-b-2 border-[#0071e3] text-zinc-950' : 'text-zinc-600 hover:text-zinc-950'}`}>
          {p('filtered')}
        </button>
      </div>}

      {isAdmin && searchMode === 'complete' && scrapeMetrics && <ScrapeMetrics
        metrics={scrapeMetrics.metrics} generatedAt={scrapeMetrics.generated_at}
        currentTask={workerMonitor?.current_task || null} workerStatus={workerMonitor?.worker.status || null} />}
      {isAdmin && searchMode === 'complete' && !scrapeMetrics && scrapeMetricsError && <p className="mb-4 text-sm text-amber-800" role="status">
        {p('metricsUnavailable')}
      </p>}
      {isAdmin && searchMode === 'complete' && scrapeMetrics && scrapeMetricsError && <p className="mb-3 text-xs text-amber-800" role="status">
        {p('metricsStale')}
      </p>}

      {isAdmin && searchMode === 'complete' && <section className="mb-4 border-y border-zinc-200 bg-white px-4 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-zinc-950">{p('global')}</h2>
            <p className="mt-1 max-w-2xl text-sm text-zinc-600">{p('globalLead')}</p>
          </div>
          <Button onClick={startGlobalSearch} disabled={campaignBusy || Boolean(activeCampaign && activeCampaign.countries.length === 5)}>
            <Search size={16} /> {activeCampaign ? activeCampaign.countries.length === 5 ? p('globalRunning') : p('globalExpand') : p('globalStart')}
          </Button>
        </div>
        {campaigns.length > 0 && <div className="mt-5 divide-y divide-zinc-200 border-t border-zinc-200">
          {campaigns.map((campaign) => <div key={campaign.id} className="py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-zinc-950">{displayCampaignName(campaign.name, t)} · {p('cycle')} {campaign.cycle}</p>
                <p className="mt-1 text-xs text-zinc-600">{campaign.countries.map((name) => displayCountry(name, t)).join(', ')} · {n(campaign.new_count)} {p('new')} · {n(campaign.updated_count)} {p('updated')}</p>
                {campaign.next_run_at && <p className="mt-1 text-xs text-zinc-500">{p('nextReview')}: {date(campaign.next_run_at)}</p>}
              </div>
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="ghost" onClick={() => toggleCoverage(campaign.id)}
                  title={p('coverageTitle')}>
                  {selectedCoverageId === campaign.id ? p('hideCoverage') : p('coverage')}
                </Button>
                <Button size="sm" variant="ghost" onClick={async () => {
                  if (selectedCampaignId === campaign.id) { setSelectedCampaignId(null); return; }
                  setSelectedCampaignId(campaign.id);
                  setCampaignTasks((await api.getProspectCampaignTasks(campaign.id)).tasks);
                }} title={selectedCampaignId === campaign.id ? p('hideActivity') : p('activity')}>
                  {selectedCampaignId === campaign.id ? p('hideActivity') : p('activity')}
                </Button>
                {campaign.status === 'running' && <Button size="sm" variant="ghost" onClick={() => changeCampaign(campaign, 'paused')} disabled={campaignBusy} title={p('pause')} aria-label={`${p('pause')} ${campaign.name}`}><Pause size={15} /></Button>}
                {campaign.status === 'paused' && <Button size="sm" variant="ghost" onClick={() => changeCampaign(campaign, 'running')} disabled={campaignBusy} title={p('resume')} aria-label={`${p('resume')} ${campaign.name}`}><Play size={15} /></Button>}
                {campaign.status === 'completed_with_errors' && <Button size="sm" variant="ghost" onClick={() => changeCampaign(campaign, 'retry')} disabled={campaignBusy} title={p('retryFailures')}><RefreshCw size={15} /> {p('retry')}</Button>}
                {(campaign.status === 'running' || campaign.status === 'paused') && <Button size="sm" variant="ghost" onClick={() => changeCampaign(campaign, 'cancelled')} disabled={campaignBusy} title={p('cancel')} aria-label={`${p('cancel')} ${campaign.name}`}><Trash2 size={15} /></Button>}
              </div>
            </div>
            {highlightedCampaignId === campaign.id && campaignStatus?.campaignId === campaign.id
              && <CampaignStatus campaign={campaign} progress={campaignStatus.progress}
                latestTask={campaignStatus.latestTask} fetchedAt={campaignStatus.fetchedAt} />}
            {highlightedCampaignId === campaign.id && campaignStatus?.campaignId !== campaign.id
              && <p className="mt-4 border-t border-zinc-200 pt-4 text-sm text-zinc-600">
                {campaignStatusError ? p('statusUnavailable') : p('statusLoading')}
              </p>}
            {highlightedCampaignId === campaign.id && campaignStatus?.campaignId === campaign.id && campaignStatusError
              && <p className="mt-2 text-xs text-amber-800" role="status">{p('statusStale')}</p>}
            {selectedCoverageId === campaign.id && <div className="mt-4 border-t border-zinc-200 pt-4">
              <h3 className="text-sm font-semibold text-zinc-950">{p('coverageByCountry')}</h3>
              {!campaignCoverage && <p className="mt-2 text-sm text-zinc-600">{p('coverageLoading')}</p>}
              {campaignCoverage && <>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-xs">
                    <thead className="border-b border-zinc-200 text-zinc-500">
                      <tr>{['country', 'status', 'sectorsPending', 'failedTasks', 'newPlural', 'updatedPlural', 'phones', 'emails', 'verifiedContacts', 'conflicts'].map((key) =>
                        <th key={key} className="whitespace-nowrap px-2 py-2 font-medium">{p(key)}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {campaignCoverage.countries.map((item) => <tr key={item.country}>
                        <th scope="row" className="whitespace-nowrap px-2 py-2 font-medium text-zinc-900">{displayCountry(item.country, t)}</th>
                        <td className="px-2 py-2 text-zinc-700">{item.uncovered_reason === 'area_catalog_missing' ? p('missingCatalog') : item.failed ? p('withFailures') : item.pending || item.running || item.sector_backlog || item.untranslated_categories || item.unparented_places ? p('inProgress') : p('reviewedStatus')}</td>
                        <td className="px-2 py-2">{item.sector_backlog == null ? p('noData') : n(item.sector_backlog)}</td>
                        <td className="px-2 py-2">{item.failed}</td>
                        <td className="px-2 py-2">{item.new_count || 0}</td>
                        <td className="px-2 py-2">{item.updated_count || 0}</td>
                        <td className="px-2 py-2">{item.with_phone || 0}</td>
                        <td className="px-2 py-2">{item.with_email || 0}</td>
                        <td className="px-2 py-2">{item.verified_contacts || 0}</td>
                        <td className="px-2 py-2">{item.country_conflicts || 0}</td>
                      </tr>)}
                    </tbody>
                  </table>
                </div>
                {campaignCoverage.countries.some((item) => item.untranslated_categories > 0) &&
                  <p className="mt-2 text-xs text-zinc-600">{p('untranslatedCategories')}</p>}
                <p className="mt-2 text-xs text-zinc-500">{p('areas')}: {campaignCoverage.attribution.areas}. {p('businesses')}: {campaignCoverage.attribution.businesses}.</p>
              </>}
            </div>}
            {selectedCampaignId === campaign.id && <div className="mt-3 border-t border-zinc-100 pt-2 text-xs text-zinc-600">
              {campaignTasks.map((task) => <p key={task.id} className="py-1">{[displayCountry(task.country, t), task.province, task.city, task.zone, task.business_type, task.category].filter(Boolean).join(' · ')}: {task.stage === 'scan' ? `${p('reading')} · ` : ''}{p(`task${task.status.charAt(0).toUpperCase()}${task.status.slice(1)}`)} · {task.processed_count} {p('reviewed')} · {task.new_count} {p('new')}{task.last_error ? ` · ${task.last_error}` : ''}</p>)}
              {campaign.total_tasks > 100 && <p className="py-2 text-zinc-500">{p('recentTasks')}</p>}
            </div>}
          </div>)}
        </div>}
      </section>}

      {searchMode === 'filtered' && <section className="mb-4 border-y border-zinc-200 bg-white px-4 py-5">
        <div className="mb-4 flex items-center gap-2">
          <Search size={18} className="text-iris" />
          <h2 className="text-base font-semibold text-zinc-950">{p('newSearch')}</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <select aria-label={p('businessType')} value={businessType} onChange={(e) => setBusinessType(e.target.value)} className="h-[42px] rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-iris focus:outline-none focus:ring-2 focus:ring-iris/30">
            <option value="">{p('anyType')}</option>
            {businessTypes.map((type) => <option key={type} value={type}>{p(`type.${type}`)}</option>)}
          </select>
          <select aria-label={p('category')} value={rubro} onChange={(e) => setRubro(e.target.value)} className="h-[42px] rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-700">
            <option value="">{p('allCategories')}</option>
            {catalog.categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select aria-label={p('country')} value={country} onChange={(e) => { setCountry(e.target.value); setProvince(''); setCity(''); setZone(''); }} className="h-[42px] rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-700">
            {catalog.countries.map((item) => <option key={item.code} value={item.name}>{displayCountry(item.name, t)}</option>)}
          </select>
          <div>
            <Input aria-label={p('province')} list="prospect-provinces" value={province} onChange={(e) => setProvince(e.target.value)} placeholder={p('provincePlaceholder')} />
            <datalist id="prospect-provinces">
              {(country === 'Argentina' ? [...new Set([...provinces, ...locationOptions('province')])] : locationOptions('province')).map((item) => <option key={item} value={item} />)}
            </datalist>
          </div>
          <div>
            <Input aria-label={p('city')} list="prospect-cities" value={city} onChange={(e) => setCity(e.target.value)} placeholder={p('city')} />
            <datalist id="prospect-cities">
              {(country === 'Argentina' ? [...new Set([...cities, ...locationOptions('city')])] : locationOptions('city')).map((item) => <option key={item} value={item} />)}
            </datalist>
          </div>
          <div>
            <Input aria-label={p('zone')} list="prospect-zones" value={zone} onChange={(e) => setZone(e.target.value)} placeholder={p('zonePlaceholder')} />
            <datalist id="prospect-zones">
              {(country === 'Argentina' ? [...new Set([...zones, ...locationOptions('zone')])] : locationOptions('zone')).map((item) => <option key={item} value={item} />)}
            </datalist>
          </div>
          <select aria-label={p('websiteVerification')} value={verificationMode} onChange={(e) => setVerificationMode(e.target.value as 'auto' | 'always' | 'never')} className="h-[42px] rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-iris focus:outline-none focus:ring-2 focus:ring-iris/30">
            <option value="auto">{p('verifyIfWebsite')}</option>
            <option value="always">{p('verifyBackground')}</option>
            <option value="never">{p('doNotVerify')}</option>
          </select>
          <Button onClick={handleFreeSearch} disabled={searching} className="h-[42px]">
            <Search size={16} />
            {searching ? p('searching') : p('search200')}
          </Button>
        </div>
        {isAdmin && <div className="mt-3 flex max-w-md gap-2">
          <Input aria-label={p('newCategory')} value={newRubro} onChange={(e) => setNewRubro(e.target.value)} placeholder={p('newCategory')} />
          <Button variant="secondary" onClick={addRubro} disabled={newRubro.trim().length < 3}>{p('add')}</Button>
        </div>}
      </section>}

      {isAdmin && searchMode === 'filtered' && <section className="mb-4 border-t border-zinc-200 bg-white px-4 py-5">
        <div className="mb-4 flex items-center gap-2">
          <Clock3 size={18} className="text-zinc-700" />
          <h2 className="text-base font-semibold text-zinc-950">{p('dailySearches')}</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_130px_auto]">
          <Input aria-label={p('dailyName')} value={jobName} onChange={(e) => setJobName(e.target.value)} placeholder={p('dailyNamePlaceholder')} />
          <Input aria-label={p('localTime')} type="time" value={jobTime} onChange={(e) => setJobTime(e.target.value)} />
          <Button onClick={createJob} disabled={jobBusy || !catalog.categories.length}>{editingJobId ? p('saveChanges') : p('schedule')}</Button>
        </div>
        {editingJobId && <Button size="sm" variant="ghost" onClick={() => { setEditingJobId(null); setJobName(''); }}>{p('cancelEdit')}</Button>}
        <p className="mt-2 text-xs text-zinc-500">{p('jobHint')}</p>
        {jobs.length > 0 && <div className="mt-4 divide-y divide-zinc-100 border-t border-zinc-200">
          {jobs.map((job) => <div key={job.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-900">{job.name} <span className="font-normal text-zinc-500">· {job.category} · {job.country}</span></p>
              <p className="text-xs text-zinc-500">{job.active ? p('jobActive') : p('jobPaused')} · {job.local_time.slice(0, 5)} · {p('next')}: {job.next_run_at ? new Date(job.next_run_at).toLocaleString(locale) : '-'}</p>
              {job.last_error && <p className="text-xs text-red-700">{job.last_error}</p>}
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => editJob(job)} disabled={jobBusy} title={p('edit')} aria-label={`${p('edit')} ${job.name}`}><Pencil size={15} /></Button>
              <Button size="sm" variant="ghost" onClick={() => changeJob(job, 'run')} disabled={jobBusy} title={p('runNow')} aria-label={`${p('run')} ${job.name} · ${p('runNow')}`}><Play size={15} /></Button>
              <Button size="sm" variant="ghost" onClick={() => changeJob(job, 'toggle')} disabled={jobBusy} title={job.active ? p('pause') : p('resume')} aria-label={`${job.active ? p('pause') : p('resume')} ${job.name}`}>{job.active ? <Pause size={15} /> : <Play size={15} />}</Button>
              <Button size="sm" variant="ghost" onClick={() => changeJob(job, 'delete')} disabled={jobBusy} title={p('delete')} aria-label={`${p('delete')} ${job.name}`}><Trash2 size={15} /></Button>
            </div>
          </div>)}
        </div>}
      </section>}

      {isAdmin && <details className="mb-4 border-y border-zinc-200 bg-white px-4 py-4">
        <summary className="cursor-pointer text-sm font-semibold text-zinc-950">{p('manageCategories')} ({managedCategories.length})</summary>
        <div className="mt-3 max-h-80 overflow-y-auto divide-y divide-zinc-100">
          {managedCategories.map((category) => <div key={category.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
            <div>
              <span className="font-medium text-zinc-900">{category.name}</span>
              <span className="ml-2 text-xs text-zinc-500">{category.business_count} {p('businesses')} · {category.source}{!category.approved ? ` · ${p('approvalPending')}` : ''}{!category.active ? ` · ${p('inactive')}` : ''}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!category.approved && <Button size="sm" variant="ghost" onClick={() => changeCategory(category, { approved: true })}>{p('approve')}</Button>}
              <Button size="sm" variant="ghost" onClick={() => changeCategory(category, { active: !category.active })}>{category.active ? p('deactivate') : p('activate')}</Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditingCategoryId(category.id); setEditCategoryName(category.name); }} title={p('rename')} aria-label={`${p('rename')} ${category.name}`}><Pencil size={14} /></Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditingCategoryId(`merge:${category.id}`); setMergeTargetId(''); }}>{p('merge')}</Button>
            </div>
            {editingCategoryId === category.id && <div className="flex w-full gap-2">
              <Input aria-label={`${p('newNameOf')} ${category.name}`} value={editCategoryName} onChange={(e) => setEditCategoryName(e.target.value)} />
              <Button size="sm" onClick={async () => { await changeCategory(category, { name: editCategoryName }); setEditingCategoryId(null); }}>{p('save')}</Button>
            </div>}
            {editingCategoryId === `merge:${category.id}` && <div className="flex w-full flex-wrap gap-2">
              <select aria-label={`${p('merge')} ${category.name} · ${p('mergeInto')}`} value={mergeTargetId} onChange={(e) => setMergeTargetId(e.target.value)} className="h-10 rounded-md border border-zinc-300 bg-white px-2 text-sm">
                <option value="">{p('chooseTarget')}</option>
                {managedCategories.filter((item) => item.id !== category.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <Button size="sm" disabled={!mergeTargetId} onClick={async () => {
                try { await api.mergeProspectCategories(category.id, mergeTargetId);
                  setManagedCategories((await api.getManagedProspectCategories()).categories);
                  setCatalog(await api.getProspectCatalog()); setEditingCategoryId(null);
                } catch (err) { console.error('Prospect category merge failed', err); toast(p('error.merge'), 'error'); }
              }}>{p('merge')}</Button>
            </div>}
          </div>)}
        </div>
      </details>}

      <section className="mb-4 flex gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-5 md:overflow-visible" aria-label={p('resultsSummary')}>
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="min-w-[138px] flex-1 rounded-lg border border-zinc-900/10 bg-white p-3 md:min-w-0 md:p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-zinc-500">{item.label}</p>
                <Icon size={17} className="text-iris" />
              </div>
              <p className="mt-2 font-mono text-2xl font-semibold text-zinc-950 md:mt-3 md:text-3xl">{item.value}</p>
            </div>
          );
        })}
      </section>

      <section className="mb-4 rounded-lg border border-zinc-900/10 bg-white p-4">
        <div className="mb-4 flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-iris" />
            <h2 className="text-base font-semibold text-zinc-950">{p('savedFilters')}</h2>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              aria-label={p('searchSaved')}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder={p('searchPlaceholder')}
              className="sm:w-72"
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                const status = e.target.value as 'all' | Prospect['verification_status'];
                setStatusFilter(status);
              }}
              aria-label={p('verificationStatus')}
              className="h-[42px] rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-iris focus:outline-none focus:ring-2 focus:ring-iris/30"
            >
              <option value="all">{p('all')}</option>
              <option value="verified">{p('verifiedPlural')}</option>
              <option value="needs_review">{p('reviewOption')}</option>
              <option value="no_email">{p('noEmail')}</option>
              <option value="failed">{p('failedPlural')}</option>
              <option value="pending">{p('pendingPlural')}</option>
            </select>
            <select
              value={contactFilter}
              onChange={(e) => setContactFilter(e.target.value as 'all' | Prospect['contact_status'])}
              aria-label={p('followUpStatus')}
              className="h-[42px] rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-iris focus:outline-none focus:ring-2 focus:ring-iris/30"
            >
              <option value="all">{p('allFollowUp')}</option>
              <option value="new">{p('contact.new')}</option>
              <option value="contacted">{p('contacted')}</option>
              <option value="interested">{p('interested')}</option>
              <option value="not_interested">{p('notInterested')}</option>
              <option value="follow_up">{p('followUp')}</option>
            </select>
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-4">
          <select aria-label={p('filterCountry')} value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)} className="h-[42px] rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-700">
            <option value="">{p('allCountries')}</option>
            {catalog.countries.map((item) => <option key={item.code} value={item.name}>{displayCountry(item.name, t)}</option>)}
          </select>
          <Input aria-label={p('filterProvince')} value={filterProvince} onChange={(e) => setFilterProvince(e.target.value)} placeholder={p('filterProvince')} />
          <Input aria-label={p('filterCity')} value={filterCity} onChange={(e) => setFilterCity(e.target.value)} placeholder={p('filterCity')} />
          <Input aria-label={p('filterZone')} value={filterZone} onChange={(e) => setFilterZone(e.target.value)} placeholder={p('filterZone')} />
          <Input aria-label={p('filterType')} value={filterBusinessType} onChange={(e) => setFilterBusinessType(e.target.value)} placeholder={p('filterTypePlaceholder')} />
          <select aria-label={p('filterCategory')} value={filterRubro} onChange={(e) => setFilterRubro(e.target.value)} className="h-[42px] rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-700">
            <option value="">{p('allCategories')}</option>
            {catalog.categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <Input aria-label={p('minStars')} type="number" min={0} max={5} step="0.1" value={minRating} onChange={(e) => setMinRating(e.target.value)} placeholder={p('minStarsPlaceholder')} />
          <Input aria-label={p('minReviews')} type="number" min={0} value={minReviews} onChange={(e) => setMinReviews(e.target.value)} placeholder={p('minReviewsPlaceholder')} />
          <Input aria-label={p('minConfidence')} type="number" min={0} max={100} value={minConfidence} onChange={(e) => setMinConfidence(e.target.value)} placeholder={p('minConfidencePlaceholder')} />
          <label className="flex h-[42px] items-center gap-2 rounded-lg border border-zinc-200 px-3 text-sm text-zinc-600"><input type="checkbox" checked={hasEmail} onChange={(e) => setHasEmail(e.target.checked)} />{p('withEmail')}</label>
          <label className="flex h-[42px] items-center gap-2 rounded-lg border border-zinc-200 px-3 text-sm text-zinc-600"><input type="checkbox" checked={hasPhone} onChange={(e) => setHasPhone(e.target.checked)} />{p('withPhone')}</label>
          <label className="flex h-[42px] items-center gap-2 rounded-lg border border-zinc-200 px-3 text-sm text-zinc-600"><input type="checkbox" checked={hasWhatsapp} onChange={(e) => setHasWhatsapp(e.target.checked)} />{p('withWhatsapp')}</label>
          <label className="flex h-[42px] items-center gap-2 rounded-lg border border-zinc-200 px-3 text-sm text-zinc-600"><input type="checkbox" checked={hasSocial} onChange={(e) => setHasSocial(e.target.checked)} />{p('withSocial')}</label>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="secondary" onClick={() => loadProspects(statusFilter, searchFilter, 1)}>
            {p('applyFilters')}
          </Button>
        </div>
      </section>

      {loading ? (
        <p className="rounded-lg border border-zinc-900/10 bg-white p-6 text-sm text-zinc-500">{p('loading')}</p>
      ) : prospects.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-500">{p('empty')}</p>
      ) : (
        <section className="rounded-lg border border-zinc-900/10 bg-white">
          <div className="flex flex-col justify-between gap-3 border-b border-zinc-200 px-4 py-3 sm:flex-row sm:items-center">
            <p className="text-sm font-medium text-zinc-700">{n(totalProspects)} {p('found')}</p>
            <Button variant="ghost" size="sm" onClick={exportExcel} disabled={exportRefreshing || exportDownloading}>
              <Download size={15} />
              {p('export')}
            </Button>
          </div>
          <Table className="min-w-[1280px]">
            <thead>
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">{p('company')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">{p('contact')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">{p('social')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">{p('website')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">{p('place')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">{p('status')}</th>
              <th className="px-4 py-2 text-left text-xs font-medium uppercase text-zinc-500">{p('followUpHeader')}</th>
              <th className="px-4 py-2 text-right text-xs font-medium uppercase text-zinc-500">{p('actions')}</th>
            </tr>
            </thead>
            <tbody>
            {prospects.map((prospect) => (
              <tr key={prospect.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-zinc-800">{prospect.name}</p>
                  <p className="text-xs text-zinc-500">{[prospect.business_type && (businessTypes.includes(prospect.business_type) ? p(`type.${prospect.business_type}`) : prospect.business_type), prospect.category].filter(Boolean).join(' · ') || '-'}</p>
                  {prospect.description && <p className="mt-1 max-w-xs truncate text-xs text-zinc-400">{prospect.description}</p>}
                </td>
                <td className="px-4 py-3 text-sm text-zinc-600">
                  <p className="flex items-center gap-1.5">{prospect.email ? <Mail size={13} /> : null}{prospect.email || p('noEmail')}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">{prospect.phone_web || prospect.phone_google ? <Phone size={12} /> : null}{prospect.phone_web || prospect.phone_google || p('noPhone')}</p>
                  {prospect.whatsapp && <p className="mt-1 text-xs font-medium text-emerald">WhatsApp</p>}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-600">
                  <div className="flex flex-col gap-1">
                    {prospect.instagram_url && <a href={prospect.instagram_url} target="_blank" rel="noreferrer" className="text-iris hover:underline">Instagram</a>}
                    {prospect.facebook_url && <a href={prospect.facebook_url} target="_blank" rel="noreferrer" className="text-iris hover:underline">Facebook</a>}
                    {prospect.linkedin_url && <a href={prospect.linkedin_url} target="_blank" rel="noreferrer" className="text-iris hover:underline">LinkedIn</a>}
                    {!prospect.instagram_url && !prospect.facebook_url && !prospect.linkedin_url && '-'}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  {prospect.website ? (
                    <a href={prospect.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-iris hover:underline">
                      {p('openWebsite')}
                      <ExternalLink size={13} />
                    </a>
                  ) : '-'}
                  {prospect.contact_page_url && (
                    <a href={prospect.contact_page_url} target="_blank" rel="noreferrer" className="ml-2 text-xs text-zinc-500 hover:underline">
                      {p('contact')}
                    </a>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-600">
                  <p className="flex items-center gap-1.5"><MapPin size={13} />{[prospect.zone, prospect.city].filter(Boolean).join(', ') || '-'}</p>
                  <p className="text-zinc-400">{[prospect.province, prospect.country && displayCountry(prospect.country, t)].filter(Boolean).join(', ')}</p>
                </td>
                <td className="px-4 py-3 text-sm text-zinc-600">
                  <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-medium ${verificationClass(prospect.verification_status)}`}>
                    {p(`verify.${prospect.verification_status}`)}
                  </span>
                  <p className="text-xs text-zinc-400">{prospect.google_rating ? `${prospect.google_rating} ${p('stars')}` : p('noStars')}</p>
                  <p className="text-xs text-zinc-400">{prospect.reviews_count ?? 0} {p('reviews')}</p>
                  <p className="text-xs text-zinc-400">{prospect.confidence_score ?? 0}% {p('confidence')}</p>
                  <p className="mt-1 text-xs text-zinc-400">{sourceLabel(prospect, t)}</p>
                  {prospect.last_verified_at && <p className="text-xs text-zinc-400">{p('lastVerified')}: {date(prospect.last_verified_at)}</p>}
                  {prospect.last_searched_at && <p className="text-xs text-zinc-400">{p('lastSearch')}: {date(prospect.last_searched_at)}</p>}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={prospect.contact_status}
                    onChange={(e) => handleContactStatus(prospect, e.target.value as Prospect['contact_status'])}
                    className={`rounded-md border px-2 py-1 text-xs font-medium ${contactClass(prospect.contact_status)}`}
                  >
                    {(['new', 'contacted', 'interested', 'not_interested', 'follow_up'] as const).map((value) => (
                      <option key={value} value={value}>{p(`contact.${value}`)}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="ghost" aria-label={`${p('contactHistory')} ${prospect.name}`} onClick={() => setContactProspect(prospect)}>
                    <MessageSquare size={14} />{p('history')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleVerify(prospect)} disabled={!prospect.website}>
                    <ShieldCheck size={14} />
                    {p('verify')}
                  </Button>
                </td>
              </tr>
            ))}
            </tbody>
          </Table>
          {totalProspects > pageSize && (
            <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3">
              <p className="text-sm text-zinc-500">{p('page')} {page} {p('of')} {Math.ceil(totalProspects / pageSize)}</p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={page === 1 || loading} onClick={() => loadProspects(statusFilter, searchFilter, page - 1)}>
                  {p('previous')}
                </Button>
                <Button variant="secondary" size="sm" disabled={page >= Math.ceil(totalProspects / pageSize) || loading} onClick={() => loadProspects(statusFilter, searchFilter, page + 1)}>
                  {p('nextPage')}
                </Button>
              </div>
            </div>
          )}
        </section>
      )}
      {contactProspect && <ProspectContactHistory
        subjectId={contactProspect.id}
        subjectName={contactProspect.name}
        subjectType="prospect"
        isAdmin={isAdmin}
        open={Boolean(contactProspect)}
        onClose={() => setContactProspect(null)}
      />}
    </div>
  );
}
