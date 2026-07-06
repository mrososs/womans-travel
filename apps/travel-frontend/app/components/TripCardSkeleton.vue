<script setup lang="ts">
import { Card, Skeleton } from '@org/shared-ui';
</script>

<template>
  <Card variant="elevated" padding="none" class="trip-sk">
    <Skeleton class="trip-sk__media" radius="0" />
    <div class="trip-sk__body">
      <Skeleton variant="text" width="45%" />
      <Skeleton variant="text" width="80%" height="1.25em" />
      <Skeleton variant="text" width="60%" />
      <Skeleton class="trip-sk__price" variant="text" width="50%" height="1.4em" />
    </div>
  </Card>
</template>

<style scoped>
.trip-sk { display: flex; flex-direction: column; height: 100%; }
.trip-sk__media { aspect-ratio: 16 / 10; width: 100%; }
.trip-sk__body { padding: var(--space-6); display: flex; flex-direction: column; gap: 10px; }
.trip-sk__price { margin-top: 6px; }
</style>
