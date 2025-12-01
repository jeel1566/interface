import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiFetch } from '@/utils/api';
import { Workflow } from '@/types';

// Zod schema for a single workflow
const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string(),
  active: z.boolean(),
  nodes: z.array(z.any()),
  connections: z.any(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Zod schema for an array of workflows
const WorkflowsSchema = z.array(WorkflowSchema);

/**
 * Fetches all workflows from the API.
 * @returns A promise that resolves to an array of workflows.
 */
const getWorkflows = async (): Promise<Workflow[]> => {
  return await apiFetch('/v1/workflows', {}, WorkflowsSchema);
};

/**
 * A React Query hook to fetch all workflows.
 *
 * @param isConnected - A boolean indicating if the user is connected to an n8n instance.
 *                       The query will only be enabled if this is true.
 * @returns The result of the useQuery hook.
 */
export const useWorkflows = (isConnected: boolean) => {
  return useQuery({
    queryKey: ['workflows'],
    queryFn: getWorkflows,
    enabled: isConnected,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });
};
