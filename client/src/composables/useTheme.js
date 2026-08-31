import { ref, computed } from 'vue';

const THEME_STORAGE_KEY = 'projectpilot_theme';

const currentTheme = ref('dark');

/**
 * Initializes the theme based on local storage or system preference
 */
export function initTheme() {
  const saved = localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === 'light' || saved === 'dark') {
    applyTheme(saved, false);
  } else {
    // Check system preference
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light', false);
  }
}

/**
 * Applies theme to DOM and persists to localStorage
 */
function applyTheme(theme, animate = true) {
  currentTheme.value = theme;
  localStorage.setItem(THEME_STORAGE_KEY, theme);

  const root = document.documentElement;

  if (animate) {
    root.classList.add('theme-transitioning');
    window.setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 200);
  }

  root.setAttribute('data-theme', theme);
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function useTheme() {
  const isDark = computed(() => currentTheme.value === 'dark');

  function toggleTheme() {
    applyTheme(isDark.value ? 'light' : 'dark', true);
  }

  function setTheme(theme) {
    if (theme === 'light' || theme === 'dark') {
      applyTheme(theme, true);
    }
  }

  return {
    theme: currentTheme,
    isDark,
    toggleTheme,
    setTheme
  };
}
