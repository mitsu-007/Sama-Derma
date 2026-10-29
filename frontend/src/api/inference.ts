/**
 * Resolves the backend API base URL from Vite environment variable `VITE_API_BASE_URL`.
 * Defaults to 'http://127.0.0.1:8000' for local development.
 * Automatically normalizes trailing slashes.
 */
export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return 'http://127.0.0.1:8000';
}

export const API_BASE_URL = getApiBaseUrl();

export interface ApiScoreItem {
  class_index: number;
  category: string;
  uncalibrated_score: number;
}

export interface ApiPredictionResponse {
  status: string;
  predicted_category: string;
  predicted_score: number;
  scores: ApiScoreItem[];
  device: string;
  timestamp: string;
  disclaimer: string;
}

export interface ApiHealthResponse {
  status: string;
  model_loaded: boolean;
  device: string;
  architecture: string;
  num_classes: number;
}

/**
 * Check backend health and model readiness
 */
export async function checkBackendHealth(): Promise<ApiHealthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  if (!response.ok) {
    throw new Error(`Backend health check failed: HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Submit image to /api/predict endpoint
 * Zero fake fallbacks: throws on any network or server error.
 */
export async function predictImageApi(file: File): Promise<ApiPredictionResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/predict`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorDetail = `Inference request failed with HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.detail) {
        errorDetail = errJson.detail;
      }
    } catch {
      // response was not JSON
    }
    throw new Error(errorDetail);
  }

  return response.json();
}
