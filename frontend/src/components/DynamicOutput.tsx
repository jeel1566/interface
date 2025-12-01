import React from 'react';

interface DynamicOutputProps {
  schema: any;
  data: any;
}

export default function DynamicOutput({ schema, data }: DynamicOutputProps) {
  if (!schema || !data) {
    return (
      <div className="text-gray-500 text-sm">No output data available</div>
    );
  }

  const properties = schema.properties || {};
  const propertyKeys = Object.keys(properties);

  if (propertyKeys.length === 0) {
    return (
      <pre className="bg-gray-50 p-4 rounded text-sm overflow-x-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  }

  const renderValue = (key: string, property: any, value: any) => {
    const type = property.type;
    const format = property.format;

    // Handle null/undefined
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">null</span>;
    }

    // Boolean/Checkbox
    if (type === 'boolean') {
      return (
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={value}
            disabled
            readOnly
            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">{value ? 'Yes' : 'No'}</span>
        </div>
      );
    }

    // File Upload
    if (format === 'data-url' || property.contentMediaType) {
      if (typeof value === 'string' && value.startsWith('data:')) {
        const [metadata] = value.split(',');
        const mimeMatch = metadata.match(/data:([^;]+)/);
        const mime = mimeMatch ? mimeMatch[1] : 'unknown';
        
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span className="text-sm text-gray-600">File uploaded</span>
            </div>
            <div className="text-xs text-gray-500">Type: {mime}</div>
            {mime.startsWith('image/') && (
              <img src={value} alt="Uploaded" className="mt-2 max-w-xs rounded border" />
            )}
          </div>
        );
      }
      return <span className="text-sm text-gray-700">{String(value)}</span>;
    }

    // URL
    if (format === 'uri' || format === 'url') {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline text-sm break-all"
        >
          {value}
        </a>
      );
    }

    // Email
    if (format === 'email') {
      return (
        <a
          href={`mailto:${value}`}
          className="text-blue-600 hover:underline text-sm"
        >
          {value}
        </a>
      );
    }

    // Date/DateTime
    if (format === 'date' || format === 'date-time') {
      const date = new Date(value);
      return (
        <span className="text-sm text-gray-700">
          {date.toLocaleString()}
        </span>
      );
    }

    // Number
    if (type === 'number' || type === 'integer') {
      return (
        <span className="text-sm font-mono text-gray-900">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
      );
    }

    // Array/Enum (displayed as comma-separated)
    if (type === 'array' && Array.isArray(value)) {
      return (
        <div className="space-y-1">
          {value.map((item, idx) => (
            <div key={idx} className="text-sm text-gray-700 pl-4 border-l-2 border-gray-200">
              {typeof item === 'object' ? JSON.stringify(item) : String(item)}
            </div>
          ))}
        </div>
      );
    }

    // Object
    if (type === 'object' && typeof value === 'object') {
      return (
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    // Long text (textarea)
    if (typeof value === 'string' && value.length > 100) {
      return (
        <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap break-words border border-gray-200">
          {value}
        </div>
      );
    }

    // Default: String
    return <span className="text-sm text-gray-700">{String(value)}</span>;
  };

  return (
    <div className="space-y-4">
      {propertyKeys.map((key) => {
        const property = properties[key];
        const value = data[key];
        const label = property.title || property.description || key;

        return (
          <div key={key} className="border-b border-gray-100 pb-4 last:border-b-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {label}
              {property.description && property.title && (
                <span className="block text-xs text-gray-500 font-normal mt-1">
                  {property.description}
                </span>
              )}
            </label>
            <div className="mt-1">
              {renderValue(key, property, value)}
            </div>
          </div>
        );
      })}

      {/* Show extra fields not in schema */}
      {Object.keys(data).filter(k => !propertyKeys.includes(k)).length > 0 && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Additional Fields</h3>
          <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
            {JSON.stringify(
              Object.fromEntries(
                Object.entries(data).filter(([k]) => !propertyKeys.includes(k))
              ),
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
}
