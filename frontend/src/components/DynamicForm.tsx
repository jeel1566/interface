import React, { useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

/**
 * JSON Schema types for the DynamicForm component
 */
export interface JSONSchemaProperty {
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
  accept?: string; // For file uploads
}

export interface JSONSchema {
  type: 'object';
  properties: Record<string, JSONSchemaProperty>;
  required?: string[];
  definitions?: Record<string, any>;
}

export interface DynamicFormProps {
  schema: JSONSchema;
  onSubmit: (data: Record<string, any>) => Promise<void>;
  isLoading?: boolean;
  defaultValues?: Record<string, any>;
}

/**
 * Convert JSON Schema to Zod schema for validation
 */
function jsonSchemaToZod(schema: JSONSchema): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};

  Object.entries(schema.properties).forEach(([key, property]) => {
    let zodType: z.ZodTypeAny;

    // Handle different types
    switch (property.type) {
      case 'string':
        if (property.format === 'email') {
          zodType = z.string().email('Invalid email address');
        } else if (property.enum) {
          zodType = z.enum(property.enum as [string, ...string[]]);
        } else {
          zodType = z.string();
          if (property.minLength) {
            zodType = (zodType as z.ZodString).min(
              property.minLength,
              `Minimum length is ${property.minLength}`
            );
          }
          if (property.maxLength) {
            zodType = (zodType as z.ZodString).max(
              property.maxLength,
              `Maximum length is ${property.maxLength}`
            );
          }
          if (property.pattern) {
            zodType = (zodType as z.ZodString).regex(
              new RegExp(property.pattern),
              'Invalid format'
            );
          }
        }
        break;

      case 'number':
      case 'integer':
        zodType = z.number({
          invalid_type_error: 'Must be a number',
          required_error: 'This field is required',
        });
        if (property.minimum !== undefined) {
          zodType = (zodType as z.ZodNumber).min(
            property.minimum,
            `Minimum value is ${property.minimum}`
          );
        }
        if (property.maximum !== undefined) {
          zodType = (zodType as z.ZodNumber).max(
            property.maximum,
            `Maximum value is ${property.maximum}`
          );
        }
        if (property.type === 'integer') {
          zodType = (zodType as z.ZodNumber).int('Must be an integer');
        }
        break;

      case 'boolean':
        zodType = z.boolean();
        break;

      case 'array':
        // For file uploads or multi-select
        if (property.format === 'file') {
          zodType = z.instanceof(FileList).optional();
        } else {
          zodType = z.array(z.any());
        }
        break;

      default:
        zodType = z.any();
    }

    // Handle required fields
    const isRequired = schema.required?.includes(key);
    if (!isRequired) {
      zodType = zodType.optional();
    }

    shape[key] = zodType;
  });

  return z.object(shape);
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * DynamicForm component that renders a form from JSON Schema
 */
export const DynamicForm: React.FC<DynamicFormProps> = ({
  schema,
  onSubmit,
  isLoading = false,
  defaultValues = {},
}) => {
  // Generate Zod schema from JSON Schema
  const zodSchema = useMemo(() => jsonSchemaToZod(schema), [schema]);

  // Initialize react-hook-form
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm({
    resolver: zodResolver(zodSchema),
    defaultValues,
    mode: 'onChange', // Real-time validation
  });

  // Handle form submission
  const onSubmitHandler = async (data: Record<string, any>) => {
    // Convert FileList to File[] if needed
    const processedData = { ...data };
    Object.entries(processedData).forEach(([key, value]) => {
      if (value instanceof FileList) {
        processedData[key] = Array.from(value);
      }
    });

    await onSubmit(processedData);
  };

  /**
   * Render input field based on JSON Schema property
   */
  const renderField = (key: string, property: JSONSchemaProperty) => {
    const isRequired = schema.required?.includes(key);
    const error = errors[key];

    // Determine input type
    let inputType = 'text';
    let isTextarea = false;
    let isSelect = false;
    let isCheckbox = false;
    let isFile = false;

    if (property.type === 'boolean') {
      isCheckbox = true;
    } else if (property.enum) {
      isSelect = true;
    } else if (property.format === 'email') {
      inputType = 'email';
    } else if (property.format === 'textarea') {
      isTextarea = true;
    } else if (property.type === 'number' || property.type === 'integer') {
      inputType = 'number';
    } else if (property.format === 'file' || property.type === 'array') {
      isFile = true;
    }

    return (
      <div key={key} className="mb-6">
        <label
          htmlFor={key}
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          {property.description || key}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>

        <Controller
          name={key}
          control={control}
          render={({ field }) => {
            // Checkbox input
            if (isCheckbox) {
              return (
                <input
                  {...field}
                  type="checkbox"
                  id={key}
                  checked={field.value || false}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={isLoading || isSubmitting}
                />
              );
            }

            // Select input
            if (isSelect && property.enum) {
              return (
                <select
                  {...field}
                  id={key}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    error
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300'
                  }`}
                  disabled={isLoading || isSubmitting}
                >
                  <option value="">Select {property.description || key}</option>
                  {property.enum.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              );
            }

            // File input
            if (isFile) {
              const files = field.value as FileList | undefined;
              return (
                <div>
                  <input
                    type="file"
                    id={key}
                    accept={property.accept}
                    onChange={(e) => field.onChange(e.target.files)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      error
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300'
                    }`}
                    disabled={isLoading || isSubmitting}
                  />
                  {files && files.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      {Array.from(files).map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded"
                        >
                          <span className="truncate">{file.name}</span>
                          <span className="text-gray-500 ml-2">
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            // Textarea input
            if (isTextarea) {
              return (
                <textarea
                  {...field}
                  id={key}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    error
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder={property.description}
                  disabled={isLoading || isSubmitting}
                />
              );
            }

            // Text/Number/Email input
            return (
              <input
                {...field}
                type={inputType}
                id={key}
                value={field.value || ''}
                onChange={(e) => {
                  const value =
                    inputType === 'number'
                      ? e.target.value === ''
                        ? undefined
                        : parseFloat(e.target.value)
                      : e.target.value;
                  field.onChange(value);
                }}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  error
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300'
                }`}
                placeholder={property.description}
                min={property.minimum}
                max={property.maximum}
                minLength={property.minLength}
                maxLength={property.maxLength}
                disabled={isLoading || isSubmitting}
              />
            );
          }}
        />

        {/* Error message */}
        {error && (
          <p className="mt-1 text-sm text-red-600">
            {error.message as string}
          </p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-6">
      {/* Render all fields */}
      {Object.entries(schema.properties).map(([key, property]) =>
        renderField(key, property)
      )}

      {/* Submit button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading || isSubmitting}
          className={`px-6 py-2 rounded-md font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            isLoading || isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading || isSubmitting ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Submitting...
            </span>
          ) : (
            'Submit'
          )}
        </button>
      </div>
    </form>
  );
};

export default DynamicForm;
