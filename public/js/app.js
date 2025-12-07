/**
 * ImageNew - Main application entry point
 *
 * Security model:
 * - User's API key is stored in localStorage (imagenew_api_key)
 * - This key is validated against ALLOWED_TOKENS on the server
 * - TOGETHER_API_KEY is never exposed to the frontend
 */

import { getApiKey, clearApiKey } from './lib/storage.js';
import { verifyApiKey } from './lib/api.js';
import { initAuth } from './components/auth.js';
import { initGenerator } from './components/generator.js';
import { initGallery } from './components/gallery.js';

/**
 * Initialize application
 */
async function init() {
  const apiKey = getApiKey();

  if (!apiKey) {
    showAuthScreen();
  } else {
    // Verify stored key is still valid
    await verifyAndShowMain();
  }

  // Handle auth required event (from API client on 401)
  window.addEventListener('auth-required', () => {
    showAuthScreen();
  });
}

/**
 * Verify stored API key and show main screen
 */
async function verifyAndShowMain() {
  const apiKey = getApiKey();

  if (!apiKey) {
    showAuthScreen();
    return;
  }

  // Show loading state while verifying
  showScreen('loading');

  try {
    const isValid = await verifyApiKey(apiKey);

    if (isValid) {
      showMainScreen();
    } else {
      clearApiKey();
      showAuthScreen();
    }
  } catch (err) {
    console.error('Failed to verify API key:', err);
    // On network error, try to show main screen anyway
    // The API calls will fail and trigger re-auth if needed
    showMainScreen();
  }
}

/**
 * Show authentication screen
 */
function showAuthScreen() {
  showScreen('auth');
  initAuth(onAuthenticated);
}

/**
 * Show main application screen
 */
function showMainScreen() {
  showScreen('main');
  initGenerator();
  initGallery();

  // Logout button
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearApiKey();
      showAuthScreen();
    });
  }
}

/**
 * Handle successful authentication
 */
function onAuthenticated() {
  showMainScreen();
}

/**
 * Show specific screen, hide others
 * @param {'auth' | 'main' | 'loading'} name
 */
function showScreen(name) {
  const authScreen = document.getElementById('auth-screen');
  const mainScreen = document.getElementById('main-screen');
  const loadingScreen = document.getElementById('loading-screen');

  if (authScreen) authScreen.classList.toggle('hidden', name !== 'auth');
  if (mainScreen) mainScreen.classList.toggle('hidden', name !== 'main');
  if (loadingScreen) loadingScreen.classList.toggle('hidden', name !== 'loading');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
