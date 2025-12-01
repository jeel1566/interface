# DynamicForm Component

A production-ready React component that dynamically renders forms from JSON Schema definitions with full validation support.

## Features

- ✅ **JSON Schema Support**: Automatically generates form fields from JSON Schema
- ✅ **Type-Safe Validation**: Uses Zod + react-hook-form for robust validation
- ✅ **Real-Time Validation**: Errors appear as users type
- ✅ **Multiple Input Types**: text, number, email, textarea, select, checkbox, file upload
- ✅ **File Upload**: Displays file name and size with proper formatting
- ✅ **Loading States**: Submit button shows spinner and disables during submission
- ✅ **TypeScript**: Fully typed with comprehensive interfaces
- ✅ **Accessible**: Proper labels, error messages, and ARIA attributes
- ✅ **Responsive**: Tailwind CSS styling that works on all screen sizes

## Installation

Install the required dependencies:

```bash
npm install react-hook-form @hookform/resolvers zod
```

## Usage

### Basic Example

```tsx
import DynamicForm from '@/components/DynamicForm';

const schema = {
  type: 'object',
  properties: {
    email: {
      type: 'string',
      format: 'email',
      description: 'Your email address'
    },
    age: {
      type: 'number',
      minimum: 18,
      maximum: 100,
      description: 'Your age'
    },
    country: {
      type: 'string',
      enum: ['USA', 'UK', 'Canada', 'Australia'],
      description: 'Your country'
    }
  },
  required: ['email', 'age']
};

function MyForm() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await fetch('/api/submit', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      alert('Form submitted!');
    } catch (error) {
      console.error(error);
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

### With Default Values

```tsx
<DynamicForm
  schema={schema}
  onSubmit={handleSubmit}
  isLoading={isLoading}
  defaultValues={{
    email: 'user@example.com',
    age: 25,
    country: 'USA'
  }}
/>
```

### File Upload Example

```tsx
const fileUploadSchema = {
  type: 'object',
  properties: {
    resume: {
      type: 'array',
      format: 'file',
      accept: '.pdf,.doc,.docx',
      description: 'Upload your resume'
    },
    coverLetter: {
      type: 'string',
      format: 'textarea',
      description: 'Cover letter',
      maxLength: 1000
    }
  },
  required: ['resume']
};

function FileUploadForm() {
  const handleSubmit = async (data: any) => {
    const formData = new FormData();
    if (data.resume && data.resume.length > 0) {
      data.resume.forEach((file: File) => {
        formData.append('resume', file);
      });
    }
    formData.append('coverLetter', data.coverLetter);
    
    await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
  };

  return <DynamicForm schema={fileUploadSchema} onSubmit={handleSubmit} />;
}
```

### Complex Validation Example

```tsx
const complexSchema = {
  type: 'object',
  properties: {
    username: {
      type: 'string',
      minLength: 3,
      maxLength: 20,
      pattern: '^[a-zA-Z0-9_]+$',
      description: 'Username (alphanumeric and underscores only)'
    },
    password: {
      type: 'string',
      minLength: 8,
      description: 'Password (minimum 8 characters)'
    },
    website: {
      type: 'string',
      format: 'uri',
      description: 'Website URL'
    },
    bio: {
      type: 'string',
      format: 'textarea',
      maxLength: 500,
      description: 'Short bio'
    },
    notifications: {
      type: 'boolean',
      description: 'Enable email notifications'
    }
  },
  required: ['username', 'password']
};
```

## JSON Schema Support

### Supported Types

- `string` - Text input
- `number` - Number input
- `integer` - Integer input (validates whole numbers)
- `boolean` - Checkbox
- `array` - File upload (when format is 'file')

### Supported Formats

- `email` - Email validation
- `uri` - URL validation (coming soon)
- `textarea` - Multi-line text input
- `file` - File upload

### Supported Validation Rules

- `required` - Field is required
- `minimum` / `maximum` - Min/max values for numbers
- `minLength` / `maxLength` - Min/max length for strings
- `pattern` - Regex pattern validation
- `enum` - Dropdown/select with predefined options

### Custom Attributes

- `accept` - File type restrictions (e.g., '.pdf,.doc')
- `description` - Field label and placeholder text

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `schema` | `JSONSchema` | Yes | JSON Schema object defining form structure |
| `onSubmit` | `(data: any) => Promise<void>` | Yes | Async function called on form submission |
| `isLoading` | `boolean` | No | External loading state (disables submit button) |
| `defaultValues` | `Record<string, any>` | No | Default form values |

## TypeScript Types

```typescript
interface JSONSchemaProperty {
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  description?: string;
  format?: 'email' | 'uri' | 'date' | 'date-time' | 'textarea';
  enum?: string[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  items?: JSONSchemaProperty;
  default?: any;
  accept?: string;
}

interface JSONSchema {
  type: 'object';
  properties: Record<string, JSONSchemaProperty>;
  required?: string[];
  definitions?: Record<string, any>;
}
```

## Styling

The component uses Tailwind CSS. Ensure Tailwind is configured in your project:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## Error Handling

Validation errors are displayed in real-time below each field:

- Red border on invalid fields
- Red error text with specific validation message
- Submit button disabled during validation errors

## Accessibility

- Proper `<label>` associations with `htmlFor`
- Required fields marked with asterisk
- Error messages linked to form fields
- Disabled states properly communicated
- Keyboard navigation support

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT
