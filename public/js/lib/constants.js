/**
 * Application constants
 */

/**
 * Image size presets
 * Based on common use cases and social media formats
 */
export const SIZE_PRESETS = [
  // Default - 10:6 ratio with 1024 width (must be multiple of 16)
  { name: '10:6 Banner (1024×608)', width: 1024, height: 608, category: 'landscape' },

  // Square
  { name: '1:1 Square (1024×1024)', width: 1024, height: 1024, category: 'square' },

  // Landscape
  { name: '16:9 Full HD (1920×1080)', width: 1920, height: 1080, category: 'landscape' },
  { name: '16:9 HD (1280×720)', width: 1280, height: 720, category: 'landscape' },
  { name: '2:1 Banner (1008×496)', width: 1008, height: 496, category: 'landscape' },

  // Portrait
  { name: '9:16 Full HD (1080×1920)', width: 1080, height: 1920, category: 'portrait' },
  { name: '9:16 HD (720×1280)', width: 720, height: 1280, category: 'portrait' },

  // Social Media
  { name: 'Instagram Post (1080×1080)', width: 1080, height: 1080, category: 'social' },
  { name: 'Instagram Story (1080×1920)', width: 1080, height: 1920, category: 'social' },
  { name: 'Twitter Post (1200×675)', width: 1200, height: 675, category: 'social' },
  { name: 'Facebook Cover (820×312)', width: 820, height: 312, category: 'social' },
  { name: 'YouTube Thumbnail (1280×720)', width: 1280, height: 720, category: 'social' },
];

/**
 * Default generation settings
 */
export const DEFAULTS = {
  width: 1024,
  height: 1024,
  steps: 4,
};

/**
 * Category labels for size presets
 */
export const CATEGORY_LABELS = {
  square: 'Square',
  landscape: 'Landscape',
  portrait: 'Portrait',
  social: 'Social Media',
};
