import { Menu, Bell, Search, Filter, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';

export const Header = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { user } = useAuth();

  const counties = [
    { value: 'tharaka-nithi', label: 'Tharaka-Nithi (Pilot)' },
    { value: 'other', label: 'More counties coming soon' }
  ];

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white border-b border-gray-200 z-30 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
          aria-label="Toggle menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden sm:block">
          <Search className="w-5 h-5 text-gray-400" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search projects, contractors, funders..."
            className="ml-2 bg-transparent border-none focus:outline-none text-sm text-gray-900 placeholder:text-gray-400 w-64"
            aria-label="Global search"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" aria-hidden="true" />
          <Select
            options={counties}
            placeholder="Select County"
            value="tharaka-nithi"
            className="w-48 text-sm bg-gray-50 border-gray-200"
            aria-label="County selector"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5 text-gray-600" aria-hidden="true" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </Button>

          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-gray-200">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-800 font-medium text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    </header>
  );
};