import { ArrowRight, Laptop, Network, Server, Workflow } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLocale } from '../../context/LocaleContext';

const copy = {
  es: {
    eyebrow: 'Tecnología para equipos de trabajo',
    title: '¿Qué necesita funcionar mejor en tu empresa?',
    intro: 'Acompañamos equipos y operaciones: desde el mantenimiento cotidiano hasta redes, servidores y automatización. Empezamos por entender cómo trabajan.',
    capabilities: [
      ['Equipos de trabajo', 'Puesta a punto y mantenimiento de los equipos que usa tu equipo.'],
      ['Redes y conectividad', 'Redes LAN y WAN, Wi-Fi y conexión entre espacios de trabajo.'],
      ['Servidores y nube', 'Configuración o puesta en marcha de servidores locales y en la nube.'],
      ['Procesos y automatización', 'Analizamos tareas repetitivas y dónde una automatización o IA podría ayudar.'],
    ],
    cta: 'Contanos qué necesita tu empresa',
    note: 'No hace falta elegir una solución. Describinos tu operación y lo pensamos con vos.',
    incident: 'Quiero conversar sobre tecnología para mi empresa. Esto es lo que necesito:',
  },
  nl: {
    eyebrow: 'Technologie voor teams',
    title: 'Wat moet er beter werken binnen je bedrijf?',
    intro: 'We ondersteunen teams en bedrijfsprocessen: van dagelijks onderhoud tot netwerken, servers en automatisering. We beginnen met begrijpen hoe jullie werken.',
    capabilities: [
      ['Werkplekken en apparatuur', 'Installatie, inrichting en onderhoud van de apparatuur die je team gebruikt.'],
      ['Netwerken en connectiviteit', 'LAN- en WAN-netwerken, wifi en verbindingen tussen werklocaties.'],
      ['Servers en cloud', 'Lokale of cloudservers configureren of vanaf de basis inrichten.'],
      ['Processen en automatisering', 'We bekijken terugkerende taken en waar automatisering of AI kan helpen.'],
    ],
    cta: 'Vertel ons wat je bedrijf nodig heeft',
    note: 'Je hoeft geen oplossing te kiezen. Beschrijf hoe jullie werken; dan denken we met je mee.',
    incident: 'Ik wil over technologie voor mijn bedrijf praten. Dit heb ik nodig:',
  },
  en: {
    eyebrow: 'Technology for teams',
    title: 'What needs to work better in your business?',
    intro: 'We support teams and operations, from everyday device care to networks, servers, and automation. We start by understanding how your team works.',
    capabilities: [
      ['Workstations and devices', 'Setup and maintenance for the equipment your team relies on.'],
      ['Networks and connectivity', 'LAN and WAN networks, Wi-Fi, and links between work locations.'],
      ['Servers and cloud', 'Configuration or setup of on-premises and cloud servers.'],
      ['Processes and automation', 'We look at recurring tasks and where automation or AI could help.'],
    ],
    cta: 'Tell us what your business needs',
    note: 'You do not need to choose a solution. Describe how your team works, and we will think it through with you.',
    incident: 'I would like to discuss technology for my business. Here is what I need:',
  },
} as const;

const icons = [Laptop, Network, Server, Workflow];

export function BusinessCapabilities() {
  const { user } = useAuth();
  const { locale } = useLocale();
  const language = locale.startsWith('nl') ? 'nl' : locale.startsWith('en') ? 'en' : 'es';
  const content = copy[language];
  const target = user ? '/tickets/new' : '/register';
  const href = `${target}?incident=${encodeURIComponent(content.incident)}`;

  return (
    <section role="region" aria-labelledby="business-capabilities-title" className="border-y border-black/10 bg-[#f7f7f8] px-6 py-16 sm:px-10 lg:py-20">
      <div className="mx-auto max-w-[1120px]">
        <div className="grid gap-5 border-b border-black/10 pb-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:gap-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6e6e73]">{content.eyebrow}</p>
            <h2 id="business-capabilities-title" className="mt-3 max-w-xl text-3xl font-semibold leading-tight text-[#202124] sm:text-4xl">{content.title}</h2>
          </div>
          <p className="max-w-2xl text-base leading-7 text-[#5f6368]">{content.intro}</p>
        </div>

        <ul className="grid md:grid-cols-2 md:gap-x-12">
          {content.capabilities.map(([title, description], index) => {
            const Icon = icons[index];
            return (
              <li key={title} className="flex gap-4 border-b border-black/10 py-6">
                <Icon className="mt-0.5 shrink-0 text-[#202124]" size={22} strokeWidth={1.6} aria-hidden="true" />
                <div>
                  <h3 className="text-base font-semibold text-[#202124]">{title}</h3>
                  <p className="mt-1.5 max-w-lg text-sm leading-6 text-[#5f6368]">{description}</p>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex flex-col gap-4 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-sm leading-6 text-[#5f6368]">{content.note}</p>
          <Link to={href} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-md bg-[#202124] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#34363a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0066cc]">
            {content.cta}<ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
