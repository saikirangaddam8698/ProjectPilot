import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

const SIDEBAR_STORAGE_KEY = 'projectpilot_sidebar_collapsed';

export const useUiStore = defineStore('ui', () => {
  // Application-level operational in-progress indicators
  // Key: operationId, Value: { id, label, timestamp }
  const activeOperations = ref(new Map());

  function startOperation(id, label) {
    if (!id || !label) return;
    const updated = new Map(activeOperations.value);
    updated.set(id, { id, label, timestamp: Date.now() });
    activeOperations.value = updated;
  }

  function endOperation(id) {
    if (!id) return;
    if (activeOperations.value.has(id)) {
      const updated = new Map(activeOperations.value);
      updated.delete(id);
      activeOperations.value = updated;
    }
  }

  const currentOperation = computed(() => {
    const ops = Array.from(activeOperations.value.values());
    return ops.length > 0 ? ops[ops.length - 1] : null;
  });

  const isAnyOperationRunning = computed(() => {
    return activeOperations.value.size > 0;
  });

  // Sidebar state (open by default on every login)
  const isSidebarCollapsed = ref(false);

  // Mobile navigation drawer state
  const isMobileNavOpen = ref(false);

  // Quick command / search palette modal state
  const isSearchModalOpen = ref(false);

  function openSidebar() {
    isSidebarCollapsed.value = false;
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, 'false');
    } catch (e) {}
  }

  function toggleSidebar() {
    isSidebarCollapsed.value = !isSidebarCollapsed.value;
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isSidebarCollapsed.value));
    } catch (e) {}
  }

  function setSidebarCollapsed(collapsed) {
    isSidebarCollapsed.value = collapsed;
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
    } catch (e) {}
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

  // Floating AI Quick Chat state
  const isQuickChatOpen = ref(false);
  const isQuickChatMinimized = ref(false);

  function openQuickChat() {
    isQuickChatOpen.value = true;
    isQuickChatMinimized.value = false;
  }

  function closeQuickChat() {
    isQuickChatOpen.value = false;
    isQuickChatMinimized.value = false;
  }

  function toggleQuickChat() {
    if (isQuickChatMinimized.value) {
      isQuickChatMinimized.value = false;
      isQuickChatOpen.value = true;
    } else {
      isQuickChatOpen.value = !isQuickChatOpen.value;
    }
  }

  function minimizeQuickChat() {
    isQuickChatMinimized.value = true;
    isQuickChatOpen.value = false;
  }

  function restoreQuickChat() {
    isQuickChatMinimized.value = false;
    isQuickChatOpen.value = true;
  }

  return {
    isSidebarCollapsed,
    isMobileNavOpen,
    isSearchModalOpen,
    isNavigating,
    isPageLoading,
    isQuickChatOpen,
    isQuickChatMinimized,
    activeOperations,
    currentOperation,
    isAnyOperationRunning,
    startOperation,
    endOperation,
    toggleSidebar,
    openSidebar,
    setSidebarCollapsed,
    toggleMobileNav,
    closeMobileNav,
    openSearchModal,
    closeSearchModal,
    setNavigating,
    triggerPageLoading,
    openQuickChat,
    closeQuickChat,
    toggleQuickChat,
    minimizeQuickChat,
    restoreQuickChat
  };
});
