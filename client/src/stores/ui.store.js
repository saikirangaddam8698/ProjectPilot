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

  return {
    isSidebarCollapsed,
    isMobileNavOpen,
    isSearchModalOpen,
    toggleSidebar,
    setSidebarCollapsed,
    toggleMobileNav,
    closeMobileNav,
    openSearchModal,
    closeSearchModal
  };
});
