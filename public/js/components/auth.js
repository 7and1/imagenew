/**
 * Authentication component
 *
 * Handles API key input and verification
 * Pattern based on imagegen's ApiKeyInput.tsx
 */

import { setApiKey, clearApiKey } from '../lib/storage.js';
import { verifyApiKey } from '../lib/api.js';

/**
 * Initialize auth component
 * @param {Function} onSuccess - Callback when authentication succeeds
 */
export function initAuth(onSuccess) {
  const form = document.getElementById('auth-form');
  const input = document.getElementById('api-key-input');
  const errorEl = document.getElementById('auth-error');
  const button = document.getElementById('auth-submit');
  const buttonText = document.getElementById('auth-button-text');
  const spinner = document.getElementById('auth-spinner');

  if (!form || !input || !button) {
    console.error('Auth component elements not found');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const key = input.value.trim();
    if (!key) {
      showError('Please enter an API key');
      return;
    }

    // Show loading state
    setLoading(true);
    hideError();

    try {
      const isValid = await verifyApiKey(key);

      if (isValid) {
        setApiKey(key);
        onSuccess();
      } else {
        clearApiKey();
        showError('Invalid API key');
        input.focus();
        input.select();
      }
    } catch (err) {
      showError('Failed to verify API key. Please try again.');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  });

  // Focus input on load
  input.focus();

  // Helper functions
  function setLoading(loading) {
    button.disabled = loading;
    input.disabled = loading;
    if (spinner) spinner.classList.toggle('hidden', !loading);
    if (buttonText) buttonText.textContent = loading ? 'Verifying...' : 'Continue';
  }

  function showError(message) {
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.remove('hidden');
    }
  }

  function hideError() {
    if (errorEl) {
      errorEl.classList.add('hidden');
    }
  }
}
