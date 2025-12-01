import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/utils/api';
import ExecutionDetailModal from './ExecutionDetailModal';

interface ExecutionHistoryProps {
    workflowId: string;
    dashboardId: string;
}

interface Execution {
    run_id: string;
    status: string;
    input_data: any;
    output_data: any;
    created_at: string;
}

export default function ExecutionHistory({ workflowId, dashboardId }: ExecutionHistoryProps) {
    const [page, setPage] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);

    const pageSize = 20;

    const { data: executions = [], isLoading, isError } = useQuery<Execution[]>({
        queryKey: ['executions', workflowId, page, statusFilter, startDate, endDate],
        queryFn: () => {
            const params = new URLSearchParams({
                workflow_id: workflowId,
                limit: pageSize.toString(),
                offset: (page * pageSize).toString(),
            });

            if (statusFilter) params.append('status', statusFilter);
            if (startDate) params.append('start_date', new Date(startDate).toISOString());
            if (endDate) params.append('end_date', new Date(endDate).toISOString());

            return apiFetch(`/v1/executions?${params.toString()}`, {}, []);
        },
        enabled: !!workflowId,
    });

    const handlePrevPage = () => {
        if (page > 0) setPage(p => p - 1);
    };

    const handleNextPage = () => {
        // Simple pagination logic: if we got a full page, assume there might be more
        if (executions.length === pageSize) setPage(p => p + 1);
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                        <option value="">All Statuses</option>
                        <option value="success">Success</option>
                        <option value="failed">Failed</option>
                        <option value="running">Running</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
                        className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
                        className="block w-full pl-3 pr-3 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    />
                </div>
                <div className="flex-1 text-right">
                    <button
                        onClick={() => { setStatusFilter(''); setStartDate(''); setEndDate(''); setPage(0); }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Loading executions...</div>
                ) : isError ? (
                    <div className="p-8 text-center text-red-500">Failed to load executions</div>
                ) : executions.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        No executions found matching your filters.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Input Summary
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Output Summary
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 cursor-pointer">
                                {executions.map((execution: Execution) => (
                                    <tr
                                        key={execution.run_id}
                                        onClick={() => setSelectedExecution(execution)}
                                        className="hover:bg-blue-50 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(execution.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${execution.status === 'success' ? 'bg-green-100 text-green-800' :
                                                execution.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                    execution.status === 'running' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {execution.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                            {JSON.stringify(execution.input_data)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                            {execution.output_data ? JSON.stringify(execution.output_data) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={handlePrevPage}
                            disabled={page === 0}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={handleNextPage}
                            disabled={executions.length < pageSize}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing page <span className="font-medium">{page + 1}</span>
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={handlePrevPage}
                                    disabled={page === 0}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    <span className="sr-only">Previous</span>
                                    ← Prev
                                </button>
                                <button
                                    onClick={handleNextPage}
                                    disabled={executions.length < pageSize}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                >
                                    Next →
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedExecution && (
                <ExecutionDetailModal
                    execution={selectedExecution}
                    onClose={() => setSelectedExecution(null)}
                    dashboardId={dashboardId}
                />
            )}
        </div>
    );
}
