import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  FileText, 
  PlusCircle,
  Activity,
  LogOut,
  User,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';

const navigation = {
  oversight: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/projects', label: 'Projects', icon: FolderKanban },
    { path: '/community-needs', label: 'Community Needs', icon: Users },
    { path: '/citizen-reports', label: 'Project Accountability Reports', icon: FileText },
    { path: '/add-project', label: 'Add Project', icon: PlusCircle }
  ],
  citizen: [
    { path: '/citizen-dashboard', label: 'My Dashboard', icon: LayoutDashboard },
    { path: '/citizen/projects', label: 'Launched Projects', icon: FolderKanban },
    { path: '/citizen/report-launched-project', label: 'Report a Launched Project', icon: PlusCircle },
    { path: '/citizen/report-project-update', label: 'Report Project Progress', icon: Activity },
    { path: '/citizen/my-reports', label: 'My Submissions', icon: FileText }
  ]
};

export const Sidebar = ({ open = false, onClose }: { open?: boolean; onClose?: () => void }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isOversight = user?.role === 'oversight';
  const navItems = navigation[isOversight ? 'oversight' : 'citizen'];

  return (
    <aside className={`fixed left-0 top-0 h-full w-64 bg-green-950 text-white flex flex-col z-40 shadow-2xl transition-transform duration-300 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-700 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg">Build Kenya</h1>
            <p className="text-xs text-green-300">Project Accountability</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive 
                  ? 'bg-green-700 text-white' 
                  : 'text-green-200 hover:bg-green-800 hover:text-white'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-green-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-3 bg-green-800 rounded-lg">
          <User className="w-5 h-5 text-green-300" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-green-400 capitalize">{user?.role}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-green-200 hover:text-white hover:bg-green-800"
          onClick={logout}
        >
          <LogOut className="w-5 h-5" aria-hidden="true" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
};