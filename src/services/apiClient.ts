import type { ApiErrorPayload } from '../types/auth';
import { getStoredToken } from '../utils/storage';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') || '';

export class ApiClientError extends Error {
  status: number;
  fieldErrors: Record<string, string> | null;

  constructor(status: number, message: string, fieldErrors: Record<string, string> | null = null) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  let payload: unknown = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    payload = await response.json();
  }

  if (!response.ok) {
    const err = payload as Partial<ApiErrorPayload> | null;
    throw new ApiClientError(
      response.status,
      err?.message || `Request failed (${response.status})`,
      err?.fieldErrors ?? null,
    );
  }

  return payload as T;
}
