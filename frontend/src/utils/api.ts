import { ZodError, z } from 'zod';

const BASE_URL = import.meta.env.VITE_API_URL;

/**
 * A custom error class for API-related errors.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public errors?: any,
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
  }
}

/**
 * A wrapper around the native fetch function to provide default headers,
 * error handling, and response parsing.
 *
 * @param endpoint - The API endpoint to call (e.g., '/workflows').
 * @param options - Optional fetch options (method, body, etc.).
 * @param schema - Optional Zod schema to validate the response.
 * @returns The parsed JSON response.
 * @throws {ApiError} if the API response is not ok.
 * @throws {ZodError} if the response does not match the schema.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  schema?: z.ZodType<T>,
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    // Add other default headers here, like Authorization
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        // Response was not JSON
        errorData = { detail: 'An unexpected error occurred.' };
      }
      throw new ApiError(response.status, response.statusText, errorData);
    }

    const data = await response.json();

    if (schema) {
      const validationResult = schema.safeParse(data);
      if (!validationResult.success) {
        throw validationResult.error;
      }
      return validationResult.data;
    }

    return data as T;
  } catch (error) {
    if (error instanceof ApiError || error instanceof ZodError) {
      // Re-throw known errors
      throw error;
    }
    // Handle network errors or other unexpected issues
    console.error('Unhandled API fetch error:', error);
    throw new Error('A network error occurred. Please try again.');
  }
}

// Example interceptor-like functions (can be expanded)

/**
 * Request interceptor placeholder.
 * This function can be called before making a request to modify options.
 * @param options - The request options.
 * @returns The modified options.
 */
export function requestInterceptor(options: RequestInit): RequestInit {
  // Example: Add a JWT token to the headers
  const token = localStorage.getItem('token');
  if (token) {
    options.headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    };
  }
  return options;
}

/**
 * Response interceptor placeholder.
 * This function can be called after receiving a response.
 * @param response - The fetch response.
 * @returns The original response.
 */
export function responseInterceptor(response: Response): Response {
  // Example: Handle 401 Unauthorized responses globally
  if (response.status === 401) {
    // Redirect to login page or refresh token
    console.error('Unauthorized access - redirecting to login.');
    // window.location.href = '/login';
  }
  return response;
}
