/**
 * Image generator component
 *
 * Handles prompt input, size selection, and image generation
 */

import { generateImage } from '../lib/api.js';
import { SIZE_PRESETS, CATEGORY_LABELS } from '../lib/constants.js';

/** @type {boolean} */
let isGenerating = false;

/**
 * Initialize generator component
 */
export function initGenerator() {
  const form = document.getElementById('generate-form');
  const promptInput = document.getElementById('prompt-input');
  const sizeSelect = document.getElementById('size-select');
  const seedInput = document.getElementById('seed-input');
  const randomSeedBtn = document.getElementById('random-seed-btn');
  const submitBtn = document.getElementById('generate-btn');
  const resultContainer = document.getElementById('result-container');
  const advancedToggle = document.getElementById('advanced-toggle');
  const advancedOptions = document.getElementById('advanced-options');

  if (!form || !promptInput || !sizeSelect || !submitBtn || !resultContainer) {
    console.error('Generator component elements not found');
    return;
  }

  // Populate size presets grouped by category
  populateSizePresets(sizeSelect);

  // Advanced options toggle
  if (advancedToggle && advancedOptions) {
    advancedToggle.addEventListener('click', () => {
      advancedOptions.classList.toggle('hidden');
      advancedToggle.setAttribute(
        'aria-expanded',
        advancedOptions.classList.contains('hidden') ? 'false' : 'true'
      );
    });
  }

  // Random seed button
  if (randomSeedBtn && seedInput) {
    randomSeedBtn.addEventListener('click', () => {
      seedInput.value = Math.floor(Math.random() * 2147483647);
    });
  }

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (isGenerating) return;

    const prompt = promptInput.value.trim();
    if (!prompt) {
      promptInput.focus();
      return;
    }

    const presetIndex = parseInt(sizeSelect.value, 10);
    const preset = SIZE_PRESETS[presetIndex] || SIZE_PRESETS[0];
    const seed = seedInput?.value ? parseInt(seedInput.value, 10) : undefined;

    await handleGenerate({
      prompt,
      width: preset.width,
      height: preset.height,
      seed,
    });
  });

  // Keyboard shortcut: Ctrl/Cmd + Enter to generate
  promptInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      form.dispatchEvent(new Event('submit'));
    }
  });

  /**
   * Handle image generation
   * @param {Object} params
   */
  async function handleGenerate(params) {
    isGenerating = true;
    setLoading(true);
    showLoading();

    try {
      const data = await generateImage(params);

      if (data.success) {
        showResult(data, params.prompt);
        // Notify gallery to refresh
        window.dispatchEvent(new CustomEvent('image-generated'));
      } else {
        showError(data.error || 'Generation failed');
      }
    } catch (err) {
      console.error('Generation error:', err);
      showError('Failed to generate image. Please try again.');
    } finally {
      isGenerating = false;
      setLoading(false);
    }
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    promptInput.disabled = loading;
    sizeSelect.disabled = loading;

    const btnText = submitBtn.querySelector('.btn-text');
    const btnSpinner = submitBtn.querySelector('.btn-spinner');

    if (btnText) btnText.textContent = loading ? 'Generating...' : 'Generate';
    if (btnSpinner) btnSpinner.classList.toggle('hidden', !loading);
  }

  function showLoading() {
    resultContainer.innerHTML = `
      <div class="result-loading">
        <div class="spinner"></div>
        <p>Creating your image...</p>
        <p class="loading-hint">This may take a few seconds</p>
      </div>
    `;
    resultContainer.classList.remove('hidden');
  }

  function showResult(data, prompt) {
    const item = data.items?.[0] || data;
    const escapedPrompt = escapeHtml(prompt);

    resultContainer.innerHTML = `
      <div class="result-image-wrapper">
        <img
          src="${item.url}"
          alt="${escapedPrompt}"
          class="result-image"
          loading="eager"
        />
      </div>
      <div class="result-actions">
        <a href="${item.url}" download class="btn btn-primary">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Download
        </a>
        <button type="button" class="btn btn-secondary" id="copy-prompt-btn">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          Copy Prompt
        </button>
        <button type="button" class="btn btn-secondary" id="regenerate-btn">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Regenerate
        </button>
      </div>
      <div class="result-meta">
        <p class="result-prompt">${escapedPrompt}</p>
        <p class="result-info">
          ${item.width || item.meta?.width || '?'}×${item.height || item.meta?.height || '?'}
          ${item.meta?.seed ? ` • Seed: ${item.meta.seed}` : ''}
        </p>
      </div>
    `;

    // Copy prompt button
    const copyBtn = document.getElementById('copy-prompt-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(prompt).then(() => {
          copyBtn.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Copied!
          `;
          setTimeout(() => {
            copyBtn.innerHTML = `
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy Prompt
            `;
          }, 2000);
        });
      });
    }

    // Regenerate button (generates with new seed)
    const regenBtn = document.getElementById('regenerate-btn');
    if (regenBtn) {
      regenBtn.addEventListener('click', () => {
        const presetIndex = parseInt(sizeSelect.value, 10);
        const preset = SIZE_PRESETS[presetIndex] || SIZE_PRESETS[0];
        handleGenerate({
          prompt,
          width: preset.width,
          height: preset.height,
          seed: Math.floor(Math.random() * 2147483647),
        });
      });
    }
  }

  function showError(message) {
    resultContainer.innerHTML = `
      <div class="result-error">
        <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
        <p>${escapeHtml(message)}</p>
        <button type="button" class="btn btn-secondary" onclick="this.closest('.result-error').parentElement.classList.add('hidden')">
          Dismiss
        </button>
      </div>
    `;
    resultContainer.classList.remove('hidden');
  }
}

/**
 * Populate size select with grouped options
 * @param {HTMLSelectElement} select
 */
function populateSizePresets(select) {
  // Group presets by category
  const grouped = {};
  SIZE_PRESETS.forEach((preset, index) => {
    if (!grouped[preset.category]) {
      grouped[preset.category] = [];
    }
    grouped[preset.category].push({ ...preset, index });
  });

  // Create optgroups
  for (const [category, presets] of Object.entries(grouped)) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = CATEGORY_LABELS[category] || category;

    presets.forEach((preset) => {
      const option = document.createElement('option');
      option.value = preset.index;
      option.textContent = preset.name;
      optgroup.appendChild(option);
    });

    select.appendChild(optgroup);
  }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
