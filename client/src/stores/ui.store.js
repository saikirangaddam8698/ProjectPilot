import { defineStore } from 'pinia';
import { ref } from 'vue';

const SIDEBAR_STORAGE_KEY = 'projectpilot_sidebar_collapsed';

export const useUiStore = defineStore('ui', () => {
  // Sidebar state (collapsed vs expanded on desktop)
  const isSidebarCollapsed = ref(localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true');

  // Mobile navigation drawer state
  const isMobileNavOpen = ref(false);

  // Quick command / search palette modal state
  const isSearchModalOpen = ref(false);

  function toggleSidebar() {
    isSidebarCollapsed.value = !isSidebarCollapsed.value;
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarCollapsed.value));
  }

  function setSidebarCollapsed(collapsed) {
    isSidebarCollapsed.value = collapsed;
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
  }

  function toggleMobileNav() {
    isMobileNavOpen.value = !isMobileNavOpen.value;
  }

  function closeMobileNav() {
    isMobileNavOpen.value = false;
  }

  function openSearchModal() {
    isSearchModalOpen.value = true;
  }

  function closeSearchModal() {
    isSearchModalOpen.value = false;
  }

  // Route navigation & page skeleton loading state
  const isNavigating = ref(false);
  const isPageLoading = ref(false);
  let pageLoadingTimer = null;

  function setNavigating(navigating) {
    isNavigating.value = navigating;
  }

  function triggerPageLoading(minDurationMs = 1000) {
    if (pageLoadingTimer) clearTimeout(pageLoadingTimer);
    isPageLoading.value = true;
    isNavigating.value = true;
    pageLoadingTimer = setTimeout(() => {
      isPageLoading.value = false;
      isNavigating.value = false;
    }, minDurationMs);
  }

  return {
    isSidebarCollapsed,
    isMobileNavOpen,
    isSearchModalOpen,
    isNavigating,
    isPageLoading,
    toggleSidebar,
    setSidebarCollapsed,
    toggleMobileNav,
    closeMobileNav,
    openSearchModal,
    closeSearchModal,
    setNavigating,
    triggerPageLoading
  };
});
