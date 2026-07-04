<script setup lang="ts">
import { Card, Skeleton } from '@org/shared-ui';
</script>

<template>
  <Card variant="elevated" padding="none" class="pkg-sk">
    <Skeleton class="pkg-sk__media" radius="0" />
    <div class="pkg-sk__body">
      <Skeleton variant="text" width="70%" height="1.15em" />
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="85%" />
      <Skeleton class="pkg-sk__price" variant="text" width="45%" height="1.4em" />
    </div>
  </Card>
</template>

<style scoped>
.pkg-sk { display: flex; flex-direction: column; height: 100%; }
.pkg-sk__media { aspect-ratio: 16 / 9; width: 100%; }
.pkg-sk__body { padding: var(--space-6); display: flex; flex-direction: column; gap: 10px; }
.pkg-sk__price { margin-top: 6px; }
</style>
