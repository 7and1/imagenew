/**
 * LocalStorage wrapper for API key management
 *
 * Security note:
 * - This stores the USER's API key (from ALLOWED_TOKENS)
 * - NOT the TOGETHER_API_KEY (which is server-side only)
 */

const STORAGE_KEY = 'imagenew_api_key';

/**
 * Get stored API key
 * @returns {string|null}
 */
export function getApiKey() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Store API key
 * @param {string} key
 */
export function setApiKey(key) {
  try {
    localStorage.setItem(STORAGE_KEY, key);
  } catch (e) {
    console.warn('Failed to store API key:', e);
  }
}

/**
 * Remove stored API key
 */
export function clearApiKey() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}

/**
 * Check if API key exists
 * @returns {boolean}
 */
export function hasApiKey() {
  return !!getApiKey();
}
