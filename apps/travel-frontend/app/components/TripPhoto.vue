<script setup lang="ts">
import { Icon } from '@org/shared-ui';

/**
 * TripPhoto — branded gradient placeholder with a faded landmark glyph.
 * Stands in for editorial photography until real assets are supplied.
 */
withDefaults(
  defineProps<{ grad: string; icon: string; iconSize?: number }>(),
  { iconSize: 110 }
);
</script>

<template>
  <div class="trip-photo" :style="{ background: grad }">
    <span class="trip-photo__ic">
      <Icon :name="icon" :size="iconSize" :stroke-width="1.1" color="#fff" />
    </span>
  </div>
</template>

<style scoped>
.trip-photo { position: relative; width: 100%; height: 100%; overflow: hidden; }
.trip-photo__ic {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.22;
  color: #fff;
}
</style>
