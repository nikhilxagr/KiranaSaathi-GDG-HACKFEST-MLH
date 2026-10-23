import { HealthCheckResponse, ReadinessResponse } from '../types';

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api').trim().replace(/\/+$/, '');
const API_BASE_URL = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;

/**
 * Fetch backend service health status.
 * Applies a reasonable timeout to prevent hanging UI requests.
 */
export const checkBackendHealth = async (timeoutMs = 4000): Promise<HealthCheckResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Health check failed with status: ${response.status}`);
    }

    const data: HealthCheckResponse = await response.json();
    return data;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`Health check timed out after ${timeoutMs}ms`);
    }
    throw err instanceof Error ? err : new Error('Backend health check failed');
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Fetch backend readiness status.
 */
export const checkBackendReadiness = async (timeoutMs = 4000): Promise<ReadinessResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}/health/ready`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Readiness check failed with status: ${response.status}`);
    }

    const data: ReadinessResponse = await response.json();
    return data;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error(`Readiness check timed out after ${timeoutMs}ms`);
    }
    throw err instanceof Error ? err : new Error('Backend readiness check failed');
  } finally {
    clearTimeout(timeoutId);
  }
};
