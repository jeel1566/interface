import React, { useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/utils/api';
import DynamicForm from '@/components/DynamicForm';

interface Workflow {
  id: string;
  name: string;
  input_schema?: any;
}

export default function WorkflowExecute() {
  const { workflowId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const instanceId = searchParams.get('instance');
  const [executionResult, setExecutionResult] = useState<any>(null);

  const { data: workflow, isLoading } = useQuery({
    queryKey: ['workflow', workflowId, instanceId],
    queryFn: () => apiFetch(`/v1/workflows/${workflowId}?instance_id=${instanceId}`, {}, null),
    enabled: !!workflowId && !!instanceId,
  });

  const executeMutation = useMutation({
    mutationFn: (data: any) =>
      apiFetch(`/v1/workflows/${workflowId}/execute`, {
        method: 'POST',
        body: JSON.stringify({
          instance_id: instanceId,
          input_data: data,
        }),
      }, null),
    onSuccess: (data) => {
      setExecutionResult(data);
      setTimeout(() => {
        navigate(`/executions/${data.run_id}`);
      }, 2000);
    },
  });

  const handleSubmit = async (data: any) => {
    await executeMutation.mutateAsync(data);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Workflow not found
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{workflow.name}</h1>
        <p className="mt-2 text-gray-600">Fill in the required inputs to execute this workflow</p>
      </div>

      {executionResult ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-medium text-green-900">Workflow Execution Started!</h3>
              <p className="mt-2 text-sm text-green-700">
                Run ID: {executionResult.run_id}
              </p>
              <p className="mt-1 text-sm text-green-700">
                Status: {executionResult.status}
              </p>
              <p className="mt-2 text-sm text-green-600">
                Redirecting to execution details...
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {executeMutation.isError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          Error executing workflow: {(executeMutation.error as any)?.message || 'Unknown error'}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Workflow Inputs</h2>
        {workflow.input_schema ? (
          <DynamicForm
            schema={workflow.input_schema}
            onSubmit={handleSubmit}
            isLoading={executeMutation.isPending}
          />
        ) : (
          <div>
            <p className="text-gray-500 mb-4">This workflow has no input schema defined.</p>
            <button
              onClick={() => handleSubmit({})}
              disabled={executeMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {executeMutation.isPending ? 'Executing...' : 'Execute Workflow'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
