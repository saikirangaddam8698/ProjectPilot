import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

/**
 * ProjectPilot Customized SweetAlert2 Base
 * Configured with application-level design tokens and interactive styling.
 */
export const PilotSwal = Swal.mixin({
  customClass: {
    container: 'pilot-swal-container',
    popup: 'pilot-swal-popup',
    title: 'pilot-swal-title',
    htmlContainer: 'pilot-swal-html',
    confirmButton: 'pilot-swal-btn pilot-swal-btn-confirm',
    cancelButton: 'pilot-swal-btn pilot-swal-btn-cancel',
    denyButton: 'pilot-swal-btn pilot-swal-btn-danger'
  },
  buttonsStyling: false,
  showCloseButton: true,
  showConfirmButton: true,
  showCancelButton: false,
  showDenyButton: false,
  reverseButtons: true,
  focusConfirm: true,
  showClass: {
    popup: 'swal2-show pilot-swal-animate-in'
  },
  hideClass: {
    popup: 'swal2-hide'
  }
});

/**
 * Show a warning alert popup inside the page
 */
export function showWarning(title, text, options = {}) {
  return PilotSwal.fire({
    icon: 'warning',
    title,
    text,
    showConfirmButton: true,
    showCancelButton: false,
    showDenyButton: false,
    confirmButtonText: options.confirmButtonText || 'Got it',
    ...options
  });
}

/**
 * Show an error alert popup inside the page
 */
export function showError(title, text, options = {}) {
  return PilotSwal.fire({
    icon: 'error',
    title,
    text,
    confirmButtonText: options.confirmButtonText || 'Close',
    ...options
  });
}

/**
 * Show a success alert popup inside the page
 */
export function showSuccess(title, text, options = {}) {
  return PilotSwal.fire({
    icon: 'success',
    title,
    text,
    confirmButtonText: options.confirmButtonText || 'Done',
    ...options
  });
}

/**
 * Show an informative alert popup inside the page
 */
export function showInfo(title, text, options = {}) {
  return PilotSwal.fire({
    icon: 'info',
    title,
    text,
    confirmButtonText: options.confirmButtonText || 'OK',
    ...options
  });
}

/**
 * Show a confirmation modal inside the page
 * @returns {Promise<boolean>} Resolves to true if confirmed, false otherwise
 */
export async function showConfirm({
  title = 'Are you sure?',
  text = '',
  html = null,
  confirmButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  icon = 'warning',
  isDestructive = false,
  ...options
} = {}) {
  const result = await PilotSwal.fire({
    title,
    text: html ? undefined : text,
    html: html || undefined,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    customClass: {
      container: 'pilot-swal-container',
      popup: 'pilot-swal-popup',
      title: 'pilot-swal-title',
      htmlContainer: 'pilot-swal-html',
      confirmButton: `pilot-swal-btn ${isDestructive ? 'pilot-swal-btn-danger' : 'pilot-swal-btn-confirm'}`,
      cancelButton: 'pilot-swal-btn pilot-swal-btn-cancel'
    },
    ...options
  });
  return !!result.isConfirmed;
}

/**
 * Application-level interceptor to completely prevent browser native alert() dialogs.
 * Any call to alert(...) or window.alert(...) will seamlessly display a SweetAlert2 popup.
 */
export function setupGlobalAlertOverride() {
  if (typeof window === 'undefined') return;

  window.alert = (message) => {
    const formatted = typeof message === 'object' ? JSON.stringify(message, null, 2) : String(message ?? '');
    showWarning('Notice', formatted);
  };
}

export default PilotSwal;
