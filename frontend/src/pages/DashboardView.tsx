import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/utils/api';
import DynamicForm from '@/components/DynamicForm';
import Sidebar from '@/components/Sidebar';
import ExecutionHistory from '@/components/ExecutionHistory';

interface DashboardField {
    name: string;
    label: string;
    type: string;
    required: boolean;
    options?: string[];
}

interface Dashboard {
    id: number;
    name: string;
    description?: string;
    theme_color: string;
    workflow_id: string;
    fields: DashboardField[];
}

export default function DashboardView() {
    const { dashboardId } = useParams();
    const [activeTab, setActiveTab] = useState<'execute' | 'history' | 'settings'>('execute');
    const [executionResult, setExecutionResult] = useState<any>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const { data: dashboard, isLoading } = useQuery<Dashboard>({
        queryKey: ['dashboard', dashboardId],
        queryFn: () => apiFetch(`/v1/dashboards/${dashboardId}`, {}, null),
        enabled: !!dashboardId,
    });

    const executeMutation = useMutation({
        mutationFn: (data: any) =>
            apiFetch(`/v1/dashboards/${dashboardId}/execute`, {
                method: 'POST',
                body: JSON.stringify({
                    inputs: data,
                }),
            }, null),
        onSuccess: (data) => {
            setExecutionResult(data);
        },
    });

    const handleSubmit = async (data: any) => {
        await executeMutation.mutateAsync(data);
    };

    if (isLoading) {
        return (
            <div className="flex h-screen">
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-sm text-gray-500">Loading Dashboard...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!dashboard) {
        return (
            <div className="flex h-screen">
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-red-600">Dashboard not found</div>
                </div>
            </div>
        );
    }

    // Convert DashboardFields to JSON Schema for DynamicForm
    const schema = {
        type: 'object',
        properties: dashboard.fields.reduce((acc: any, field: any) => {
            acc[field.name] = {
                type: field.type === 'number' ? 'number' : 'string',
                description: field.label,
                enum: field.options,
                format: field.type === 'email' ? 'email' : field.type === 'textarea' ? 'textarea' : undefined,
            };
            return acc;
        }, {}),
        required: dashboard.fields.filter((f: any) => f.required).map((f: any) => f.name),
    };

    const themeClasses = {
        blue: 'bg-blue-600',
        green: 'bg-green-600',
        purple: 'bg-purple-600',
        red: 'bg-red-600',
    };

    const headerColor = themeClasses[dashboard.theme_color as keyof typeof themeClasses] || 'bg-blue-600';

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className={`${headerColor} px-6 py-4 shadow-sm`}>
                    <div className="flex items-center">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden mr-4 text-white"
                        >
                            ☰
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-white">{dashboard.name}</h1>
                            {dashboard.description && <p className="text-blue-100 mt-1">{dashboard.description}</p>}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="mt-4 flex space-x-4 border-b border-blue-500">
                        <button
                            onClick={() => setActiveTab('execute')}
                            className={`pb-2 px-1 text-sm font-medium transition-colors ${activeTab === 'execute'
                                    ? 'text-white border-b-2 border-white'
                                    : 'text-blue-200 hover:text-white'
                                }`}
                        >
                            🔵 Execute
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`pb-2 px-1 text-sm font-medium transition-colors ${activeTab === 'history'
                                    ? 'text-white border-b-2 border-white'
                                    : 'text-blue-200 hover:text-white'
                                }`}
                        >
                            📜 History
                        </button>
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`pb-2 px-1 text-sm font-medium transition-colors ${activeTab === 'settings'
                                    ? 'text-white border-b-2 border-white'
                                    : 'text-blue-200 hover:text-white'
                                }`}
                        >
                            ⚙️ Settings
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Execute Tab */}
                    {activeTab === 'execute' && (
                        <div className="max-w-2xl mx-auto">
                            {executionResult ? (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                                        <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">Execution Started!</h3>
                                    <p className="mt-2 text-sm text-gray-500">
                                        Run ID: {executionResult.run_id}
                                    </p>
                                    <div className="mt-6">
                                        <button
                                            onClick={() => setExecutionResult(null)}
                                            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-green-700 bg-green-100 border border-transparent rounded-md hover:bg-green-200"
                                        >
                                            Execute Again
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('history')}
                                            className="ml-3 inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                        >
                                            View History
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h2 className="text-lg font-semibold mb-4">Execute Workflow</h2>
                                    <DynamicForm
                                        schema={schema as any}
                                        onSubmit={handleSubmit}
                                        isLoading={executeMutation.isPending}
                                    />

                                    {executeMutation.isError && (
                                        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                            Error: {(executeMutation.error as any)?.message || 'Something went wrong'}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* History Tab */}
                    {activeTab === 'history' && (
                        <div className="max-w-6xl mx-auto">
                            <ExecutionHistory
                                workflowId={dashboard.workflow_id}
                                dashboardId={dashboardId || ''}
                            />
                        </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <div className="max-w-2xl mx-auto">
                            <div className="bg-white rounded-lg shadow p-6">
                                <h2 className="text-lg font-semibold mb-4">Dashboard Settings</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Dashboard Name</label>
                                        <p className="mt-1 text-sm text-gray-900">{dashboard.name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Description</label>
                                        <p className="mt-1 text-sm text-gray-900">{dashboard.description || 'No description'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Theme Color</label>
                                        <p className="mt-1 text-sm text-gray-900 capitalize">{dashboard.theme_color}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Workflow ID</label>
                                        <p className="mt-1 text-sm text-gray-900 font-mono">{dashboard.workflow_id}</p>
                                    </div>
                                    <div className="pt-4 border-t">
                                        <p className="text-sm text-gray-500">
                                            Dashboard editing coming soon. For now, create a new dashboard to make changes.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
