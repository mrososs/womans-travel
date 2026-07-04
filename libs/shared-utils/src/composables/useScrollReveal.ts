import { nextTick, onBeforeUnmount, onMounted, watch, type Ref, type WatchSource } from 'vue';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export interface ScrollRevealOptions {
  /** CSS selector for the elements to reveal, scoped to the root. */
  selector?: string;
  /** Vertical travel distance in px. */
  y?: number;
  /** Reveal duration in seconds (defaults to the design's 0.72s reveal). */
  duration?: number;
  /** Stagger between items in seconds (design range 0.08–0.12s). */
  stagger?: number;
  /** ScrollTrigger start position. */
  start?: string;
  /**
   * Optional reactive source watched for the reveal targets appearing later
   * (e.g. after a loading skeleton is swapped for real cards). When it changes,
   * the reveal is (re)attempted on the next DOM tick. The reveal still only
   * runs once, whichever trigger wins — `onMounted` or this watcher.
   */
  watch?: WatchSource;
}

/**
 * useScrollReveal — GSAP + ScrollTrigger staggered reveal for elements inside
 * a root element. Client-only (runs in onMounted), tuned to the Durrah motion
 * tokens (expo.out easing, ~720ms), and disabled under `prefers-reduced-motion`.
 *
 * @param root  A template ref to the container element.
 */
export function useScrollReveal(
  root: Ref<HTMLElement | null>,
  options: ScrollRevealOptions = {}
): void {
  const {
    selector = '[data-reveal]',
    y = 28,
    duration = 0.72,
    stagger = 0.1,
    start = 'top 82%',
    watch: watchSource,
  } = options;

  let triggers: ScrollTrigger[] = [];
  let done = false;

  function reveal(): void {
    if (done) return;
    const el = root.value;
    if (!el) return;

    const targets = Array.from(el.querySelectorAll<HTMLElement>(selector));
    if (!targets.length) return;

    done = true;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      gsap.set(targets, { opacity: 1, y: 0 });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const tween = gsap.from(targets, {
      opacity: 0,
      y,
      duration,
      ease: 'expo.out',
      stagger,
      scrollTrigger: { trigger: el, start },
    });

    if (tween.scrollTrigger) triggers.push(tween.scrollTrigger);
  }

  onMounted(reveal);

  if (watchSource) {
    watch(watchSource, () => nextTick(reveal), { flush: 'post' });
  }

  onBeforeUnmount(() => {
    triggers.forEach((t) => t.kill());
    triggers = [];
  });
}
