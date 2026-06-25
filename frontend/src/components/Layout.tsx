import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  Boxes,
  ArrowLeftRight,
  ScrollText,
  BarChart3,
  AlertTriangle,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/users', label: 'Users', icon: Users, adminOnly: true },
  { to: '/products', label: 'Products', icon: Package, adminOnly: true },
  { to: '/inventory', label: 'Inventory', userLabel: 'View Inventory', icon: Boxes },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight, adminOnly: true },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, adminOnly: true },
  { to: '/audit-logs', label: 'Audit Logs', icon: ScrollText, adminOnly: true },
  { to: '/low-stock', label: 'Low Stock Alerts', icon: AlertTriangle, adminOnly: true },
  { to: '/settings', label: 'Settings', icon: Settings, adminOnly: true },
];

export default function Layout() {
  const { name, role, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-surface-muted">
      <aside className="flex w-64 flex-col bg-navy shadow-elevated">
        <div className="flex h-16 items-center border-b border-white/10 px-6">
          <span className="text-lg font-bold text-white">Inventory</span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.filter((item) => isAdmin || !item.adminOnly).map(({ to, label, userLabel, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!isAdmin && userLabel ? userLabel : label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Logout
          </button>
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="px-3">
            <p className="text-sm font-medium text-white">{name}</p>
            <p className="text-xs text-white/50">{role === 'admin' ? 'Administrator' : 'User'}</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
