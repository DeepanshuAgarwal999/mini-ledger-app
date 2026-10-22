import { API_URL } from './config';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler;
};

export const authHeaders = (): Record<string, string> =>
  authToken ? { Authorization: `Bearer ${authToken}` } : {};

export const apiUrl = (path: string) => `${API_URL}${path}`;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  /** A plain object is sent as JSON; FormData is sent as multipart. */
  body?: unknown;
}

export async function apiRequest<T>(path: string, { method = 'GET', body }: RequestOptions = {}): Promise<T> {
  const isForm = body instanceof FormData;
  const headers: Record<string, string> = { Accept: 'application/json', ...authHeaders() };
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch (error) {
    const reason = error instanceof Error ? ` (${error.message})` : '';
    throw new ApiError(0, `Can't reach the server at ${API_URL}${reason}. Is the backend running?`);
  }

  if (response.status === 204) return undefined as T;
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // An expired/invalid session token logs the user out everywhere.
    if (response.status === 401 && authToken) onUnauthorized?.();
    throw new ApiError(response.status, data.error ?? `Request failed (${response.status})`, data.details);
  }
  return data as T;
}

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong. Please try again.';
