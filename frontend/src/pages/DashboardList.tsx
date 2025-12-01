import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/utils/api';

interface Dashboard {
    id: number;
    name: string;
    description?: string;
    theme_color: string;
    created_at: string;
}

export default function DashboardList() {
    const [searchQuery, setSearchQuery] = useState('');

    const { data: dashboards = [], isLoading } = useQuery<Dashboard[]>({
        queryKey: ['dashboards'],
        queryFn: () => apiFetch('/v1/dashboards/', {}, undefined),
    });

    // Filter dashboards based on search
    const filteredDashboards = dashboards.filter((dashboard: Dashboard) =>
        dashboard.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dashboard.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const themeColors: Record<string, string> = {
        blue: 'bg-blue-500',
        green: 'bg-green-500',
        purple: 'bg-purple-500',
        red: 'bg-red-500',
    };

    const themeIcons: Record<string, string> = {
        blue: '📊',
        green: '🟢',
        purple: '🟣',
        red: '🔴',
    };

    return (
        <div className="min-h-full bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">My Dashboards</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Manage and execute your n8n workflow dashboards
                            </p>
                        </div>
                        <div className="flex space-x-3">
                            <Link
                                to="/settings"
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                            >
                                ⚙️ Settings
                            </Link>
                            <Link
                                to="/builder"
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                            >
                                <span className="mr-2">+</span>
                                New Dashboard
                            </Link>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="mt-6">
                        <input
                            type="text"
                            placeholder="Search dashboards..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Dashboard Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-sm text-gray-500">Loading dashboards...</p>
                    </div>
                ) : filteredDashboards.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">📊</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {searchQuery ? 'No dashboards found' : 'No dashboards yet'}
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">
                            {searchQuery
                                ? 'Try adjusting your search query'
                                : 'Get started by creating your first dashboard'}
                        </p>
                        {!searchQuery && (
                            <Link
                                to="/builder"
                                className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg text-base font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                            >
                                <span className="mr-2">+</span>
                                Create Your First Dashboard
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDashboards.map((dashboard: Dashboard) => (
                            <Link
                                key={dashboard.id}
                                to={`/dashboards/${dashboard.id}`}
                                className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 overflow-hidden group"
                            >
                                {/* Color Bar */}
                                <div
                                    className={`h-2 ${themeColors[dashboard.theme_color] || 'bg-blue-500'}`}
                                ></div>

                                {/* Content */}
                                <div className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-3xl">
                                                {themeIcons[dashboard.theme_color] || '📊'}
                                            </span>
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                    {dashboard.name}
                                                </h3>
                                                {dashboard.description && (
                                                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                                                        {dashboard.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                                        <span>
                                            Created {new Date(dashboard.created_at).toLocaleDateString()}
                                        </span>
                                        <span className="text-blue-600 group-hover:text-blue-700 font-medium">
                                            Open →
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
