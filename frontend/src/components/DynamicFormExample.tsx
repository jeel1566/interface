import React, { useState } from 'react';
import DynamicForm, { JSONSchema } from './DynamicForm';

/**
 * Example component demonstrating DynamicForm usage
 */
export const DynamicFormExample: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [submittedData, setSubmittedData] = useState<any>(null);

  // Example 1: User Registration Form
  const registrationSchema: JSONSchema = {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'Email Address',
      },
      username: {
        type: 'string',
        minLength: 3,
        maxLength: 20,
        description: 'Username',
      },
      age: {
        type: 'number',
        minimum: 18,
        maximum: 100,
        description: 'Age',
      },
      country: {
        type: 'string',
        enum: ['USA', 'UK', 'Canada', 'Australia', 'Germany'],
        description: 'Country',
      },
      bio: {
        type: 'string',
        format: 'textarea',
        maxLength: 500,
        description: 'Tell us about yourself',
      },
      newsletter: {
        type: 'boolean',
        description: 'Subscribe to newsletter',
      },
    },
    required: ['email', 'username', 'age'],
  };

  // Example 2: Job Application Form
  const jobApplicationSchema: JSONSchema = {
    type: 'object',
    properties: {
      fullName: {
        type: 'string',
        minLength: 2,
        description: 'Full Name',
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'Email Address',
      },
      phone: {
        type: 'string',
        pattern: '^[0-9]{10}$',
        description: 'Phone Number (10 digits)',
      },
      experience: {
        type: 'integer',
        minimum: 0,
        maximum: 50,
        description: 'Years of Experience',
      },
      position: {
        type: 'string',
        enum: ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'DevOps Engineer'],
        description: 'Position Applied For',
      },
      resume: {
        type: 'array',
        format: 'file',
        accept: '.pdf,.doc,.docx',
        description: 'Upload Resume',
      },
      coverLetter: {
        type: 'string',
        format: 'textarea',
        maxLength: 1000,
        description: 'Cover Letter',
      },
      remoteWork: {
        type: 'boolean',
        description: 'Open to remote work',
      },
    },
    required: ['fullName', 'email', 'position', 'resume'],
  };

  // Example 3: n8n Workflow Input Schema
  const workflowInputSchema: JSONSchema = {
    type: 'object',
    properties: {
      customer_email: {
        type: 'string',
        format: 'email',
        description: 'Customer Email',
      },
      order_id: {
        type: 'string',
        pattern: '^ORD-[0-9]{6}$',
        description: 'Order ID (format: ORD-123456)',
      },
      amount: {
        type: 'number',
        minimum: 0,
        description: 'Order Amount (USD)',
      },
      priority: {
        type: 'string',
        enum: ['Low', 'Medium', 'High', 'Urgent'],
        description: 'Priority Level',
      },
      notes: {
        type: 'string',
        format: 'textarea',
        maxLength: 500,
        description: 'Additional Notes',
      },
    },
    required: ['customer_email', 'order_id', 'amount'],
  };

  const [activeExample, setActiveExample] = useState<'registration' | 'job' | 'workflow'>('registration');

  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log('Form submitted:', data);
      setSubmittedData(data);
      alert('Form submitted successfully!');
    } catch (error) {
      console.error('Submission error:', error);
      alert('Error submitting form');
    } finally {
      setIsLoading(false);
    }
  };

  const getSchema = () => {
    switch (activeExample) {
      case 'registration':
        return registrationSchema;
      case 'job':
        return jobApplicationSchema;
      case 'workflow':
        return workflowInputSchema;
      default:
        return registrationSchema;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">DynamicForm Examples</h1>
      <p className="text-gray-600 mb-6">
        Select an example to see how DynamicForm works with different schemas
      </p>

      {/* Example Selector */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={() => setActiveExample('registration')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeExample === 'registration'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          User Registration
        </button>
        <button
          onClick={() => setActiveExample('job')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeExample === 'job'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Job Application
        </button>
        <button
          onClick={() => setActiveExample('workflow')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            activeExample === 'workflow'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          n8n Workflow Input
        </button>
      </div>

      {/* Form Container */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {activeExample === 'registration' && 'User Registration Form'}
          {activeExample === 'job' && 'Job Application Form'}
          {activeExample === 'workflow' && 'n8n Workflow Input Form'}
        </h2>
        
        <DynamicForm
          schema={getSchema()}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>

      {/* Submitted Data Display */}
      {submittedData && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-800 mb-3">
            ✅ Submitted Data
          </h3>
          <pre className="bg-white p-4 rounded border border-green-200 overflow-x-auto text-sm">
            {JSON.stringify(submittedData, null, 2)}
          </pre>
          <button
            onClick={() => setSubmittedData(null)}
            className="mt-4 text-sm text-green-700 hover:text-green-900 font-medium"
          >
            Clear
          </button>
        </div>
      )}

      {/* Schema Display */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          Current JSON Schema
        </h3>
        <pre className="bg-white p-4 rounded border border-gray-200 overflow-x-auto text-xs">
          {JSON.stringify(getSchema(), null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default DynamicFormExample;
