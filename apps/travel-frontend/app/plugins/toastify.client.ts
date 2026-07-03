import Vue3Toastify, { type ToastContainerOptions } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';

/** Register vue3-toastify globally (client-only). */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(Vue3Toastify, {
    autoClose: 2600,
    position: 'top-center',
    theme: 'light',
    hideProgressBar: false,
    newestOnTop: true,
  } as ToastContainerOptions);
});
