import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/utils/api';

interface Dashboard {
    id: number;
    name: string;
    theme_color: string;
}

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
    const location = useLocation();

    const { data: dashboards = [], isLoading } = useQuery({
        queryKey: ['dashboards'],
        queryFn: () => apiFetch('/v1/dashboards/', {}, []),
    });

    const isActive = (path: string) => location.pathname === path;

    const themeIcons: Record<string, string> = {
        blue: '📊',
        green: '🟢',
        purple: '🟣',
        red: '🔴',
    };

    return (
        <div
            className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}
        >
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">Dashboards</h2>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="lg:hidden text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Dashboard List */}
            <div className="flex-1 overflow-y-auto py-4">
                {isLoading ? (
                    <div className="px-4 text-sm text-gray-500">Loading...</div>
                ) : dashboards.length === 0 ? (
                    <div className="px-4 text-sm text-gray-500">
                        No dashboards yet
                    </div>
                ) : (
                    <nav className="space-y-1 px-2">
                        {dashboards.map((dashboard: Dashboard) => (
                            <Link
                                key={dashboard.id}
                                to={`/dashboards/${dashboard.id}`}
                                className={`
                  flex items-center px-3 py-2 text-sm font-medium rounded-lg
                  transition-colors duration-150
                  ${isActive(`/dashboards/${dashboard.id}`)
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }
                `}
                            >
                                <span className="mr-3 text-lg">
                                    {themeIcons[dashboard.theme_color] || '📊'}
                                </span>
                                <span className="flex-1 truncate">{dashboard.name}</span>
                                {isActive(`/dashboards/${dashboard.id}`) && (
                                    <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                                )}
                            </Link>
                        ))}
                    </nav>
                )}
            </div>

            {/* Footer Actions */}
            <div className="border-t border-gray-200 p-4 space-y-2">
                <Link
                    to="/builder"
                    className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <span className="mr-2">+</span>
                    New Dashboard
                </Link>
                <Link
                    to="/settings"
                    className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    ⚙️ Settings
                </Link>
            </div>
        </div>
    );
}
