/**
 * Simple test page to quickly verify DynamicForm component
 * Replace your App.tsx content with this to test immediately
 */
import React, { useState } from 'react';
import DynamicForm, { JSONSchema } from './components/DynamicForm';

function App() {
  const [submittedData, setSubmittedData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Simple test schema
  const testSchema: JSONSchema = {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'Email Address',
      },
      name: {
        type: 'string',
        minLength: 2,
        maxLength: 50,
        description: 'Full Name',
      },
      age: {
        type: 'number',
        minimum: 18,
        maximum: 100,
        description: 'Age',
      },
      country: {
        type: 'string',
        enum: ['USA', 'UK', 'Canada', 'Australia'],
        description: 'Country',
      },
      message: {
        type: 'string',
        format: 'textarea',
        maxLength: 500,
        description: 'Message',
      },
      subscribe: {
        type: 'boolean',
        description: 'Subscribe to newsletter',
      },
    },
    required: ['email', 'name'],
  };

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    console.log('Form Data:', data);
    setSubmittedData(data);
    setIsLoading(false);
    
    alert('Form submitted successfully! Check console for data.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            DynamicForm Test
          </h1>
          <p className="text-gray-600">
            Testing JSON Schema → React Form conversion
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Contact Form Example
          </h2>
          
          <DynamicForm
            schema={testSchema}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>

        {/* Result Display */}
        {submittedData && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-green-800">
                ✅ Form Submitted Successfully
              </h3>
              <button
                onClick={() => setSubmittedData(null)}
                className="text-sm text-green-700 hover:text-green-900 font-medium"
              >
                Clear
              </button>
            </div>
            <pre className="bg-white p-4 rounded border border-green-300 overflow-x-auto text-sm text-gray-800">
              {JSON.stringify(submittedData, null, 2)}
            </pre>
          </div>
        )}

        {/* Schema Display */}
        <details className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <summary className="cursor-pointer font-semibold text-gray-800 hover:text-gray-600">
            📋 View JSON Schema
          </summary>
          <pre className="mt-4 bg-white p-4 rounded border border-gray-200 overflow-x-auto text-xs text-gray-800">
            {JSON.stringify(testSchema, null, 2)}
          </pre>
        </details>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Test Instructions</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Fill out the form (email and name are required)</li>
            <li>• Try submitting with invalid data to see validation errors</li>
            <li>• Watch errors appear in real-time as you type</li>
            <li>• Check the browser console for submitted data</li>
            <li>• See the full schema by clicking "View JSON Schema"</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
