/**
 * Represents a single n8n workflow.
 */
export interface Workflow {
  id: string;
  name: string;
  active: boolean;
  nodes: any[]; // Consider defining a proper Node type
  connections: any; // Consider defining a proper Connection type
  createdAt: string;
  updatedAt: string;
}

/**
 * Represents a single execution log for a workflow.
 */
export interface ExecutionLog {
  id: string;
  workflowId: string;
  status: 'success' | 'failed' | 'running';
  startedAt: string;
  finishedAt?: string;
  url: string;
}

/**
 * Represents a generic form field for UI generation.
 */
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'password' | 'number' | 'select';
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}
