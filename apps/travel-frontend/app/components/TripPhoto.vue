<script setup lang="ts">
import { Icon } from '@org/shared-ui';

/**
 * TripPhoto — trip card / hero media. Renders an editorial photo when `img` is
 * supplied; otherwise falls back to the branded gradient with a faded landmark
 * glyph. The gradient also backs the image while it loads.
 */
withDefaults(
  defineProps<{ grad: string; icon: string; img?: string; alt?: string; iconSize?: number }>(),
  { img: '', alt: '', iconSize: 110 }
);
</script>

<template>
  <img
    v-if="img"
    class="trip-photo trip-photo--img"
    :src="img"
    :alt="alt"
    :style="{ background: grad }"
    loading="lazy"
    decoding="async"
  >
  <div v-else class="trip-photo" :style="{ background: grad }">
    <span class="trip-photo__ic">
      <Icon :name="icon" :size="iconSize" :stroke-width="1.1" color="#fff" />
    </span>
  </div>
</template>

<style scoped>
.trip-photo { position: relative; width: 100%; height: 100%; overflow: hidden; }
.trip-photo--img { object-fit: cover; display: block; }
.trip-photo__ic {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.22;
  color: #fff;
}
</style>
