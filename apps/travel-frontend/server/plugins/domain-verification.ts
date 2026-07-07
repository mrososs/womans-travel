import { defineNitroPlugin } from 'nitropack/runtime';

// Domain-ownership verification meta tag (Saudi Business portal).
//
// The tag is also declared in `app.head` (nuxt.config.ts), but there Nuxt
// renders it *after* every component's inline <style> block — pushing it tens
// of KB down inside <head>. Verification crawlers typically scan only the first
// chunk of the HTML, so they never see it and report "can't verify".
//
// This hook unshifts the tag to the very top of <head>, guaranteeing it appears
// in the first bytes of the document on every SSR response.
const DOMAIN_VERIFICATION_META =
  '<meta name="domain-verification" content="83065a6f543e8c0ddad02416200a0670156ec3f0c221f8d0cdbc0d864fc5aef2">';

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html) => {
    html.head.unshift(DOMAIN_VERIFICATION_META);
  });
});
