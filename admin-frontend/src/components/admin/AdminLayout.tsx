import { type ReactNode, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ClipboardList,
  LogOut,
  Shield,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AdminLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Payments', href: '/admin/payments', icon: CreditCard },
  { name: 'Audit Log', href: '/admin/audit-log', icon: ClipboardList },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, loading, logout } = useAuth();

  // Hard protection (layout-level guard)
  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      navigate('/admin/login', { replace: true });
    }
  }, [loading, isAuthenticated, isAdmin, navigate]);

  const isActive = (href: string) => {
    if (href === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(href);
  };

  const handleLogout = () => {
    logout();
    toast.success('Signed out successfully');
    navigate('/admin/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
              <Shield className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-sidebar-foreground">
                Marvalero
              </h1>
              <p className="text-xs text-admin-sidebar-muted">Admin Panel</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-accent">
                <span className="text-xs font-medium text-sidebar-foreground">
                  A
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground">
                  Admin
                </p>
                <p className="text-xs text-admin-sidebar-muted truncate">
                  Administrator
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-admin-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1">
        <div className="min-h-screen bg-background p-8">{children}</div>
      </main>
    </div>
  );
}
