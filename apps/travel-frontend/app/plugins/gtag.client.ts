/**
 * Google Analytics 4 (gtag.js) — client-only.
 *
 * Two things the vanilla GA snippet gets wrong in a Nuxt app, both handled here:
 *
 *  1. **SPA navigation.** After hydration Nuxt swaps routes without a document
 *     load, so gtag's automatic page_view fires exactly once — for the landing
 *     route — and every page after it is invisible. We disable the automatic
 *     hit (`send_page_view: false`) and emit one per `router.afterEach` instead.
 *
 *  2. **Dev noise.** The tag is skipped in development so local work never
 *     lands in the production property.
 *
 * The measurement ID comes from `runtimeConfig.public.gaMeasurementId`
 * (GA_MEASUREMENT_ID). `www.googletagmanager.com` and the google-analytics
 * collect endpoints are whitelisted in the CSP in nuxt.config.ts — without
 * those entries the browser blocks the script and nothing is ever reported.
 *
 * Events are sent through `useAnalytics()`, never by touching gtag directly.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const measurementId = useRuntimeConfig().public.gaMeasurementId as string;
  if (!measurementId || import.meta.dev) return;

  window.dataLayer = window.dataLayer || [];
  // gtag requires the `arguments` object itself, not an array — pushing a rest
  // parameter array is not recognised as a command by gtag.js.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    send_page_view: false,
    anonymize_ip: true,
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // One page_view per route, including the first. `router.afterEach` also
  // fires for the initial hydration navigation, so the path is deduped —
  // otherwise every first load would be counted twice.
  const router = useRouter();
  let lastPath = '';
  const sendPageView = () => {
    const path = router.currentRoute.value.fullPath;
    if (path === lastPath) return;
    lastPath = path;
    window.gtag?.('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: path,
    });
  };

  nuxtApp.hook('app:mounted', sendPageView);
  // Deferred a tick so the incoming page's useHead() title is already applied.
  router.afterEach(() => nextTick(sendPageView));
});
