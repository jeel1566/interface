# 🎯 DynamicForm Component - Complete Guide

## Overview

A production-ready React component that automatically generates forms from JSON Schema with full validation, TypeScript support, and Tailwind CSS styling.

---

## 📦 Installation

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

This will install:
- `react-hook-form@^7.52.0` (already added to package.json)
- `@hookform/resolvers@^3.9.0` (already added to package.json)
- `zod@^3.23.8` (already installed)

### Step 2: Verify Tailwind CSS

Tailwind is already configured in your project. No additional setup needed.

---

## 🚀 Quick Test

### Option 1: Use Test App

Replace `frontend/src/App.tsx` with `frontend/src/App.test.tsx`:

```bash
# Windows
copy frontend\src\App.test.tsx frontend\src\App.tsx

# Mac/Linux
cp frontend/src/App.test.tsx frontend/src/App.tsx
```

Then run:
```bash
npm run dev
```

Visit: http://localhost:5173

### Option 2: Use Full Examples

Import the examples component in `App.tsx`:

```tsx
import DynamicFormExample from '@/components/DynamicFormExample';

function App() {
  return <DynamicFormExample />;
}

export default App;
```

---

## 📝 Basic Usage

```tsx
import DynamicForm from '@/components/DynamicForm';
import type { JSONSchema } from '@/components/DynamicForm';
import { useState } from 'react';

function MyForm() {
  const [isLoading, setIsLoading] = useState(false);

  const schema: JSONSchema = {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'Email Address'
      },
      age: {
        type: 'number',
        minimum: 18,
        description: 'Your Age'
      }
    },
    required: ['email']
  };

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      alert('Success!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DynamicForm
      schema={schema}
      onSubmit={handleSubmit}
      isLoading={isLoading}
    />
  );
}
```

---

## 🎨 Supported Input Types

| JSON Schema Config | Rendered Input | Validation |
|-------------------|----------------|------------|
| `type: "string"` | Text input | minLength, maxLength, pattern |
| `type: "string", format: "email"` | Email input | Email validation |
| `type: "string", format: "textarea"` | Textarea | maxLength |
| `type: "string", enum: [...]` | Select dropdown | Must match enum |
| `type: "number"` | Number input | min, max |
| `type: "integer"` | Integer input | min, max, integers only |
| `type: "boolean"` | Checkbox | true/false |
| `type: "array", format: "file"` | File upload | accept attribute |

---

## 🔧 JSON Schema Examples

### Email with Pattern Validation

```json
{
  "email": {
    "type": "string",
    "format": "email",
    "description": "Work Email"
  }
}
```

### Number with Range

```json
{
  "age": {
    "type": "number",
    "minimum": 18,
    "maximum": 100,
    "description": "Age"
  }
}
```

### Select Dropdown

```json
{
  "country": {
    "type": "string",
    "enum": ["USA", "UK", "Canada"],
    "description": "Country"
  }
}
```

### Textarea

```json
{
  "bio": {
    "type": "string",
    "format": "textarea",
    "maxLength": 500,
    "description": "Bio"
  }
}
```

### File Upload

```json
{
  "resume": {
    "type": "array",
    "format": "file",
    "accept": ".pdf,.doc,.docx",
    "description": "Upload Resume"
  }
}
```

### Checkbox

```json
{
  "agree": {
    "type": "boolean",
    "description": "I agree to terms"
  }
}
```

### String with Pattern (Regex)

```json
{
  "phone": {
    "type": "string",
    "pattern": "^[0-9]{10}$",
    "description": "Phone (10 digits)"
  }
}
```

---

## 🔌 Integration with n8n Backend

### Workflow Execution Form

```tsx
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/utils/api';
import DynamicForm from '@/components/DynamicForm';

function WorkflowExecutor({ workflowId }: { workflowId: string }) {
  const { data: workflow, isLoading } = useQuery({
    queryKey: ['workflow', workflowId],
    queryFn: () => apiFetch(`/v1/workflows/${workflowId}`),
  });

  const [executing, setExecuting] = useState(false);

  const handleExecute = async (inputData: any) => {
    setExecuting(true);
    try {
      const result = await apiFetch(`/v1/workflows/${workflowId}/execute`, {
        method: 'POST',
        body: JSON.stringify(inputData),
      });
      alert(`Workflow started! Run ID: ${result.run_id}`);
    } finally {
      setExecuting(false);
    }
  };

  if (isLoading) return <div>Loading workflow...</div>;
  if (!workflow) return <div>Workflow not found</div>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">{workflow.name}</h1>
      
      <DynamicForm
        schema={workflow.input_schema}
        onSubmit={handleExecute}
        isLoading={executing}
      />
    </div>
  );
}
```

### Backend Schema Parsing

Your backend should return workflow definitions with `input_schema`:

```python
# backend/api/n8n_service.py
def parse_input_schema(workflow_json: Dict[str, Any]) -> Dict[str, Any]:
    """Extract input schema from workflow"""
    nodes = workflow_json.get("nodes", [])
    trigger_node = nodes[0] if nodes else {}
    
    schema = trigger_node.get("parameters", {}).get("schema", {})
    
    if not schema:
        # Default schema
        return {
            "type": "object",
            "properties": {},
            "required": []
        }
    
    return schema
```

---

## 🎯 Props Reference

```typescript
interface DynamicFormProps {
  schema: JSONSchema;              // Required: JSON Schema object
  onSubmit: (data: any) => Promise<void>;  // Required: Async submit handler
  isLoading?: boolean;             // Optional: External loading state
  defaultValues?: Record<string, any>;  // Optional: Default form values
}
```

---

## 📚 Files Reference

| File | Purpose |
|------|---------|
| `frontend/src/components/DynamicForm.tsx` | Main component (378 lines) |
| `frontend/src/components/DynamicFormExample.tsx` | 3 working examples (240 lines) |
| `frontend/src/components/DynamicForm.md` | Full API documentation |
| `frontend/src/App.test.tsx` | Quick test page |
| `frontend/SETUP_DYNAMIC_FORM.md` | Setup guide |
| `DYNAMIC_FORM_SUMMARY.md` | Project summary |

---

## ✅ Features Checklist

- ✅ JSON Schema to form conversion
- ✅ Real-time validation with Zod
- ✅ React Hook Form integration
- ✅ 8 input types (text, number, email, textarea, select, checkbox, file)
- ✅ File upload with size/name display
- ✅ Loading states with spinner
- ✅ Error messages below fields
- ✅ TypeScript types
- ✅ Tailwind CSS styling
- ✅ Accessible (WCAG 2.1)
- ✅ Production-ready
- ✅ Fully documented
- ✅ Example components

---

## 🐛 Troubleshooting

### "Cannot find module '@/components/DynamicForm'"

Ensure `tsconfig.app.json` has path aliases (already configured):
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

### "Module not found: react-hook-form"

Install dependencies:
```bash
npm install react-hook-form @hookform/resolvers
```

### Validation not working

Check that your schema has proper `required` array:
```json
{
  "type": "object",
  "properties": { ... },
  "required": ["email", "name"]
}
```

---

## 🚢 Deployment

Component is production-ready. No additional configuration needed for:
- Vercel
- Netlify
- Render
- Any static hosting

---

## 📖 Additional Resources

- [React Hook Form Docs](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)
- [JSON Schema Spec](https://json-schema.org/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 🎉 You're Ready!

Run `npm run dev` and start testing! 🚀
