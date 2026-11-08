import { ArrowRight, BadgeCheck, BarChart3, Blocks, Bot, Code2, Headphones, Laptop, Palette, Search, ShieldCheck, Sparkles } from 'lucide-react';

const divisions = [
  {
    icon: Headphones,
    label: '01 · Soporte TI',
    title: 'Tecnología que sostiene tu operación.',
    text: 'Diagnóstico, soporte remoto, redes, mantenimiento y continuidad para que los problemas técnicos no detengan tu negocio.',
    services: ['Soporte remoto y en sitio', 'Redes, Wi-Fi y equipos', 'Mantenimiento para empresas'],
    accent: 'from-cyan-300 via-blue-500 to-indigo-500',
  },
  {
    icon: Palette,
    label: '02 · Marketing Digital',
    title: 'Una presencia que convierte interés en conversaciones.',
    text: 'Marca, diseño, web, SEO/GEO, campañas, contenido y automatización comercial diseñados alrededor de objetivos reales.',
    services: ['Marca, diseño y contenido', 'Web, SEO y Google Business', 'CRM, campañas y analítica'],
    accent: 'from-violet-400 via-blue-500 to-cyan-300',
  },
  {
    icon: Code2,
    label: '03 · Desarrollo de Software',
    title: 'Software que se adapta a cómo trabaja tu equipo.',
    text: 'Automatizaciones, portales, integraciones y aplicaciones a medida construidas por etapas, con alcance y resultados visibles.',
    services: ['Automatización de procesos', 'Portales y aplicaciones web', 'Integraciones e IA aplicada'],
    accent: 'from-blue-500 via-indigo-500 to-violet-400',
  },
];

const process = [
  ['01', 'Entendemos el contexto', 'Escuchamos el problema, el objetivo y las restricciones antes de recomendar una herramienta.'],
  ['02', 'Diseñamos una ruta clara', 'Definimos prioridades, responsables, alcance y la forma de medir el avance.'],
  ['03', 'Implementamos y acompañamos', 'Ejecutamos por etapas, documentamos lo realizado y sostenemos la evolución.'],
];

