import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/utils/api';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

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
  id: string; // Added ID for dnd
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'textarea' | 'select' | 'checkbox';
  required: boolean;
  description?: string;
  options?: string[];
}

// Sortable Field Component
function SortableField({
  field,
  index,
  onRemove,
  onUpdate,
}: {
  field: DashboardField;
  index: number;
  onRemove: (index: number) => void;
  onUpdate: (index: number, updates: Partial<DashboardField>) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border rounded-lg p-4 bg-white shadow-sm relative group transition-all hover:shadow-md"
    >
      <div className="absolute left-2 top-1/2 -translate-y-1/2 cursor-move text-gray-400 hover:text-gray-600" {...attributes} {...listeners}>
        <GripVertical size={20} />
      </div>

      <button
        onClick={() => onRemove(index)}
        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
      >
        <Trash2 size={18} />
      </button>

      <div className="pl-8">
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Label</label>
            <input
              type="text"
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              value={field.label}
              onChange={(e) => onUpdate(index, { label: e.target.value })}
              placeholder="User Facing Label"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">JSON Key</label>
            <input
              type="text"
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              value={field.name}
              onChange={(e) => onUpdate(index, { name: e.target.value })}
              placeholder="e.g. email"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 items-end">
          <div className="col-span-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Type</label>
            <select
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              value={field.type}
              onChange={(e) => onUpdate(index, { type: e.target.value as any })}
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="email">Email</option>
              <option value="textarea">Long Text</option>
              <option value="select">Dropdown</option>
              <option value="checkbox">Checkbox</option>
            </select>
          </div>

          <div className="flex items-center h-10">
            <input
              type="checkbox"
              id={`req-${field.id}`}
              checked={field.required}
              onChange={(e) => onUpdate(index, { required: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor={`req-${field.id}`} className="ml-2 block text-sm text-gray-900">
              Required
            </label>
          </div>
        </div>

        {field.type === 'select' && (
          <div className="mt-3">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Options (comma separated)</label>
            <input
              type="text"
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
              placeholder="Option 1, Option 2, Option 3"
              onChange={(e) => onUpdate(index, { options: e.target.value as any })}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardBuilder() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);

  // Step 1 State
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('');

  // Step 2 State
  const [dashboardName, setDashboardName] = useState('');
  const [dashboardDescription, setDashboardDescription] = useState('');
  const [themeColor, setThemeColor] = useState('blue');
  const [fields, setFields] = useState<DashboardField[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Queries
  const { data: instances } = useQuery<Instance[]>({
    queryKey: ['instances'],
    queryFn: () => apiFetch('/v1/instances', {}, undefined),
  });

  const { data: workflows } = useQuery<Workflow[]>({
    queryKey: ['workflows', selectedInstanceId],
    queryFn: () => apiFetch(`/v1/workflows?instance_id=${selectedInstanceId}`, {}, undefined),
    enabled: !!selectedInstanceId,
  });

  // Mutation
  const createDashboardMutation = useMutation({
    mutationFn: (data: any) =>
      apiFetch('/v1/dashboards/', {
        method: 'POST',
        body: JSON.stringify(data),
      }, undefined),
    onSuccess: (data: any) => {
      showToast('Dashboard created successfully!', 'success');
      navigate(`/dashboards/${data.id}`);
    },
    onError: (error: any) => {
      showToast(`Failed to create dashboard: ${error.message}`, 'error');
    },
  });

  const handleAddField = () => {
    setFields([
      ...fields,
      {
        id: Math.random().toString(36).substr(2, 9),
        name: '',
        label: '',
        type: 'text',
        required: false
      }
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
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
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Create New App</h1>

      {/* Step 1: Select Workflow */}
      {step === 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">Step 1: Select Workflow</h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">n8n Instance</label>
            <select
              className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border"
              value={selectedInstanceId}
              onChange={(e) => setSelectedInstanceId(e.target.value)}
            >
              <option value="">Select Instance</option>
              {instances?.map((inst: Instance) => (
                <option key={inst.id} value={inst.id}>{inst.name} ({inst.url})</option>
              ))}
            </select>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Workflow</label>
            <select
              className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border"
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
            className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Next: Configure Dashboard
          </button>
        </div>
      )}

      {/* Step 2: Configure Dashboard */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">Dashboard Details</h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dashboard Name</label>
                <input
                  type="text"
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border"
                  value={dashboardName}
                  onChange={(e) => setDashboardName(e.target.value)}
                  placeholder="e.g. Customer Onboarding Form"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border"
                  value={dashboardDescription}
                  onChange={(e) => setDashboardDescription(e.target.value)}
                  placeholder="Brief description of what this dashboard does..."
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Theme Color</label>
                <select
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border"
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

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Form Fields</h2>
              <button
                onClick={handleAddField}
                className="flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                <Plus size={20} className="mr-1" />
                Add Field
              </button>
            </div>

            {fields.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <p className="text-gray-500">No fields added yet.</p>
                <button
                  onClick={handleAddField}
                  className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
                >
                  Click here to add your first field
                </button>
              </div>
            )}

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={fields.map(f => f.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <SortableField
                      key={field.id}
                      field={field}
                      index={index}
                      onRemove={handleRemoveField}
                      onUpdate={handleUpdateField}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSave}
              disabled={!dashboardName || fields.length === 0 || createDashboardMutation.isPending}
              className="bg-green-600 text-white px-8 py-2.5 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm transition-all font-medium"
            >
              {createDashboardMutation.isPending ? 'Creating...' : 'Create Dashboard'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
