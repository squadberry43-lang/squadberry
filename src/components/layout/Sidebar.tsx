import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BrandMark } from '../brand/BrandMark';
import { useLocale } from '../../context/LocaleContext';

interface NavItem {
  labelKey: string;
  to: string;
  role?: string[];
  badge?: number;
}

function buildNav(userRole: string | undefined): NavItem[] {
  const items: NavItem[] = [];
  const isClient = userRole === 'particular' || userRole === 'enterprise';
  const canUseProspects = userRole === 'admin' || userRole === 'marketing';

  if (isClient) {
    items.push({ labelKey: 'staffUi.home', to: '/dashboard' });
    items.push({ labelKey: 'staffUi.services', to: '/services' });
    items.push({ labelKey: 'staffUi.myTickets', to: '/tickets' });
    items.push({ labelKey: 'staffUi.visits', to: '/visits' });
    items.push({ labelKey: 'staffUi.budgets', to: '/budgets' });
    items.push({ labelKey: 'staffUi.invoices', to: '/invoices' });
    items.push({ labelKey: 'staffUi.profile', to: '/profile' });
  }

  if (userRole === 'technician' || userRole === 'supervisor' || userRole === 'admin') {
    items.push({ labelKey: 'staffUi.home', to: '/dashboard' });
    items.push({ labelKey: 'staffUi.tickets', to: '/tickets' });
    items.push({ labelKey: 'staffUi.visits', to: '/visits' });
    if (userRole === 'technician') {
      items.push({ labelKey: 'staffUi.repairs', to: '/repairs' });
    }
    if (userRole === 'supervisor' || userRole === 'admin') {
      items.push({ labelKey: 'staffUi.budgets', to: '/budgets' });
      items.push({ labelKey: 'staffUi.invoices', to: '/invoices' });
      items.push({ labelKey: 'staffUi.clients', to: '/clients' });
      items.push({ labelKey: 'staffUi.enterprises', to: '/enterprises' });
    }
    if (canUseProspects) {
      items.push({ labelKey: 'staffUi.prospects', to: '/buscador-clientes' });
    }
    if (userRole === 'admin') {
      items.push({ labelKey: 'staffUi.inventory', to: '/inventory' });
      items.push({ labelKey: 'staffUi.services', to: '/services' });
      items.push({ labelKey: 'staffUi.users', to: '/users' });
    }
    items.push({ labelKey: 'staffUi.profile', to: '/profile' });
  }

  if (userRole === 'marketing') {
    items.push({ labelKey: 'staffUi.prospects', to: '/buscador-clientes' });
    items.push({ labelKey: 'staffUi.profile', to: '/profile' });
  }

  return items;
}

export function Sidebar() {
  const { user } = useAuth();
  const { t } = useLocale();
  const role = user?.role_name || user?.role_id?.replace('role_', '');
  const navItems = buildNav(role);

  return (
    <nav className="w-nav sidebar bg-zinc-900 text-zinc-300">
      <div className="p-4 border-b border-zinc-700">
        <div className="flex items-center gap-2">
          <BrandMark tone="light" />
        </div>
        <p className="text-xs text-zinc-500 mt-2">{t('staffUi.technicalCare')}</p>
      </div>

      <div className="p-3 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-2 rounded-[1.5rem] text-sm transition-colors ${
                isActive
                  ? 'bg-zinc-800 text-white font-medium'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`
            }
          >
            {t(item.labelKey)}
          </NavLink>
        ))}
      </div>

      {user && (
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-zinc-700">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">
              {(user.full_name || user.email)?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-200 truncate">{user.full_name || user.email}</p>
              <p className="text-[10px] text-zinc-500 truncate">{role ? t(`staffUi.role.${role}`) : ''}</p>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
