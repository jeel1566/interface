import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/utils/api';

interface Workflow {
  id: string;
  name: string;
  active: boolean;
}

interface Instance {
  id: string;
  name: string;
  url: string;
}

interface DashboardField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'textarea' | 'select' | 'checkbox';
  required: boolean;
  description?: string;
  options?: string[]; // comma separated for UI
}

export default function DashboardBuilder() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1 State
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');

  // Step 2 State
  const [dashboardName, setDashboardName] = useState('');
  const [dashboardDescription, setDashboardDescription] = useState('');
  const [themeColor, setThemeColor] = useState('blue');
  const [fields, setFields] = useState<DashboardField[]>([]);

  // Queries
  const { data: instances } = useQuery({
    queryKey: ['instances'],
    queryFn: () => apiFetch('/v1/instances', {}, []),
  });

  const { data: workflows } = useQuery({
    queryKey: ['workflows', selectedInstanceId],
    queryFn: () => apiFetch(`/v1/workflows?instance_id=${selectedInstanceId}`, {}, []),
    enabled: !!selectedInstanceId,
  });

  // Mutation
  const createDashboardMutation = useMutation({
    mutationFn: (data: any) =>
      apiFetch('/v1/dashboards/', {
        method: 'POST',
        body: JSON.stringify(data),
      }, null),
    onSuccess: (data) => {
      navigate(`/dashboards/${data.id}`);
    },
  });

  const handleAddField = () => {
    setFields([
      ...fields,
      { name: '', label: '', type: 'text', required: false }
    ]);
  };

  const handleUpdateField = (index: number, updates: Partial<DashboardField>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const payload = {
      name: dashboardName,
      description: dashboardDescription,
      workflow_id: selectedWorkflowId,
      instance_id: selectedInstanceId,
      theme_color: themeColor,
      fields: fields.map(f => ({
        ...f,
        options: f.type === 'select' && typeof f.options === 'string'
          ? (f.options as string).split(',').map((s: string) => s.trim())
          : f.options
      }))
    };
    createDashboardMutation.mutate(payload);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create New App</h1>

      {/* Step 1: Select Workflow */}
      {step === 1 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Step 1: Select Workflow</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">n8n Instance</label>
            <select
              className="w-full border rounded p-2"
              value={selectedInstanceId}
              onChange={(e) => setSelectedInstanceId(e.target.value)}
            >
              <option value="">Select Instance</option>
              {instances?.map((inst: Instance) => (
                <option key={inst.id} value={inst.id}>{inst.name} ({inst.url})</option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Workflow</label>
            <select
              className="w-full border rounded p-2"
              value={selectedWorkflowId}
              onChange={(e) => setSelectedWorkflowId(e.target.value)}
              disabled={!selectedInstanceId}
            >
              <option value="">Select Workflow</option>
              {workflows?.map((wf: Workflow) => (
                <option key={wf.id} value={wf.id}>{wf.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!selectedWorkflowId}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            Next: Configure Dashboard
          </button>
        </div>
      )}

      {/* Step 2: Configure Dashboard */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Dashboard Details</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Dashboard Name</label>
                <input
                  type="text"
                  className="w-full border rounded p-2 mt-1"
                  value={dashboardName}
                  onChange={(e) => setDashboardName(e.target.value)}
                  placeholder="e.g. Customer Onboarding Form"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  className="w-full border rounded p-2 mt-1"
                  value={dashboardDescription}
                  onChange={(e) => setDashboardDescription(e.target.value)}
                  placeholder="Brief description of what this dashboard does..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Theme Color</label>
                <select
                  className="w-full border rounded p-2 mt-1"
                  value={themeColor}
                  onChange={(e) => setThemeColor(e.target.value)}
                >
                  <option value="blue">Blue</option>
                  <option value="green">Green</option>
                  <option value="purple">Purple</option>
                  <option value="red">Red</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Form Fields</h2>
              <button
                onClick={handleAddField}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                + Add Field
              </button>
            </div>

            {fields.length === 0 && (
              <p className="text-gray-500 text-center py-4">No fields added yet. Click "+ Add Field" to start.</p>
            )}

            <div className="space-y-4">
              {fields.map((field, index) => (
                <div key={index} className="border rounded p-4 bg-gray-50 relative">
                  <button
                    onClick={() => handleRemoveField(index)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>

                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Label</label>
                      <input
                        type="text"
                        className="w-full border rounded p-1"
                        value={field.label}
                        onChange={(e) => handleUpdateField(index, { label: e.target.value })}
                        placeholder="User Facing Label"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500">JSON Key (n8n input)</label>
                      <input
                        type="text"
                        className="w-full border rounded p-1"
                        value={field.name}
                        onChange={(e) => handleUpdateField(index, { name: e.target.value })}
                        placeholder="e.g. email"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500">Type</label>
                      <select
                        className="w-full border rounded p-1"
                        value={field.type}
                        onChange={(e) => handleUpdateField(index, { type: e.target.value as any })}
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="email">Email</option>
                        <option value="textarea">Long Text</option>
                        <option value="select">Dropdown</option>
                        <option value="checkbox">Checkbox</option>
                      </select>
                    </div>
                    <div className="flex items-center mt-4">
                      <input
                        type="checkbox"
                        id={`req-${index}`}
                        checked={field.required}
                        onChange={(e) => handleUpdateField(index, { required: e.target.checked })}
                        className="mr-2"
                      />
                      <label htmlFor={`req-${index}`} className="text-sm text-gray-700">Required</label>
                    </div>
                  </div>

                  {field.type === 'select' && (
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-gray-500">Options (comma separated)</label>
                      <input
                        type="text"
                        className="w-full border rounded p-1"
                        placeholder="Option 1, Option 2, Option 3"
                        onChange={(e) => handleUpdateField(index, { options: e.target.value as any })}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Back
            </button>
            <button
              onClick={handleSave}
              disabled={!dashboardName || fields.length === 0 || createDashboardMutation.isPending}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
            >
              {createDashboardMutation.isPending ? 'Creating...' : 'Create Dashboard'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