export function SquadBerryPreviewPage() {
  return (
    <div className="min-h-screen bg-[#050D21] text-white selection:bg-cyan-300/40 selection:text-white">
      <a className="sr-only focus:not-sr-only focus:absolute focus:left-5 focus:top-5 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:text-[#050D21]" href="#contenido">Saltar al contenido</a>

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#050D21]/85 px-5 backdrop-blur-xl sm:px-8">
        <nav className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 py-3" aria-label="Navegación de SquadBerry">
          <a href="#inicio" className="flex items-center gap-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-300">
            <img src="/assets/brand/squadberry-avatar.svg" alt="" width="42" height="42" className="h-10 w-10 rounded-xl" />
            <span className="leading-none"><span className="block text-lg font-bold tracking-[-0.04em]">Squad<span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">Berry</span></span><span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.26em] text-white/55">Soporte TI</span></span>
          </a>
          <div className="hidden items-center gap-6 text-sm font-medium text-white/70 md:flex">
            <a className="transition hover:text-white" href="#divisiones">Divisiones</a>
            <a className="transition hover:text-white" href="#proceso">Cómo trabajamos</a>
            <a className="transition hover:text-white" href="#contacto">Contacto</a>
          </div>
          <a href="#contacto" className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-[#050D21] transition hover:bg-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-[#050D21] sm:px-5">Hablemos de tu empresa <ArrowRight className="ml-2" size={16} /></a>
        </nav>
      </header>

      <main id="contenido">
        <section id="inicio" className="relative isolate overflow-hidden px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24">
          <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_72%_12%,rgba(45,122,255,0.35),transparent_27%),radial-gradient(circle_at_21%_47%,rgba(22,215,238,0.15),transparent_24%),radial-gradient(circle_at_76%_75%,rgba(122,63,242,0.24),transparent_27%)]" />
          <div className="absolute inset-x-0 bottom-0 -z-10 h-56 bg-gradient-to-t from-[#091633] to-transparent" />
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.06fr_.94fr] lg:items-center">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-white/5 px-3 py-1.5 text-xs font-semibold tracking-[0.12em] text-cyan-100"><Sparkles size={14} /> TECNOLOGÍA, MARKETING Y SOFTWARE</p>
              <h1 className="mt-7 text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">Todo lo que tu negocio necesita para <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-violet-300 bg-clip-text text-transparent">avanzar conectado.</span></h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">Un solo equipo para resolver tu tecnología, hacer visible tu marca y construir las herramientas que mejoren cómo trabajás.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a href="#contacto" className="inline-flex min-h-12 items-center justify-center rounded-full bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 px-6 text-base font-bold text-[#050D21] transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-cyan-200 focus:ring-offset-2 focus:ring-offset-[#050D21]">Empezar una conversación <ArrowRight className="ml-2" size={18} /></a>
                <a href="#divisiones" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 bg-white/5 px-6 text-base font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/70">Ver las tres divisiones</a>
              </div>
              <p className="mt-5 flex items-center gap-2 text-sm text-white/55"><ShieldCheck size={16} className="text-cyan-300" /> Primero entendemos lo que necesitás; después proponemos una ruta.</p>
            </div>

            <div className="relative mx-auto w-full max-w-[530px]">
              <div className="absolute inset-10 rounded-[3rem] bg-gradient-to-br from-cyan-300/30 via-blue-500/20 to-violet-400/30 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.06] p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-7">
                <img src="/assets/brand/squadberry-lockup.svg" alt="SquadBerry, Soporte TI" className="w-full rounded-[1.25rem]" />
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[
                    [Laptop, 'Soporte'], [BarChart3, 'Marketing'], [Blocks, 'Software'],
                  ].map(([Icon, label]) => {
                    const ItemIcon = Icon as typeof Laptop;
                    return <div key={label as string} className="rounded-2xl border border-white/10 bg-[#07132B]/80 px-3 py-4 text-center"><ItemIcon className="mx-auto text-cyan-300" size={21} /><p className="mt-2 text-xs font-semibold text-white/80">{label as string}</p></div>;
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.035] px-5 py-6 sm:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-white/70 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-medium text-white/85">No somos tres proveedores desconectados.</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2"><span>Diagnóstico antes que promesas</span><span>•</span><span>IA con revisión humana</span><span>•</span><span>Trabajo por etapas</span></div>
          </div>
        </section>

        <section id="divisiones" className="bg-[#F6F8FC] px-5 py-20 text-[#101828] sm:px-8 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-bold tracking-[0.15em] text-blue-700">TRES DIVISIONES, UNA MISMA RUTA</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">La solución correcta puede empezar en un solo lugar.</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">Cada negocio tiene un problema distinto. Por eso combinamos capacidades cuando ayuda, sin obligarte a contratar cosas que no necesitás.</p>
            </div>
            <div className="mt-12 grid gap-5 lg:grid-cols-3">
              {divisions.map((division) => {
                const Icon = division.icon;
                return <article key={division.label} className="group flex min-h-[390px] flex-col overflow-hidden rounded-[1.75rem] bg-white p-7 shadow-[0_18px_55px_-32px_rgba(15,23,42,0.45)] ring-1 ring-slate-200 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_65px_-30px_rgba(15,23,42,0.42)]">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${division.accent} text-white shadow-lg`}><Icon size={24} strokeWidth={2} /></div>
                  <p className="mt-7 text-xs font-bold tracking-[0.14em] text-slate-500">{division.label}</p>
                  <h3 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.035em]">{division.title}</h3>
                  <p className="mt-4 leading-7 text-slate-600">{division.text}</p>
                  <ul className="mt-auto space-y-3 pt-7 text-sm font-medium text-slate-700">{division.services.map((service) => <li key={service} className="flex gap-2"><BadgeCheck className="shrink-0 text-blue-600" size={18} />{service}</li>)}</ul>
                </article>;
              })}
            </div>
          </div>
        </section>

        <section id="proceso" className="px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.75fr_1.25fr] lg:items-start">
            <div>
              <p className="text-sm font-bold tracking-[0.15em] text-cyan-300">CÓMO TRABAJAMOS</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Menos ruido. Más claridad para decidir.</h2>
              <p className="mt-5 max-w-md text-lg leading-8 text-slate-300">El objetivo no es vender una herramienta. Es dejar una mejora que se pueda usar, medir y sostener.</p>
            </div>
            <ol className="divide-y divide-white/10 border-y border-white/10">
              {process.map(([number, title, text]) => <li key={number} className="grid gap-4 py-7 sm:grid-cols-[70px_1fr]"><span className="text-2xl font-semibold tracking-[-0.04em] text-cyan-300">{number}</span><div><h3 className="text-2xl font-semibold tracking-[-0.03em]">{title}</h3><p className="mt-2 max-w-xl leading-7 text-slate-300">{text}</p></div></li>)}
            </ol>
          </div>
        </section>

        <section className="bg-gradient-to-br from-cyan-200 via-blue-300 to-violet-300 px-5 py-16 text-[#050D21] sm:px-8 sm:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 rounded-[2rem] bg-[#07132B] px-7 py-10 text-white shadow-2xl shadow-blue-950/25 sm:px-12 sm:py-14 lg:grid-cols-[1fr_auto] lg:items-end">
            <div><Bot className="text-cyan-300" size={30} /><h2 className="mt-6 max-w-2xl text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Agentes que preparan, personas que deciden.</h2><p className="mt-4 max-w-2xl leading-7 text-slate-300">Usamos automatización e IA para investigar, ordenar y acelerar el trabajo. Las decisiones que afectan a tu negocio siempre tienen revisión humana.</p></div>
            <a href="#contacto" className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 font-bold text-[#07132B] transition hover:bg-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-[#07132B]">Conocer la propuesta <ArrowRight className="ml-2" size={18} /></a>
          </div>
        </section>

        <section id="contacto" className="px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-bold tracking-[0.15em] text-cyan-300">PRÓXIMO PASO</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] sm:text-6xl">Empecemos por entender qué necesita tu empresa.</h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">Contanos qué querés resolver. Prepararemos una conversación de alcance para elegir el mejor punto de partida: soporte, marketing, software o una combinación.</p>
            <div className="mt-9 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm text-white/70"><Search size={17} className="text-cyan-300" /> Canales de contacto y solicitud de cotización: próxima fase de migración.</div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-5 py-8 text-sm text-white/50 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><span>SquadBerry · Soporte TI, Marketing Digital y Desarrollo de Software</span><span>Vista previa interna · Sin canales comerciales activos</span></div></footer>
    </div>
  );
}
