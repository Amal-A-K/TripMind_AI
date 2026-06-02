import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  // Compass, 
  LogOut, 
  Menu, 
  X, 
  // User,
  PlusCircle
} from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'New Trip', href: '/generate', icon: PlusCircle },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-surface-900 text-slate-100 flex flex-col md:flex-row relative">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[10%] right-[10%] w-[300px] h-[300px] rounded-full bg-brand-600/5 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[10%] left-[10%] w-[300px] h-[300px] rounded-full bg-accent-500/5 blur-[100px] pointer-events-none"></div>

      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-surface-800/40 border-r border-slate-800/40 p-6 z-20 shrink-0">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center font-display font-bold text-white text-lg shadow-md shadow-brand-500/10">
            T
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-white">TripMind <span className="text-brand-400">AI</span></span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1.5">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Info / Logout */}
        <div className="border-t border-slate-800/80 pt-6 mt-6">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700/50 flex items-center justify-center text-brand-400 font-semibold shadow-inner">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-200 truncate">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-all duration-200"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 bg-surface-800/40 border-b border-slate-800/40 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center font-display font-bold text-white text-base">
            T
          </div>
          <span className="font-display font-bold text-base tracking-tight text-white">TripMind <span className="text-brand-400">AI</span></span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-surface-900/95 backdrop-blur-md z-30 flex flex-col p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center font-display font-bold text-white text-base">
                T
              </div>
              <span className="font-display font-bold text-base tracking-tight text-white">TripMind <span className="text-brand-400">AI</span></span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-slate-400 hover:text-white rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${
                    active
                      ? 'bg-brand-500 text-white'
                      : 'text-slate-400 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon size={20} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-800 pt-6 mt-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-brand-400 font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-base font-semibold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all"
            >
              <LogOut size={20} />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative z-10 p-6 md:p-10">
        <div className="max-w-6xl w-full mx-auto space-y-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
