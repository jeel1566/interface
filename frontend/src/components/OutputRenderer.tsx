import React from 'react';
import DOMPurify from 'dompurify';

interface OutputRendererProps {
    data: any;
}

export default function OutputRenderer({ data }: OutputRendererProps) {
    // Handle null/undefined
    if (data === null || data === undefined) {
        return <div className="text-gray-500 italic">No output</div>;
    }

    // Detect image URL
    if (typeof data === 'string' && /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(data)) {
        return (
            <div className="max-w-full">
                <img src={data} alt="Output" className="max-w-full h-auto rounded-lg shadow" />
            </div>
        );
    }

    // Detect file URL
    if (typeof data === 'string' && /\.(pdf|csv|xlsx|xls|doc|docx|zip)$/i.test(data)) {
        return (
            <a
                href={data}
                download
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                📥 Download File
            </a>
        );
    }

    // Detect HTML content - SANITIZED to prevent XSS
    if (typeof data === 'string' && data.includes('<') && data.includes('>')) {
        return (
            <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data) }}
            />
        );
    }

    // Detect array of objects (table data)
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
        const keys = Object.keys(data[0]);
        return (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                        <tr>
                            {keys.map((key) => (
                                <th
                                    key={key}
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    {key}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                                {keys.map((key) => (
                                    <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {typeof row[key] === 'object' ? JSON.stringify(row[key]) : String(row[key])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    // Detect simple array
    if (Array.isArray(data)) {
        return (
            <ul className="list-disc list-inside space-y-1">
                {data.map((item, idx) => (
                    <li key={idx} className="text-sm text-gray-700">
                        {typeof item === 'object' ? JSON.stringify(item) : String(item)}
                    </li>
                ))}
            </ul>
        );
    }

    // Detect boolean
    if (typeof data === 'boolean') {
        return (
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${data ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                {data ? '✓ True' : '✗ False'}
            </div>
        );
    }

    // Detect number
    if (typeof data === 'number') {
        return <div className="text-lg font-semibold text-gray-900">{data.toLocaleString()}</div>;
    }

    // Detect plain string
    if (typeof data === 'string') {
        return <div className="text-gray-900 whitespace-pre-wrap">{data}</div>;
    }

    // Default: JSON viewer with syntax highlighting
    return (
        <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto">
            <code className="text-sm text-gray-800">
                {JSON.stringify(data, null, 2)}
            </code>
        </pre>
    );
}
