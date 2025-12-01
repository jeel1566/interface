import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch } from '@/utils/api';

interface Workflow {
  id: string;
  name: string;
  active: boolean;
  tags?: string[];
}

interface Instance {
  id: string;
  name: string;
}

export default function Workflows() {
  const [searchParams] = useSearchParams();
  const [selectedInstance, setSelectedInstance] = useState(searchParams.get('instance') || '');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: instances } = useQuery({
    queryKey: ['instances'],
    queryFn: () => apiFetch('/v1/instances', {}, null),
  });

  const { data: workflows, isLoading } = useQuery({
    queryKey: ['workflows', selectedInstance],
    queryFn: () => 
      selectedInstance 
        ? apiFetch(`/v1/workflows?instance_id=${selectedInstance}`, {}, null)
        : Promise.resolve([]),
    enabled: !!selectedInstance,
  });

  const filteredWorkflows = workflows?.filter((wf: Workflow) =>
    wf.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Workflows</h1>
        <p className="mt-2 text-gray-600">Browse and execute workflows from your n8n instances</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Instance</label>
            <select
              value={selectedInstance}
              onChange={(e) => setSelectedInstance(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select an instance --</option>
              {instances?.map((instance: Instance) => (
                <option key={instance.id} value={instance.id}>
                  {instance.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Workflows</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Available Workflows</h2>
        </div>
        <div className="p-6">
          {!selectedInstance ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Please select an instance to view workflows</p>
            </div>
          ) : isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredWorkflows.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredWorkflows.map((workflow: Workflow) => (
                <div key={workflow.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{workflow.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded ${workflow.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {workflow.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {workflow.tags && workflow.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {workflow.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <Link
                    to={`/workflows/${workflow.id}/execute?instance=${selectedInstance}`}
                    className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Execute
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No workflows found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
