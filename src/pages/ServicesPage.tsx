import { FormEvent, SyntheticEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  Cable,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  Image,
  Laptop,
  MonitorCog,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { toast } from '../components/ui/Toast';
import { useScrollReveal } from '../components/experience/useScrollReveal';
import { BusinessCapabilities } from '../components/experience/BusinessCapabilities';

interface Service {
  id: string;
  name: string;
  description?: string;
  price?: number;
  base_price?: number;
  duration_minutes?: number;
  service_type?: 'home' | 'remote' | 'hybrid' | string;
  category?: string;
  image_url?: string | null;
  image_alt?: string | null;
  marketing_title?: string | null;
  display_order?: number;
  is_featured?: boolean;
  is_active: boolean;
}

type ServiceForm = {
  id?: string;
  name: string;
  marketing_title: string;
  description: string;
  category: string;
  price: string;
  duration_minutes: string;
  service_type: 'home' | 'remote' | 'hybrid';
  image_url: string;
  image_alt: string;
  display_order: string;
  is_featured: boolean;
  is_active: boolean;
};

const emptyForm: ServiceForm = {
  name: '',
  marketing_title: '',
  description: '',
  category: 'Hardware',
  price: '',
  duration_minutes: '60',
  service_type: 'home',
  image_url: '',
  image_alt: '',
  display_order: '0',
  is_featured: false,
  is_active: true,
};

const serviceTypeLabels: Record<string, string> = {
  home: 'A domicilio',
  remote: 'Remoto',
  hybrid: 'Mixto',
};

const defaultCategories = ['Todos', 'Hardware', 'Software', 'Mantenimiento', 'Redes', 'Enterprise'];

const customerJourneys = [
  {
    category: 'Hardware',
    eyebrow: 'Celulares y tablets',
    title: 'Lo que llevas con vos, listo para volver a tu día.',
    text: 'Contanos qué cambió. Revisamos tu equipo y te explicamos el camino antes de intervenir.',
    image: '/assets/editorial/reparo-mobile-care.jpg',
    tone: 'light',
    situations: ['No enciende', 'No carga', 'La pantalla cambió', 'Se siente lento'],
  },
  {
    category: 'Hardware',
    eyebrow: 'Computadoras',
    title: 'Tu trabajo no tiene por qué quedarse esperando.',
    text: 'Desde una notebook personal hasta tu estación de trabajo: diagnóstico preciso, sin vueltas.',
    image: '/assets/editorial/reparo-computer-care.jpg',
    tone: 'dark',
    situations: ['No inicia', 'Se congela', 'Necesito mis archivos', 'Quiero dejarla a punto'],
  },
  {
    category: 'Redes',
    eyebrow: 'Hogar y negocio',
    title: 'Cuando todo está conectado, todo puede seguir.',
    text: 'Wi-Fi, redes y equipos de trabajo organizados para que la tecnología acompañe, sin interrumpir.',
    image: '/assets/editorial/doctor-tech-network-care.jpg',
    tone: 'light',
    situations: ['Internet inestable', 'No puedo conectarme', 'Mi equipo creció', 'Necesito ordenar mi red'],
  },
];

const fallbackImages = [
  '/assets/editorial/reparo-computer-care.jpg',
  '/assets/editorial/reparo-mobile-care.jpg',
  '/assets/editorial/doctor-tech-remote-care.jpg',
  '/assets/editorial/doctor-tech-network-care.jpg',
  '/assets/editorial/doctor-tech-business-care.jpg',
];

const suggestedImages = [
  {
    label: 'Laptop / reparación',
    url: '/assets/editorial/reparo-computer-care.jpg',
  },
  {
    label: 'Celular / placa',
    url: '/assets/editorial/reparo-mobile-care.jpg',
  },
  {
    label: 'Redes / servidores',
    url: '/assets/editorial/doctor-tech-network-care.jpg',
  },
  {
    label: 'Soporte remoto',
    url: '/assets/editorial/doctor-tech-remote-care.jpg',
  },
];

function formatCurrency(value?: number) {
  const amount = Number(value ?? 0);
  if (!amount) return 'Consultar';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount);
}

function getServiceIcon(service: Service) {
  const text = `${service.name} ${service.category || ''}`.toLowerCase();
  if (text.includes('celular') || text.includes('telefono')) return Smartphone;
  if (text.includes('remoto') || service.service_type === 'remote') return MonitorCog;
  if (text.includes('pc') || text.includes('laptop') || text.includes('computadora')) return Laptop;
  if (text.includes('consult')) return Sparkles;
  return Wrench;
}

