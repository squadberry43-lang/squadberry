import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronDown, Menu, MessageSquare, Search, X } from 'lucide-react';
import { BrandMark } from '../brand/BrandMark';
import { useAuth } from '../../context/AuthContext';
import { CountryCode, useLocale } from '../../context/LocaleContext';
import { toast } from '../ui/Toast';
import api from '../../services/api';

export function Header() {
  const { user, logout } = useAuth();
  const { country, setCountry, t } = useLocale();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [inboxCount, setInboxCount] = useState(0);
  const moreRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMoreOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    const closeOutside = (event: PointerEvent) => {
      if (!moreRef.current?.contains(event.target as Node)) setMoreOpen(false);
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMoreOpen(false);
        moreButtonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeEscape);
    };
  }, [moreOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const role = user?.role_name || user?.role_id?.replace('role_', '');
  const isEnterprise = user?.client_id && role === 'enterprise';
  const isTechnician = role === 'technician';
  const isAdmin = role === 'admin';
  const isSupervisor = role === 'supervisor';
  const isMarketing = role === 'marketing';
  const canSeeInbox = isAdmin || isSupervisor || isTechnician;

  useEffect(() => {
    if (!canSeeInbox) { setInboxCount(0); return; }
    const update = async () => {
      try {
        const tickets = await api.getStaffInbox();
        setInboxCount(tickets.filter((ticket) => ticket.unseen_ticket || ticket.unread_count > 0).length);
      } catch { setInboxCount(0); }
    };
    void update();
    const timer = window.setInterval(() => { if (document.visibilityState === 'visible') void update(); }, 60000);
    return () => window.clearInterval(timer);
  }, [canSeeInbox, location.pathname]);
  const canUseProspects = isAdmin || isMarketing;
  const regionalHome = `/${country.toLowerCase()}`;
  const regionalServices = `${regionalHome}/services`;
  const primaryLinks: Array<{ to: string; label: string }> = isAdmin
    ? [{ to: '/tickets', label: t('nav.staffTickets') }, { to: '/repairs', label: t('nav.repairs') }, { to: '/agenda', label: t('nav.agenda') }, { to: '/buscador-clientes', label: t('nav.prospects') }, { to: '/marketing', label: t('nav.marketing') }]
    : isSupervisor
      ? [{ to: '/tickets', label: t('nav.staffTickets') }, { to: '/repairs', label: t('nav.repairs') }, { to: '/agenda', label: t('nav.agenda') }, { to: '/clients', label: t('nav.clients') }]
      : isTechnician
        ? [{ to: '/tickets', label: t('nav.staffTickets') }, { to: '/repairs', label: t('nav.repairs') }, { to: '/visits', label: t('nav.visits') }, { to: '/agenda', label: t('nav.agenda') }]
        : isMarketing
          ? [{ to: '/agenda', label: t('nav.agenda') }, { to: '/buscador-clientes', label: t('nav.prospects') }, { to: '/marketing', label: t('nav.marketing') }]
          : user
            ? [{ to: regionalServices, label: t('nav.services') }, { to: '/tickets', label: t('nav.tickets') }]
            : [{ to: regionalServices, label: t('nav.services') }, { to: `${regionalHome}#como-funciona`, label: t('nav.how') }];
  const moreLinks: Array<{ to: string; label: string }> = isAdmin
    ? [{ to: regionalServices, label: t('nav.services') }, { to: '/visits', label: t('nav.visits') }, { to: '/equipo', label: t('nav.team') }, { to: '/clients', label: t('nav.clients') }, { to: '/inventory', label: t('nav.inventory') }, { to: '/dashboard', label: t('nav.reports') }, { to: '/profile', label: t('nav.profile') }]
    : isSupervisor
      ? [{ to: '/visits', label: t('nav.visits') }, { to: '/equipo', label: t('nav.team') }, { to: '/inventory', label: t('nav.inventory') }, { to: '/profile', label: t('nav.profile') }]
      : isTechnician || isMarketing
        ? [{ to: '/profile', label: t('nav.profile') }]
        : user ? [{ to: '/profile', label: t('nav.profile') }] : [];

  const links = (mobile = false) => (
    <div className={mobile ? 'flex flex-col items-stretch gap-1' : 'flex items-center gap-1'}>
      {!user && (
        <>
          <NavLink to={regionalServices} className={({ isActive }) => `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#202124] text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
            {t('nav.services')}
          </NavLink>
          <NavLink to={`${regionalHome}#como-funciona`} className="px-3 py-2 rounded-lg text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100">
            {t('nav.how')}
          </NavLink>
        </>
      )}
      {user && !isEnterprise && !isTechnician && (
        <>
          <NavLink to={regionalServices} className={({ isActive }) => `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#202124] text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
            {t('nav.services')}
          </NavLink>
          <NavLink to="/tickets" className={({ isActive }) => `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#202124] text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
            {t('nav.tickets')}
          </NavLink>
        </>
      )}
      {isEnterprise && (
        <>
          <NavLink to={regionalServices} className={({ isActive }) => `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#202124] text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
            {t('nav.services')}
          </NavLink>
          <NavLink to="/tickets" className={({ isActive }) => `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#202124] text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
            {t('nav.tickets')}
          </NavLink>
        </>
      )}
      {(isTechnician || isSupervisor || isAdmin) && (
        <>
          <NavLink to="/tickets" className={({ isActive }) => `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#202124] text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
            {t('nav.staffTickets')}
          </NavLink>
          <NavLink to="/visits" className={({ isActive }) => `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#202124] text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
            {t('nav.visits')}
          </NavLink>
          <NavLink to="/repairs" className={({ isActive }) => `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#202124] text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
            {t('nav.repairs')}
          </NavLink>
        </>
      )}
      {(isTechnician || isSupervisor || isAdmin || isMarketing) && (
        <NavLink to="/agenda" className={({ isActive }) => `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#202124] text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
          {t('nav.agenda')}
        </NavLink>
      )}
      {(isSupervisor || isAdmin) && (
        <NavLink to="/equipo" className={({ isActive }) => `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#202124] text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
          {t('nav.team')}
        </NavLink>
      )}
      {(isAdmin || isSupervisor) && (
        <>
          <NavLink to="/clients" className={({ isActive }) => `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#202124] text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
            {t('nav.clients')}
          </NavLink>
          <NavLink to="/inventory" className={({ isActive }) => `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#202124] text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
            {t('nav.inventory')}
          </NavLink>
          {isAdmin && (
            <NavLink to="/dashboard" className={({ isActive }) => `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#202124] text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
              {t('nav.reports')}
            </NavLink>
          )}
        </>
      )}
      {canUseProspects && (
        <>
          <NavLink to="/buscador-clientes" className={({ isActive }) => `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#202124] text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
            {t('nav.prospects')}
          </NavLink>
          <NavLink to="/marketing" className={({ isActive }) => `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#202124] text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
            {t('nav.marketing')}
          </NavLink>
        </>
      )}
      {user && (
        <NavLink to="/profile" className={({ isActive }) => `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-[#202124] text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}>
          {t('nav.profile')}
        </NavLink>
      )}
    </div>
  );

  return (
    <>
      {/* Header desktop */}
      <header className="sticky top-0 z-30 glass border-b border-zinc-200">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <NavLink to={regionalHome} className="group" aria-label={t('nav.homeLink')}>
                <BrandMark />
              </NavLink>
              <nav className="hidden items-center gap-1 xl:flex" aria-label={t('nav.primaryNavigation')}>
                {primaryLinks.map(({ to, label }) => <NavLink key={to} to={to} className={({ isActive }) => `whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-[#202124] text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'}`}>{label}</NavLink>)}
                {moreLinks.length > 0 && <div ref={moreRef} className="relative">
                  <button ref={moreButtonRef} type="button" aria-label={t('nav.moreOptions')} aria-expanded={moreOpen} aria-controls="desktop-more-menu" onClick={() => setMoreOpen((open) => !open)} className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors ${moreOpen || moreLinks.some(({ to }) => location.pathname === to) ? 'bg-[#202124] text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'}`}>
                    {t('nav.more')} <ChevronDown size={14} aria-hidden="true" />
                  </button>
                  {moreOpen && <div id="desktop-more-menu" className="absolute left-0 top-full z-50 mt-2 min-w-48 rounded-md border border-zinc-200 bg-white p-1 shadow-lg">
                    {moreLinks.map(({ to, label }) => <NavLink key={to} to={to} onClick={() => setMoreOpen(false)} className={({ isActive }) => `block rounded px-3 py-2 text-sm ${isActive ? 'bg-zinc-100 font-semibold text-zinc-950' : 'text-zinc-700 hover:bg-zinc-100'}`}>{label}</NavLink>)}
                  </div>}
                </div>}
              </nav>
            </div>
            <div className="flex items-center gap-3">
              {canSeeInbox && <NavLink to="/mensajes" aria-label={`${t('nav.inbox')}${inboxCount ? `: ${inboxCount}` : ''}`} title={t('nav.inbox')} className="relative inline-flex h-9 w-9 items-center justify-center rounded text-zinc-700 hover:bg-zinc-100"><MessageSquare size={19} />{inboxCount > 0 && <span className="absolute -right-1 -top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-700 px-1 text-[10px] font-semibold text-white">{inboxCount > 99 ? '99+' : inboxCount}</span>}</NavLink>}
              <label className="sr-only" htmlFor="country-selector">{t('nav.country')}</label>
              <select
                id="country-selector"
                value={country}
                onChange={(event) => { void setCountry(event.target.value as CountryCode).catch((error) => toast(error.message, 'error')); }}
                className="hidden h-8 max-w-[150px] rounded-md border border-zinc-300 bg-white px-2 text-xs font-medium text-zinc-700 outline-none transition focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 sm:block"
              >
                {(['AR', 'CL', 'ES', 'NL', 'US'] as CountryCode[]).map((code) => <option key={code} value={code}>{t(`country.${code}`)}</option>)}
              </select>
              {user ? (
                <>
                  <button onClick={handleLogout} className="hidden sm:inline-flex btn-secondary btn-sm">
                    {t('nav.logout')}
                  </button>
                  <div className="w-9 h-9 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-600 font-medium text-sm border-2 border-white shadow-soft-sm">
                    {user.full_name?.charAt(0).toUpperCase()}
                  </div>
                </>
              ) : (
                <>
                  <NavLink to="/login" className="hidden sm:inline-flex btn-secondary btn-sm">
                    {t('nav.login')}
                  </NavLink>
                  <NavLink to="/register" className="inline-flex btn-primary btn-sm">
                    {t('nav.request')}
                  </NavLink>
                </>
              )}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-expanded={mobileOpen}
                className="xl:hidden w-10 h-10 flex items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 transition-colors"
                aria-label={t('nav.menu')}
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobiles nav dropdown */}
        {mobileOpen && (
          <div className="xl:hidden max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-zinc-200 bg-white/95 backdrop-blur-md">
            <div className="max-w-screen-2xl mx-auto px-4 py-4" onClick={(event) => {
              if ((event.target as HTMLElement).closest('a')) setMobileOpen(false);
            }}>
              {links(true)}
              <label className="mt-4 block border-t border-zinc-200 pt-4 text-xs font-medium text-zinc-600" htmlFor="mobile-country-selector">{t('nav.country')}
                <select id="mobile-country-selector" value={country} onChange={(event) => { void setCountry(event.target.value as CountryCode).catch((error) => toast(error.message, 'error')); }} className="mt-2 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900">
                  {(['AR', 'CL', 'ES', 'NL', 'US'] as CountryCode[]).map((code) => <option key={code} value={code}>{t(`country.${code}`)}</option>)}
                </select>
              </label>
              {user && (
                <div className="mt-3 pt-3 border-t border-zinc-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-600 font-medium">
                      {user.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900 truncate max-w-[200px]">{user.full_name}</p>
                      <p className="text-xs text-zinc-500 truncate max-w-[200px]">{user.email}</p>
                    </div>
                  </div>
                  <button onClick={handleLogout} className="btn-danger btn-sm">
                    {t('nav.logout')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mobile bottom nav */}
      {user && <nav className="mobile-nav md:hidden">
        <div className="flex items-center justify-around">
          {!isEnterprise && !isTechnician && !isSupervisor && !isAdmin && (
            <>
              <NavLink to="/" className={({ isActive }) => `mobile-nav-item ${isActive ? 'mobile-nav-item-active' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                <span>{t('nav.home')}</span>
              </NavLink>
              <NavLink to="/services" className={({ isActive }) => `mobile-nav-item ${isActive ? 'mobile-nav-item-active' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
                <span>{t('nav.services')}</span>
              </NavLink>
              <NavLink to="/tickets" className={({ isActive }) => `mobile-nav-item ${isActive ? 'mobile-nav-item-active' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 0 0-2 2v3a2 2 0 1 1 0 4v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5z" /></svg>
                <span>{t('nav.tickets')}</span>
              </NavLink>
            </>
          )}
          {isEnterprise && (
            <>
              <NavLink to="/" className={({ isActive }) => `mobile-nav-item ${isActive ? 'mobile-nav-item-active' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
                <span>{t('nav.home')}</span>
              </NavLink>
              <NavLink to="/services" className={({ isActive }) => `mobile-nav-item ${isActive ? 'mobile-nav-item-active' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
                <span>{t('nav.services')}</span>
              </NavLink>
              <NavLink to="/tickets" className={({ isActive }) => `mobile-nav-item ${isActive ? 'mobile-nav-item-active' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 0 0-2 2v3a2 2 0 1 1 0 4v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5z" /></svg>
                <span>{t('nav.tickets')}</span>
              </NavLink>
            </>
          )}
          {(isTechnician || isSupervisor || isAdmin) && (
            <>
              <NavLink to="/tickets" className={({ isActive }) => `mobile-nav-item ${isActive ? 'mobile-nav-item-active' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 0 0-2 2v3a2 2 0 1 1 0 4v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H5z" /></svg>
                <span>{t('nav.staffTickets')}</span>
              </NavLink>
              <NavLink to="/visits" className={({ isActive }) => `mobile-nav-item ${isActive ? 'mobile-nav-item-active' : ''}`}>
                <CalendarDays size={18} strokeWidth={2} aria-hidden="true" />
                <span>{t('nav.visits')}</span>
              </NavLink>
              <NavLink to="/repairs" className={({ isActive }) => `mobile-nav-item ${isActive ? 'mobile-nav-item-active' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.27-3.27a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.27 3.27z" /></svg>
                <span>{t('nav.repairs')}</span>
              </NavLink>
            </>
          )}
          {(isAdmin || isSupervisor) && (
            <>
              {!isTechnician && (
                <NavLink to="/clients" className={({ isActive }) => `mobile-nav-item ${isActive ? 'mobile-nav-item-active' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                  <span>{t('nav.clients')}</span>
                </NavLink>
              )}
            </>
          )}
          {isAdmin && (
            <NavLink to="/buscador-clientes" className={({ isActive }) => `mobile-nav-item ${isActive ? 'mobile-nav-item-active' : ''}`}>
              <Search size={18} strokeWidth={2} aria-hidden="true" />
              <span>{t('nav.prospects')}</span>
            </NavLink>
          )}
        </div>
      </nav>}
    </>
  );
}
