/**
 * Gallery component
 *
 * Displays recent generated images with pagination
 */

import { fetchGallery } from '../lib/api.js';

const ITEMS_PER_PAGE = 12;

/** @type {number} */
let currentOffset = 0;

/** @type {boolean} */
let isLoading = false;

/**
 * Initialize gallery component
 */
export function initGallery() {
  loadGallery();

  // Refresh when new image is generated
  window.addEventListener('image-generated', () => {
    currentOffset = 0;
    loadGallery();
  });

  // Handle auth required event
  window.addEventListener('auth-required', () => {
    // Gallery will be hidden when auth screen shows
  });
}

/**
 * Load gallery images
 */
async function loadGallery() {
  const container = document.getElementById('gallery-grid');
  const prevBtn = document.getElementById('gallery-prev');
  const nextBtn = document.getElementById('gallery-next');
  const pageInfo = document.getElementById('gallery-page-info');
  const emptyState = document.getElementById('gallery-empty');

  if (!container) {
    console.error('Gallery container not found');
    return;
  }

  if (isLoading) return;
  isLoading = true;

  try {
    // Show loading state
    container.innerHTML = `
      <div class="gallery-loading">
        <div class="spinner"></div>
      </div>
    `;

    const data = await fetchGallery(ITEMS_PER_PAGE, currentOffset);

    if (!data.images || data.images.length === 0) {
      if (currentOffset === 0) {
        // No images at all
        container.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
      } else {
        // No more images, go back
        currentOffset = Math.max(0, currentOffset - ITEMS_PER_PAGE);
        await loadGallery();
        return;
      }
    } else {
      // Hide empty state
      if (emptyState) emptyState.classList.add('hidden');

      // Render images
      container.innerHTML = data.images
        .map((img) => createGalleryItem(img))
        .join('');

      // Add click handlers for lightbox
      container.querySelectorAll('.gallery-item').forEach((item) => {
        item.addEventListener('click', () => {
          const url = item.dataset.url;
          const prompt = item.dataset.prompt;
          if (url) showLightbox(url, prompt);
        });
      });
    }

    // Update pagination
    if (prevBtn) {
      prevBtn.disabled = currentOffset === 0;
      prevBtn.onclick = () => {
        currentOffset = Math.max(0, currentOffset - ITEMS_PER_PAGE);
        loadGallery();
      };
    }

    if (nextBtn) {
      nextBtn.disabled = data.images.length < ITEMS_PER_PAGE;
      nextBtn.onclick = () => {
        currentOffset += ITEMS_PER_PAGE;
        loadGallery();
      };
    }

    if (pageInfo) {
      const page = Math.floor(currentOffset / ITEMS_PER_PAGE) + 1;
      pageInfo.textContent = `Page ${page}`;
    }
  } catch (err) {
    console.error('Failed to load gallery:', err);
    container.innerHTML = `
      <div class="gallery-error">
        <p>Failed to load images</p>
        <button type="button" class="btn btn-secondary" onclick="window.dispatchEvent(new CustomEvent('image-generated'))">
          Retry
        </button>
      </div>
    `;
  } finally {
    isLoading = false;
  }
}

/**
 * Create gallery item HTML
 * @param {Object} img
 * @returns {string}
 */
function createGalleryItem(img) {
  const prompt = img.metadata?.prompt || 'No prompt';
  const width = img.metadata?.width || '?';
  const height = img.metadata?.height || '?';
  const escapedPrompt = escapeHtml(prompt);

  return `
    <div class="gallery-item" data-url="${img.url}" data-prompt="${escapedPrompt}">
      <img
        src="${img.url}"
        alt="${escapedPrompt}"
        loading="lazy"
        class="gallery-image"
      />
      <div class="gallery-item-overlay">
        <p class="gallery-item-prompt">${truncate(escapedPrompt, 60)}</p>
        <p class="gallery-item-size">${width}×${height}</p>
      </div>
    </div>
  `;
}

/**
 * Show lightbox with full image
 * @param {string} url
 * @param {string} prompt
 */
function showLightbox(url, prompt) {
  // Remove existing lightbox
  const existing = document.getElementById('lightbox');
  if (existing) existing.remove();

  const lightbox = document.createElement('div');
  lightbox.id = 'lightbox';
  lightbox.className = 'lightbox';
  lightbox.innerHTML = `
    <div class="lightbox-backdrop"></div>
    <div class="lightbox-content">
      <button type="button" class="lightbox-close" aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <img src="${url}" alt="${escapeHtml(prompt || '')}" class="lightbox-image" />
      <div class="lightbox-footer">
        <p class="lightbox-prompt">${escapeHtml(prompt || '')}</p>
        <a href="${url}" download class="btn btn-primary">Download</a>
      </div>
    </div>
  `;

  document.body.appendChild(lightbox);

  // Close handlers
  const close = () => lightbox.remove();
  lightbox.querySelector('.lightbox-backdrop').addEventListener('click', close);
  lightbox.querySelector('.lightbox-close').addEventListener('click', close);
  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', handler);
    }
  });

  // Prevent body scroll
  document.body.style.overflow = 'hidden';
  lightbox.addEventListener('transitionend', () => {
    if (!document.getElementById('lightbox')) {
      document.body.style.overflow = '';
    }
  });
}

/**
 * Truncate string
 * @param {string} str
 * @param {number} max
 * @returns {string}
 */
function truncate(str, max) {
  if (str.length <= max) return str;
  return str.slice(0, max - 3) + '...';
}

/**
 * Escape HTML
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
