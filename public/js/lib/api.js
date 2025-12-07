/**
 * API client with automatic authentication
 *
 * Security note:
 * - Attaches user's API key (from localStorage) to all requests
 * - On 401, clears stored key and triggers re-authentication
 * - TOGETHER_API_KEY is never involved here - it's server-side only
 */

import { getApiKey, clearApiKey } from './storage.js';

/**
 * Make authenticated API request
 * @param {string} path - API path (e.g., '/api/gallery')
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<Response>}
 */
export async function apiRequest(path, options = {}) {
  const apiKey = getApiKey();

  const headers = {
    'Content-Type': 'application/json',
    ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
    ...options.headers,
  };

  const response = await fetch(path, {
    ...options,
    headers,
  });

  // Handle unauthorized - clear key and reload to show login
  if (response.status === 401) {
    clearApiKey();
    // Dispatch event so app can handle re-auth
    window.dispatchEvent(new CustomEvent('auth-required'));
  }

  return response;
}

/**
 * Generate image via API
 * @param {Object} params
 * @param {string} params.prompt
 * @param {number} params.width
 * @param {number} params.height
 * @param {number} [params.seed]
 * @param {number} [params.steps]
 * @returns {Promise<Object>}
 */
export async function generateImage(params) {
  const response = await apiRequest('/api/generate-image', {
    method: 'POST',
    body: JSON.stringify(params),
  });

  return response.json();
}

/**
 * Fetch gallery images
 * @param {number} [limit=12]
 * @param {number} [offset=0]
 * @returns {Promise<Object>}
 */
export async function fetchGallery(limit = 12, offset = 0) {
  const response = await apiRequest(`/api/gallery?limit=${limit}&offset=${offset}`);
  return response.json();
}

/**
 * Verify API key by making a test request
 * @param {string} key - API key to verify
 * @returns {Promise<boolean>}
 */
export async function verifyApiKey(key) {
  try {
    const response = await fetch('/api/gallery?limit=1', {
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}
