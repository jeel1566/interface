import { useState } from 'react';
import OutputRenderer from './OutputRenderer';
import { apiFetch } from '@/utils/api';
import { useMutation } from '@tanstack/react-query';

interface Execution {
    run_id: string;
    status: string;
    input_data: any;
    output_data: any;
    created_at: string;
    started_at?: string;
    completed_at?: string;
    error_message?: string;
}

interface ExecutionDetailModalProps {
    execution: Execution;
    onClose: () => void;
    dashboardId?: string; // Needed for re-run
}

export default function ExecutionDetailModal({ execution, onClose, dashboardId }: ExecutionDetailModalProps) {
    const [activeTab, setActiveTab] = useState<'output' | 'input' | 'json'>('output');

    const reRunMutation = useMutation({
        mutationFn: () =>
            apiFetch(`/v1/dashboards/${dashboardId}/execute`, {
                method: 'POST',
                body: JSON.stringify({
                    inputs: execution.input_data,
                }),
            }, null),
        onSuccess: () => {
            alert('Workflow re-run started!');
            onClose();
        },
        onError: (error: any) => {
            alert(`Failed to re-run: ${error.message}`);
        }
    });

    const handleReRun = () => {
        if (!dashboardId) return;
        if (confirm('Are you sure you want to re-run this workflow with the same inputs?')) {
            reRunMutation.mutate();
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                {/* Modal panel */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <div className="flex justify-between items-center border-b pb-4 mb-4">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                        Execution Details
                                    </h3>
                                    <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                        <span className="sr-only">Close</span>
                                        ✕
                                    </button>
                                </div>

                                {/* Metadata Grid */}
                                <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                                    <div>
                                        <span className="block text-gray-500">Run ID</span>
                                        <span className="font-mono text-gray-900">{execution.run_id}</span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500">Status</span>
                                        <span className={`inline-flex px-2 text-xs font-semibold rounded-full ${execution.status === 'success' ? 'bg-green-100 text-green-800' :
                                                execution.status === 'failed' ? 'bg-red-100 text-red-800' :
                                                    'bg-blue-100 text-blue-800'
                                            }`}>
                                            {execution.status}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500">Created At</span>
                                        <span className="text-gray-900">{new Date(execution.created_at).toLocaleString()}</span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500">Duration</span>
                                        <span className="text-gray-900">
                                            {execution.completed_at && execution.started_at
                                                ? `${((new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()) / 1000).toFixed(2)}s`
                                                : '-'}
                                        </span>
                                    </div>
                                </div>

                                {/* Error Message */}
                                {execution.error_message && (
                                    <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
                                        <h4 className="text-sm font-medium text-red-800 mb-1">Error Message</h4>
                                        <pre className="text-xs text-red-700 whitespace-pre-wrap">{execution.error_message}</pre>
                                    </div>
                                )}

                                {/* Tabs */}
                                <div className="border-b border-gray-200 mb-4">
                                    <nav className="-mb-px flex space-x-8">
                                        <button
                                            onClick={() => setActiveTab('output')}
                                            className={`${activeTab === 'output'
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                        >
                                            Output Data
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('input')}
                                            className={`${activeTab === 'input'
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                        >
                                            Input Data
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('json')}
                                            className={`${activeTab === 'json'
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                        >
                                            Raw JSON
                                        </button>
                                    </nav>
                                </div>

                                {/* Tab Content */}
                                <div className="min-h-[300px] max-h-[500px] overflow-y-auto bg-gray-50 rounded-lg p-4">
                                    {activeTab === 'output' && (
                                        <OutputRenderer data={execution.output_data} />
                                    )}
                                    {activeTab === 'input' && (
                                        <OutputRenderer data={execution.input_data} />
                                    )}
                                    {activeTab === 'json' && (
                                        <pre className="text-xs text-gray-800 font-mono whitespace-pre-wrap">
                                            {JSON.stringify(execution, null, 2)}
                                        </pre>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        {dashboardId && (
                            <button
                                type="button"
                                onClick={handleReRun}
                                disabled={reRunMutation.isPending}
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                            >
                                {reRunMutation.isPending ? 'Starting...' : 'Re-run Workflow'}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
