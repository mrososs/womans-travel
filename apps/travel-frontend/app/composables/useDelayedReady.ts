import { computed, onBeforeUnmount, onMounted, ref, toValue, type MaybeRefOrGetter } from 'vue';

/**
 * useDelayedReady — gates content behind a minimum-visible skeleton window.
 *
 * `ready` stays `false` until BOTH the loading source has settled and a small
 * timer has elapsed, so skeletons never flash-and-vanish. The timer only runs
 * on the client (started in `onMounted`), which keeps SSR and the first client
 * paint in sync — both render `ready = false` (skeletons), then it flips.
 *
 * @param pending  Reactive loading flag (e.g. useAsyncData's `pending`/`status`).
 * @param minMs    Minimum time the skeleton stays visible, in ms.
 */
export function useDelayedReady(pending: MaybeRefOrGetter<boolean> = false, minMs = 900) {
  const timerElapsed = ref(false);
  let timer: ReturnType<typeof setTimeout> | undefined;

  onMounted(() => {
    timer = setTimeout(() => {
      timerElapsed.value = true;
    }, minMs);
  });

  onBeforeUnmount(() => {
    if (timer) clearTimeout(timer);
  });

  const ready = computed(() => timerElapsed.value && !toValue(pending));
  return { ready };
}
