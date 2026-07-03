import { toast, type ToastOptions } from 'vue3-toastify';

/**
 * useNotify — thin, locale/RTL-aware wrapper over vue3-toastify.
 * Use for all CTA feedback (login, register, add-to-cart, wishlist, …).
 */
export function useNotify() {
  const { locale } = useI18n();

  const base = (): ToastOptions => ({
    rtl: locale.value === 'ar',
    position: 'top-center',
  });

  return {
    success: (message: string, options?: ToastOptions) => toast.success(message, { ...base(), ...options }),
    error: (message: string, options?: ToastOptions) => toast.error(message, { ...base(), ...options }),
    info: (message: string, options?: ToastOptions) => toast.info(message, { ...base(), ...options }),
    warn: (message: string, options?: ToastOptions) => toast.warn(message, { ...base(), ...options }),
  };
}
