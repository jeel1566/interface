import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/utils/api';
import DynamicOutput from '@/components/DynamicOutput';

interface ExecutionDetail {
  run_id: string;
  workflow_id: string;
  workflow_name: string | null;
  status: string;
  input_data?: any;
  output_data?: any;
  input_schema?: any;
  output_schema?: any;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export default function ExecutionDetail() {
  const { runId } = useParams();

  const { data: execution, isLoading, error } = useQuery({
    queryKey: ['execution', runId],
    queryFn: () => apiFetch(`/v1/executions/${runId}`, {}, null),
    enabled: !!runId,
    refetchInterval: (data) => {
      // Auto-refresh if execution is still running
      if (data && (data.status === 'pending' || data.status === 'running')) {
        return 3000; // Refresh every 3 seconds
      }
      return false;
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !execution) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Execution not found or error loading details
        </div>
      </div>
    );
  }

  const duration = execution.started_at && execution.completed_at
    ? Math.round((new Date(execution.completed_at).getTime() - new Date(execution.started_at).getTime()) / 1000)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link to="/executions" className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block">
          ← Back to Executions
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Execution Details</h1>
        <p className="mt-2 text-gray-600">{execution.workflow_name || execution.workflow_id}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
          <span className={`inline-flex px-3 py-1 text-sm rounded ${
            execution.status === 'success' ? 'bg-green-100 text-green-800' :
            execution.status === 'failed' ? 'bg-red-100 text-red-800' :
            execution.status === 'running' ? 'bg-blue-100 text-blue-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {execution.status}
            {(execution.status === 'pending' || execution.status === 'running') && (
              <span className="ml-2">🔄</span>
            )}
          </span>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Duration</h3>
          <p className="text-2xl font-bold text-gray-900">
            {duration ? `${duration}s` : execution.status === 'running' ? 'In progress...' : '-'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Run ID</h3>
          <p className="text-sm font-mono text-gray-900 break-all">{execution.run_id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Timeline</h2>
          </div>
          <div className="p-6 space-y-3">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-500 w-32">Created:</span>
              <span className="text-sm text-gray-900">{new Date(execution.created_at).toLocaleString()}</span>
            </div>
            {execution.started_at && (
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-500 w-32">Started:</span>
                <span className="text-sm text-gray-900">{new Date(execution.started_at).toLocaleString()}</span>
              </div>
            )}
            {execution.completed_at && (
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-500 w-32">Completed:</span>
                <span className="text-sm text-gray-900">{new Date(execution.completed_at).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {execution.input_data && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Input Data</h2>
            </div>
            <div className="p-6">
              {execution.input_schema ? (
                <DynamicOutput schema={execution.input_schema} data={execution.input_data} />
              ) : (
                <pre className="bg-gray-50 p-4 rounded text-sm overflow-x-auto">
                  {JSON.stringify(execution.input_data, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}

        {execution.output_data && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Output Data</h2>
            </div>
            <div className="p-6">
              {execution.output_schema ? (
                <DynamicOutput schema={execution.output_schema} data={execution.output_data} />
              ) : (
                <pre className="bg-gray-50 p-4 rounded text-sm overflow-x-auto">
                  {JSON.stringify(execution.output_data, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}

        {execution.error_message && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-red-200 bg-red-50">
              <h2 className="text-lg font-semibold text-red-900">Error Details</h2>
            </div>
            <div className="p-6">
              <pre className="bg-red-50 p-4 rounded text-sm text-red-900 overflow-x-auto border border-red-200">
                {execution.error_message}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