function getServiceType(service: Service) {
  const type = service.service_type || '';
  return serviceTypeLabels[type] || service.category || 'Servicio tecnico';
}

function getCustomerTitle(service: Service) {
  const text = `${service.name} ${service.category || ''}`.toLowerCase();
  if (text.includes('celular') || text.includes('telefono') || text.includes('movil')) return 'Todo lo importante, otra vez en tu mano.';
  if (text.includes('tablet') || text.includes('ipad')) return 'Tu pantalla, lista para cada idea.';
  if (text.includes('pc') || text.includes('laptop') || text.includes('computadora')) return 'Tu computadora, lista para seguir tu ritmo.';
  if (text.includes('red') || text.includes('internet') || text.includes('wifi')) return 'Tu conexion, sin pausas innecesarias.';
  if (text.includes('empresa') || text.includes('consult')) return 'Tecnologia que acompana a tu negocio.';
  if (service.service_type === 'remote') return 'Ayuda experta, estes donde estes.';
  return service.marketing_title || service.name;
}

function getServiceImage(service: Service, index: number, allowRemote = false) {
  // Public cards stay on local assets so a slow or unavailable third-party host
  // cannot delay the first view. Administrators can still preview their saved URL.
  if (allowRemote && service.image_url && !/\.svg(?:[?#]|$)/i.test(service.image_url)) return service.image_url;

  const category = (service.category || '').toLowerCase();
  const name = service.name.toLowerCase();
  if (name.includes('celular') || name.includes('pantalla') || name.includes('bater')) return '/assets/editorial/reparo-mobile-care.jpg';
  if (category.includes('software') || service.service_type === 'remote') return '/assets/editorial/doctor-tech-remote-care.jpg';
  if (category.includes('red') || name.includes('wifi') || name.includes('conex')) return '/assets/editorial/doctor-tech-network-care.jpg';
  if (category.includes('enterprise') || name.includes('empresa') || name.includes('conserje')) return '/assets/editorial/doctor-tech-business-care.jpg';
  if (category.includes('educ')) return '/assets/editorial/reparo-computer-care.jpg';

  return fallbackImages[index % fallbackImages.length];
}

function replaceBrokenImage(event: SyntheticEvent<HTMLImageElement>, index: number) {
  const image = event.currentTarget;
  image.onerror = null;
  image.src = fallbackImages[index % fallbackImages.length];
}

function serviceToForm(service: Service): ServiceForm {
  return {
    id: service.id,
    name: service.name || '',
    marketing_title: service.marketing_title || '',
    description: service.description || '',
    category: service.category || 'Hardware',
    price: String(service.price ?? service.base_price ?? ''),
    duration_minutes: String(service.duration_minutes ?? 60),
    service_type: (service.service_type as ServiceForm['service_type']) || 'home',
    image_url: service.image_url || '',
    image_alt: service.image_alt || '',
    display_order: String(service.display_order ?? 0),
    is_featured: Boolean(service.is_featured),
    is_active: Boolean(service.is_active),
  };
}

function PublicServices({ hasAccount }: { hasAccount: boolean }) {
  const { locale } = useLocale();
  const rootRef = useScrollReveal<HTMLDivElement>();
  const language = locale.startsWith('nl') ? 'nl' : locale.startsWith('en') ? 'en' : 'es';
  const ui = language === 'en' ? {
    eyebrow: 'Doctor Tech · Technical diagnosis', title: 'Start with the symptom.', intro: 'You do not need to name the repair. Tell us what changed and we will guide the next step.', image: 'A clear diagnosis before deciding', question: 'What is happening?', prompt: 'Choose a symptom or tell us about yours.', tell: 'Tell us what happened', device: 'You can also start with your device', start: 'Choose a starting point. We will solve the rest together.', before: 'Before deciding', clear: 'A clear diagnosis changes everything.', talk: 'Talk to Doctor Tech', explanation: 'We review the context, explain the options, and arrange the support that fits.', incidents: ['It will not turn on', 'It will not charge', 'It feels slow', 'I cannot connect'], pathways: [['Phone or tablet', 'For what you carry with you every day.', 'I need help with my phone or tablet'], ['Computer', 'For study, creation, work, or recovering access.', 'I need help with my computer'], ['Wi-Fi or network', 'To reconnect your home, team, or business.', 'I have a connectivity problem'], ['Business', 'Your team’s devices, connectivity, and workflows.', 'I need support for my business']] } : language === 'nl' ? {
    eyebrow: 'Doctor Tech · Technische diagnose', title: 'Begin met het symptoom.', intro: 'Je hoeft de reparatie geen naam te geven. Vertel wat er is veranderd en wij begeleiden de volgende stap.', image: 'Een heldere diagnose voordat je beslist', question: 'Wat gebeurt er?', prompt: 'Kies een symptoom of vertel wat er speelt.', tell: 'Vertel wat er is gebeurd', device: 'Je kunt ook met je apparaat beginnen', start: 'Kies een vertrekpunt. De rest lossen we samen op.', before: 'Voordat je beslist', clear: 'Een heldere diagnose verandert alles.', talk: 'Praat met Doctor Tech', explanation: 'We bekijken de context, leggen de opties uit en regelen de ondersteuning die past.', incidents: ['Hij gaat niet aan', 'Hij laadt niet op', 'Hij voelt traag', 'Ik kan geen verbinding maken'], pathways: [['Telefoon of tablet', 'Voor wat je elke dag bij je hebt.', 'Ik heb hulp nodig met mijn telefoon of tablet'], ['Computer', 'Voor studie, creatie, werk of herstel van toegang.', 'Ik heb hulp nodig met mijn computer'], ['Wifi of netwerk', 'Om je huis, team of bedrijf weer te verbinden.', 'Ik heb een verbindingsprobleem'], ['Bedrijf', 'Je team, apparatuur, netwerken en werkprocessen.', 'Ik heb ondersteuning nodig voor mijn bedrijf']] } : {
    eyebrow: 'Doctor Tech · Diagnóstico técnico', title: 'Empezá por el síntoma.', intro: 'No hace falta ponerle nombre a la reparación. Contanos qué cambió y te guiamos hacia el siguiente paso.', image: 'Diagnóstico claro, antes de decidir', question: '¿Qué está pasando?', prompt: 'Elegí un síntoma o contanos el tuyo.', tell: 'Contar mi caso', device: 'También podés empezar por tu equipo', start: 'Elegí el punto de partida. Lo demás lo resolvemos juntos.', before: 'Antes de decidir', clear: 'Un diagnóstico claro cambia todo.', talk: 'Hablar con Doctor Tech', explanation: 'Revisamos el contexto, explicamos las alternativas y coordinamos la atención que corresponde.', incidents: ['No enciende', 'No carga', 'Se siente lento', 'No puedo conectarme'], pathways: [['Celular o tablet', 'Para lo que llevás con vos todos los días.', 'Necesito ayuda con mi celular o tablet'], ['Computadora', 'Para estudiar, crear, trabajar o recuperar acceso.', 'Necesito ayuda con mi computadora'], ['Wi-Fi o red', 'Para volver a conectar tu casa, equipo o negocio.', 'Tengo un problema de conectividad'], ['Empresa', 'Equipos, redes y procesos que tienen que funcionar en conjunto.', 'Necesito soporte para mi empresa']] };
  const requestPath = (incident: string) => hasAccount
    ? `/tickets/new?incident=${encodeURIComponent(incident)}`
    : `/register?incident=${encodeURIComponent(incident)}`;
  const pathwayImages = ['/assets/editorial/reparo-mobile-care.jpg', '/assets/editorial/reparo-computer-care.jpg', '/assets/editorial/doctor-tech-network-care.jpg', '/assets/editorial/doctor-tech-business-care.jpg'];
  const pathways = [Smartphone, Laptop, Cable, Building2].map((icon, index) => ({ icon, image: pathwayImages[index], title: ui.pathways[index][0], text: ui.pathways[index][1], incident: ui.pathways[index][2] }));

  return (
    <div ref={rootRef} className="min-h-screen overflow-hidden bg-[#fbfbfc] text-[#202124]">
      <section className="relative isolate border-b border-black/10 bg-[#e9edf1] px-6 pb-28 pt-16 sm:px-10 lg:pb-32 lg:pt-24">
        <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-12 lg:items-center">
          <div className="reparo-reveal relative z-10 lg:col-span-5 lg:pr-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5f6368]">{ui.eyebrow}</p>
            <h1 className="mt-5 text-5xl font-semibold leading-[1.02] tracking-normal sm:text-6xl">{ui.title}</h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-[#5f6368]">{ui.intro}</p>
          </div>
          <div className="reparo-reveal-delayed relative lg:col-span-7">
            <img src="/assets/editorial/reparo-mobile-care.jpg" alt="Revisión profesional de un dispositivo móvil" width="1280" height="854" sizes="(min-width: 1024px) 58vw, 100vw" className="h-[350px] w-full object-cover sm:h-[460px] lg:h-[540px]" loading="eager" decoding="async" />
            <p className="absolute bottom-5 left-5 text-xs font-medium uppercase tracking-[0.14em] text-white/80">{ui.image}</p>
          </div>
        </div>
        <div className="reparo-choice-dock glass mx-auto -mb-[188px] mt-10 max-w-[1060px] px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div><p className="text-sm font-semibold text-[#202124]">{ui.question}</p><p className="mt-1 text-sm text-[#5f6368]">{ui.prompt}</p></div>
            <Link to={requestPath(ui.tell)} className="inline-flex w-fit items-center gap-2 text-sm font-medium text-[#0066cc]">{ui.tell} <ArrowRight size={16} /></Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {ui.incidents.map((incident) => <Link key={incident} to={requestPath(incident)} className="reparo-choice-pill">{incident}<ArrowRight size={14} /></Link>)}
          </div>
        </div>
      </section>

      <section className="px-6 pb-24 pt-64 sm:px-10 lg:pb-32 lg:pt-72">
        <div className="mx-auto max-w-[1120px]">
          <div data-scroll-reveal className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6e6e73]">{ui.device}</p><h2 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">{ui.start}</h2></div>
          <div className="mt-14 grid gap-4 md:grid-cols-12 md:items-start">
            {pathways.map((pathway, index) => {
              const Icon = pathway.icon;
              const layouts = ['md:col-span-7 bg-[#f1f3f4]', 'md:col-span-5 bg-[#202124] text-white', 'md:col-span-4 bg-[#e9edf1]', 'md:col-span-8 bg-white border border-black/10'];
              const muted = index === 1 ? 'text-white/65' : 'text-[#5f6368]';
              const action = index === 1 ? 'text-[#8ab4f8]' : 'text-[#0066cc]';
              return (
                <Link key={pathway.title} data-scroll-reveal to={requestPath(pathway.incident)} className={`reparo-pathway group min-h-[370px] overflow-hidden ${layouts[index]}`}>
                  <img src={pathway.image} alt="" loading="lazy" decoding="async" width="1200" height="675" className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]" />
                  <div className="p-7 sm:p-9"><Icon size={24} strokeWidth={1.55} className="shrink-0" /><h3 className="mt-4 text-2xl font-semibold">{pathway.title}</h3><p className={`mt-3 max-w-sm text-base leading-7 ${muted}`}>{pathway.text}</p><span className={`mt-6 inline-flex items-center gap-2 text-sm font-medium ${action}`}>{ui.tell} <ArrowRight size={16} /></span></div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <BusinessCapabilities />

      <section className="bg-[#202124] px-6 py-20 text-white sm:px-10 lg:py-28">
        <div className="mx-auto grid max-w-[1120px] gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/55">{ui.before}</p><h2 className="mt-4 text-4xl font-semibold leading-tight sm:text-5xl">{ui.clear}</h2><Link to={requestPath(ui.tell)} className="mt-8 inline-flex items-center gap-2 text-base font-medium text-[#8ab4f8]">{ui.talk} <ArrowRight size={17} /></Link></div>
          <div><img src="/assets/editorial/reparo-computer-care.jpg" alt="Technical computer diagnosis" width="1280" height="720" sizes="(min-width: 1024px) 55vw, 100vw" className="h-[290px] w-full object-cover sm:h-[360px]" loading="lazy" decoding="async" /><p className="mt-4 max-w-xl text-base leading-7 text-white/65">{ui.explanation}</p></div>
        </div>
      </section>
    </div>
  );
}

export function ServicesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role_name === 'admin' || user?.role_id === 'role_admin';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  useEffect(() => {
    if (isAdmin) loadServices();
    else setLoading(false);
  }, [isAdmin]);

  const loadServices = async () => {
    setLoading(true);
    try {
      const data = isAdmin ? await api.getAdminServices() : await api.getServices();
      setServices(data);
    } catch (err: any) {
      toast(err.message || 'Error al cargar servicios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const serviceCategories = services
      .map((service) => service.category)
      .filter((category): category is string => Boolean(category));
    return Array.from(new Set([...defaultCategories, ...serviceCategories]));
  }, [services]);

  const visibleServices = useMemo(() => {
    if (isAdmin) return services;
    return services.filter((service) => service.is_active);
  }, [isAdmin, services]);

  const filteredServices = useMemo(() => {
    if (selectedCategory === 'Todos') return visibleServices;
    return visibleServices.filter((service) => service.category === selectedCategory);
  }, [selectedCategory, visibleServices]);
  const rootRef = useScrollReveal<HTMLDivElement>(filteredServices.length + (loading ? 0 : 1000));

  const activeServices = useMemo(
    () => services.filter((service) => service.is_active).length,
    [services]
  );

  const updateForm = (key: keyof ServiceForm, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const openCreate = () => {
    setForm(emptyForm);
    setIsEditorOpen(true);
  };

  const openEdit = (service: Service) => {
    setForm(serviceToForm(service));
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setForm(emptyForm);
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.description.trim() || !form.category.trim()) {
      toast('Completa nombre, descripcion y categoria', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        marketing_title: form.marketing_title.trim() || null,
        description: form.description.trim(),
        category: form.category.trim(),
        price: Number(form.price || 0),
        duration_minutes: Number(form.duration_minutes || 60),
        service_type: form.service_type,
        image_url: form.image_url.trim() || null,
        image_alt: form.image_alt.trim() || null,
        display_order: Number(form.display_order || 0),
        is_featured: form.is_featured,
        is_active: form.is_active,
      };

      const saved = form.id
        ? await api.updateService(form.id, payload as any)
        : await api.createService(payload as any);

      setServices((current) => {
        if (!form.id) return [saved as Service, ...current];
        return current.map((service) => (service.id === form.id ? saved as Service : service));
      });
      toast('Servicio guardado', 'success');
      closeEditor();
    } catch (err: any) {
      toast(err.message || 'Error al guardar servicio', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (service: Service) => {
    if (!confirm(`¿Desactivar "${service.name}"?`)) return;
    try {
      await api.deleteService(service.id);
      setServices((current) => current.map((item) => (item.id === service.id ? { ...item, is_active: false } : item)));
      toast('Servicio desactivado', 'success');
    } catch (err: any) {
      toast(err.message || 'Error al desactivar servicio', 'error');
    }
  };

  if (!isAdmin) return <PublicServices hasAccount={Boolean(user)} />;

  return (
    <div ref={rootRef} className="min-h-screen bg-[#fff] text-[#1d1d1f]">
      <section className="overflow-hidden border-b border-black/10 bg-[#fbfbfd]">
        <div className="mx-auto grid max-w-[1440px] gap-0 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-20 lg:py-24">
            <div className="mb-6 inline-flex w-fit items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#0071e3]">
              <ShieldCheck size={15} />
              Doctor Tech Studio
            </div>
            <h1 className="max-w-xl text-5xl font-semibold tracking-normal text-[#1d1d1f] sm:text-6xl lg:text-7xl">
              La tecnologia que usas. Como nueva para lo que sigue.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-[#6e6e73]">
              Empieza por tu dispositivo y cuentanos que cambio. Te guiamos hacia la mejor solucion, con diagnostico claro antes de avanzar.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to={user ? '/tickets/new' : '/register'}>
                <Button size="lg" className="w-full bg-[#0071e3] hover:bg-[#0077ed] focus:ring-[#0071e3] sm:w-auto">
                  Hablar con un tecnico
                  <ArrowRight size={18} />
                </Button>
              </Link>
              {isAdmin ? (
                <Button variant="secondary" size="lg" onClick={openCreate} className="w-full sm:w-auto">
                  <Plus size={17} />
                  Nuevo servicio
                </Button>
              ) : (
                <Button variant="secondary" size="lg" onClick={loadServices} disabled={loading} className="w-full border-0 bg-transparent text-[#0071e3] shadow-none hover:bg-transparent hover:text-[#0077ed] sm:w-auto">
                  <RefreshCw size={17} />
                  Explorar equipos
                </Button>
              )}
            </div>
          </div>
          <div className="relative min-h-[520px] overflow-hidden bg-[#f5f5f7]">
            <img src="/assets/editorial/reparo-studio-hero.jpg" alt="Tecnico Doctor Tech revisando equipos con precision" width="1280" height="854" loading="eager" decoding="async" className="absolute inset-0 h-full w-full object-cover object-center" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-8 pb-8 pt-28 text-white">
              <p className="text-2xl font-semibold">Cuidado preciso. Decisiones claras.</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-white/80">{activeServices} experiencias disponibles para tus dispositivos y tu negocio.</p>
            </div>
          </div>
        </div>
      </section>

      {isAdmin && isEditorOpen ? (
        <section className="border-b border-zinc-900/10 bg-white px-4 py-6 sm:px-6 lg:px-8">
          <form onSubmit={handleSave} className="mx-auto max-w-screen-2xl">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-iris">Administrador</p>
                <h2 className="mt-1 text-2xl font-semibold text-zinc-950">{form.id ? 'Editar servicio' : 'Nuevo servicio'}</h2>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={closeEditor}>
                  <X size={16} />
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  <Save size={16} />
                  {saving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_0.65fr]">
              <div className="grid gap-3 rounded-lg border border-zinc-900/10 bg-[#f5f5f7] p-4 md:grid-cols-2">
                <Input value={form.name} onChange={(e) => updateForm('name', e.target.value)} label="Nombre" placeholder="Reparacion de pantalla" />
                <Input value={form.marketing_title} onChange={(e) => updateForm('marketing_title', e.target.value)} label="Titulo comercial" placeholder="Pantallas y modulos con diagnostico previo" />
                <Input value={form.category} onChange={(e) => updateForm('category', e.target.value)} label="Categoria" placeholder="Hardware" />
                <Input type="number" min={0} value={form.price} onChange={(e) => updateForm('price', e.target.value)} label="Precio" placeholder="15000" />
                <Input type="number" min={1} value={form.duration_minutes} onChange={(e) => updateForm('duration_minutes', e.target.value)} label="Duracion en minutos" />
                <Input type="number" min={0} value={form.display_order} onChange={(e) => updateForm('display_order', e.target.value)} label="Orden" />
                <label className="block text-sm font-medium text-zinc-700">
                  Modalidad
                  <select
                    value={form.service_type}
                    onChange={(e) => updateForm('service_type', e.target.value)}
                    className="mt-1.5 h-[42px] w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-iris focus:outline-none focus:ring-2 focus:ring-iris/30"
                  >
                    <option value="home">A domicilio</option>
                    <option value="remote">Remoto</option>
                    <option value="hybrid">Mixto</option>
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex h-[42px] items-center gap-2 self-end rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-600">
                    <input type="checkbox" checked={form.is_featured} onChange={(e) => updateForm('is_featured', e.target.checked)} />
                    Destacado
                  </label>
                  <label className="flex h-[42px] items-center gap-2 self-end rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-600">
                    <input type="checkbox" checked={form.is_active} onChange={(e) => updateForm('is_active', e.target.checked)} />
                    Activo
                  </label>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-zinc-700">
                    Descripcion
                    <textarea
                      value={form.description}
                      onChange={(e) => updateForm('description', e.target.value)}
                      rows={4}
                      className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm placeholder-zinc-400 focus:border-iris focus:outline-none focus:ring-2 focus:ring-iris/30"
                      placeholder="Cuenta que incluye el servicio y para que casos aplica."
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-900/10 bg-[#f5f5f7] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Image size={17} className="text-iris" />
                  <p className="text-sm font-semibold text-zinc-950">Imagen del servicio</p>
                </div>
                <Input value={form.image_url} onChange={(e) => updateForm('image_url', e.target.value)} label="URL de imagen" placeholder="https://..." />
                <Input value={form.image_alt} onChange={(e) => updateForm('image_alt', e.target.value)} label="Texto alternativo" placeholder="Describe la imagen" className="mt-3" />
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {suggestedImages.map((image) => (
                    <button
                      key={image.label}
                      type="button"
                      onClick={() => updateForm('image_url', image.url)}
                      className="overflow-hidden rounded-lg border border-zinc-900/10 bg-white text-left text-xs font-medium text-zinc-700 transition hover:border-iris"
                    >
                      <img src={image.url} alt="" className="h-20 w-full object-cover" loading="lazy" decoding="async" />
                      <span className="block px-2 py-2">{image.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </form>
        </section>
      ) : null}

      {!isAdmin ? (
        <>
          <section className="bg-white px-6 py-24 text-center sm:px-8 lg:px-10 lg:py-32">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0071e3]">Elige tu punto de partida</p>
            <h2 className="mx-auto mt-4 max-w-4xl text-4xl font-semibold tracking-normal text-[#1d1d1f] sm:text-6xl">
              No hace falta saber cómo se llama el problema.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#6e6e73]">
              Elegí lo que querés volver a usar. Después, contanos qué está pasando y nos ocupamos de orientar el siguiente paso.
            </p>
          </section>

          {customerJourneys.map((journey, index) => {
            const dark = journey.tone === 'dark';
            return (
              <section key={journey.eyebrow} className={dark ? 'bg-[#000] text-white' : 'bg-[#f5f5f7] text-[#1d1d1f]'}>
                <div className={`mx-auto grid min-h-[680px] max-w-[1440px] items-stretch lg:grid-cols-2 ${index % 2 === 1 ? 'lg:[&>*:first-child]:order-2' : ''}`}>
                  <div className="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-20 lg:py-24">
                    <p className={`text-sm font-semibold uppercase tracking-[0.16em] ${dark ? 'text-[#2997ff]' : 'text-[#0071e3]'}`}>{journey.eyebrow}</p>
                    <h3 className="mt-4 max-w-xl text-4xl font-semibold tracking-normal sm:text-5xl lg:text-6xl">{journey.title}</h3>
                    <p className={`mt-6 max-w-lg text-lg leading-8 ${dark ? 'text-[#a1a1a6]' : 'text-[#6e6e73]'}`}>{journey.text}</p>
                    <div className="mt-10">
                      <p className={`text-sm font-medium ${dark ? 'text-white' : 'text-[#1d1d1f]'}`}>¿Qué está pasando?</p>
                      <div className="mt-3 flex max-w-xl flex-wrap gap-2">
                        {journey.situations.map((situation) => (
                          <Link
                            key={situation}
                            to={user ? `/tickets/new?category=${encodeURIComponent(journey.category.toLowerCase())}&incident=${encodeURIComponent(situation)}` : '/register'}
                            className={`rounded-full px-4 py-2 text-sm font-medium transition ${dark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white text-[#1d1d1f] hover:bg-[#e8e8ed]'}`}
                          >
                            {situation}
                          </Link>
                        ))}
                      </div>
                    </div>
                    <Link to={user ? `/tickets/new?category=${encodeURIComponent(journey.category.toLowerCase())}` : '/register'} className={`mt-9 inline-flex w-fit items-center gap-2 text-base font-medium ${dark ? 'text-[#2997ff]' : 'text-[#0071e3]'}`}>
                      Contar mi caso <ArrowRight size={17} />
                    </Link>
                  </div>
                  <div className="relative min-h-[360px] overflow-hidden">
                    <img src={journey.image} alt="Tecnico de Doctor Tech trabajando con equipo tecnologico" className="absolute inset-0 h-full w-full object-cover" loading={index === 0 ? 'eager' : 'lazy'} decoding="async" />
                    <div className={`absolute inset-0 ${dark ? 'bg-black/15' : 'bg-white/5'}`} />
                  </div>
                </div>
              </section>
            );
          })}

          <section className="bg-white px-6 py-24 text-center sm:px-8 lg:py-32">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0071e3]">Doctor Tech te acompaña</p>
            <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-normal text-[#1d1d1f] sm:text-5xl">Primero entendemos. Después resolvemos.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-[#6e6e73]">El diagnóstico y las alternativas llegan antes que cualquier decisión. Sin lenguaje técnico innecesario ni sorpresas.</p>
            <Link to={user ? '/tickets/new' : '/register'} className="mt-8 inline-flex items-center gap-2 text-base font-medium text-[#0071e3]">Solicitar orientación <ArrowRight size={17} /></Link>
          </section>
        </>
      ) : null}

      {isAdmin ? (
      <section className="mx-auto max-w-[1280px] px-6 py-20 sm:px-8 lg:px-10">
        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#0071e3]">Una vez que elegiste</p>
            <h2 className="mt-3 max-w-3xl text-4xl font-semibold tracking-normal text-[#1d1d1f]">Opciones para seguir adelante.</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`h-10 whitespace-nowrap rounded-lg border px-4 text-sm font-medium transition ${
                  selectedCategory === category
                    ? 'border-[#1d1d1f] bg-[#1d1d1f] text-white'
                    : 'border-transparent bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-72 animate-pulse rounded-lg border border-zinc-200 bg-white" />
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-sm text-zinc-500">
            Aun no hay una opcion para esta seleccion. Cuentanos que equipo tienes y lo revisamos contigo.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredServices.map((service, index) => {
              const Icon = getServiceIcon(service);
              const price = service.price ?? service.base_price;
              return (
                <article
                  key={service.id}
                  data-scroll-reveal
                  className="group flex min-h-[440px] flex-col overflow-hidden rounded-lg bg-[#f5f5f7] transition-shadow duration-300 hover:shadow-[0_12px_36px_rgba(0,0,0,0.1)]"
                >
                  <div className="relative h-56 overflow-hidden bg-[#e8e8ed]">
                    <img
                      src={getServiceImage(service, index, isAdmin)}
                      alt={service.image_alt || service.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      width="1200"
                      height="760"
                      sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
                      loading="lazy"
                      decoding="async"
                      onError={(event) => replaceBrokenImage(event, index)}
                    />
                    <div className="absolute left-3 top-3 flex gap-2">
                      <span className="inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-zinc-800 backdrop-blur">
                        {getServiceType(service)}
                      </span>
                      {service.is_featured && isAdmin ? (
                        <span className="inline-flex rounded-md bg-iris px-2.5 py-1 text-xs font-semibold text-white">
                          Destacado
                        </span>
                      ) : null}
                    </div>
                    {isAdmin ? (
                      <div className="absolute right-3 top-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(service)}
                          className="flex h-9 w-9 items-center justify-center rounded-md bg-white/90 text-zinc-800 backdrop-blur transition hover:bg-white"
                          title="Editar servicio"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeactivate(service)}
                          className="flex h-9 w-9 items-center justify-center rounded-md bg-white/90 text-crimson backdrop-blur transition hover:bg-white"
                          title="Desactivar servicio"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#0071e3]">
                        <Icon size={21} />
                      </div>
                      {isAdmin ? <span
                        className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium ${
                          service.is_active
                            ? 'border-emerald/20 bg-emerald/10 text-emerald'
                            : 'border-crimson/20 bg-crimson/10 text-crimson'
                        }`}
                      >
                        {service.is_active ? <Eye size={13} /> : <EyeOff size={13} />}
                        {service.is_active ? 'Visible' : 'Oculto'}
                      </span> : null}
                    </div>

                    <div className="mt-5 flex-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6e6e73]">Para tu {service.category || 'equipo'}</p>
                      <h3 className="mt-2 text-2xl font-semibold tracking-normal text-[#1d1d1f]">{getCustomerTitle(service)}</h3>
                      {service.marketing_title ? (
                        <p className="mt-1 text-sm font-medium text-zinc-500">Servicio especializado: {service.name}</p>
                      ) : null}
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-600">
                        {service.description || 'Servicio tecnico disponible bajo diagnostico.'}
                      </p>
                    </div>

                    <div className="mt-5 flex items-end justify-between gap-4 border-t border-zinc-200 pt-4">
                      <div>
                        <p className="font-mono text-xl font-semibold text-zinc-950">{formatCurrency(price)}</p>
                        {service.duration_minutes ? (
                          <p className="mt-1 text-xs text-zinc-500">{service.duration_minutes} min estimados</p>
                        ) : (
                          <p className="mt-1 text-xs text-zinc-500">Tiempo segun diagnostico</p>
                        )}
                      </div>
                      <Link
                        to={user ? '/tickets/new' : '/register'}
                        className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#0071e3] px-4 text-sm font-medium text-white transition hover:bg-[#0077ed]"
                      >
                        Ver opciones
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
      ) : null}

      <section className="border-t border-zinc-900/10 bg-zinc-950 px-4 py-12 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-screen-2xl flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-white/50">Siguiente paso</p>
            <h2 className="mt-2 text-2xl font-semibold">No necesitas saber que se rompio para pedir ayuda.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
              Cuentanos que equipo tienes y que esta pasando. Te orientamos antes de que tomes una decision.
            </p>
          </div>
          <Link to={user ? '/tickets/new' : '/register'}>
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              Contar mi caso
              <CheckCircle2 size={18} />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
