# DynamicForm Component - Installation & Setup Guide

## Quick Setup

### 1. Install Dependencies

```bash
cd frontend
npm install react-hook-form @hookform/resolvers
```

**Note:** `zod` is already installed in your project.

### 2. Verify Tailwind CSS Setup

Ensure Tailwind is configured (it already is in your project):

```bash
# These are already installed
npm install -D tailwindcss postcss autoprefixer
```

### 3. Import and Use

```tsx
import DynamicForm from '@/components/DynamicForm';
import type { JSONSchema } from '@/components/DynamicForm';
```

## Testing the Component

### Option 1: Add to Your App

Edit `frontend/src/App.tsx`:

```tsx
import DynamicFormExample from '@/components/DynamicFormExample';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <DynamicFormExample />
    </div>
  );
}

export default App;
```

### Option 2: Run the Example

```bash
cd frontend
npm run dev
```

Visit `http://localhost:5173` to see the three example forms.

## Package Versions

The following versions are compatible with your React 19 setup:

- `react-hook-form`: ^7.52.0
- `@hookform/resolvers`: ^3.9.0
- `zod`: ^3.23.8 (already installed)

## Integration with n8n-interface

To use DynamicForm with n8n workflow inputs:

```tsx
import { useQuery } from '@tanstack/react-query';
import DynamicForm from '@/components/DynamicForm';
import { apiFetch } from '@/utils/api';

function WorkflowExecutor({ workflowId }: { workflowId: string }) {
  // Fetch workflow schema from backend
  const { data: workflow } = useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: () => apiFetch(`/v1/workflows/${workflowId}`),
  });

  const handleSubmit = async (data: any) => {
    // Execute workflow with input data
    await apiFetch(`/v1/workflows/${workflowId}/execute`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  };

  if (!workflow) return <div>Loading...</div>;

  return (
    <DynamicForm
      schema={workflow.input_schema}
      onSubmit={handleSubmit}
    />
  );
}
```

## Files Created

```
frontend/src/components/
├── DynamicForm.tsx          # Main component
├── DynamicFormExample.tsx   # Example usage with 3 demos
└── DynamicForm.md          # Full documentation
```

## Next Steps

1. Install dependencies: `npm install react-hook-form @hookform/resolvers`
2. Test the example: Update App.tsx to import DynamicFormExample
3. Integrate with your backend API endpoints
4. Customize styling as needed

## Troubleshooting

### TypeScript Errors

If you see path alias errors (`@/components`), ensure `tsconfig.app.json` has:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

This is already configured in your project.

### React 19 Compatibility

All dependencies are compatible with React 19. If you encounter issues:

```bash
npm install react-hook-form@latest @hookform/resolvers@latest
```

## Support

For questions or issues, refer to:
- [react-hook-form docs](https://react-hook-form.com/)
- [Zod docs](https://zod.dev/)
- `DynamicForm.md` for usage examples
