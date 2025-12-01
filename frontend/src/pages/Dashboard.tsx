import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiFetch } from '@/utils/api';

interface Instance {
  id: string;
  name: string;
  url: string;
  is_active: boolean;
}

interface Execution {
  run_id: string;
  workflow_id: string;
  workflow_name: string | null;
  status: string;
  created_at: string;
}

export default function Dashboard() {
  const { data: instances, isLoading: instancesLoading } = useQuery({
    queryKey: ['instances'],
    queryFn: () => apiFetch('/v1/instances', {}, null),
  });

  const { data: executions, isLoading: executionsLoading } = useQuery({
    queryKey: ['recent-executions'],
    queryFn: () => apiFetch('/v1/executions?limit=10', {}, null),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Overview of your n8n instances and recent executions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">n8n Instances</h2>
            <Link to="/instances" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Manage →
            </Link>
          </div>
          {instancesLoading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : instances && instances.length > 0 ? (
            <div className="space-y-3">
              {instances.slice(0, 3).map((instance: Instance) => (
                <div key={instance.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-gray-900">{instance.name}</p>
                    <p className="text-sm text-gray-500">{instance.url}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded ${instance.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {instance.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">No instances configured</p>
              <Link to="/instances" className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Add Instance
              </Link>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Statistics</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded">
              <p className="text-3xl font-bold text-blue-600">{instances?.length || 0}</p>
              <p className="text-sm text-gray-600">Instances</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded">
              <p className="text-3xl font-bold text-green-600">
                {executions?.filter((e: Execution) => e.status === 'success').length || 0}
              </p>
              <p className="text-sm text-gray-600">Successful</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded">
              <p className="text-3xl font-bold text-yellow-600">
                {executions?.filter((e: Execution) => e.status === 'pending' || e.status === 'running').length || 0}
              </p>
              <p className="text-sm text-gray-600">Running</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded">
              <p className="text-3xl font-bold text-red-600">
                {executions?.filter((e: Execution) => e.status === 'failed').length || 0}
              </p>
              <p className="text-sm text-gray-600">Failed</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Recent Executions</h2>
          <Link to="/executions" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            View All →
          </Link>
        </div>
        <div className="p-6">
          {executionsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center space-x-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : executions && executions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Workflow</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {executions.slice(0, 5).map((execution: Execution) => (
                    <tr key={execution.run_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{execution.workflow_name || execution.workflow_id}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded ${
                          execution.status === 'success' ? 'bg-green-100 text-green-800' :
                          execution.status === 'failed' ? 'bg-red-100 text-red-800' :
                          execution.status === 'running' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {execution.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{new Date(execution.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <Link to={`/executions/${execution.run_id}`} className="text-blue-600 hover:text-blue-700 text-sm">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No executions yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
