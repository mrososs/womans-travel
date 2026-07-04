<script setup lang="ts">
import { Card, Skeleton } from '@org/shared-ui';
</script>

<template>
  <Card variant="elevated" padding="none" class="prod-sk">
    <Skeleton class="prod-sk__media" radius="0" />
    <div class="prod-sk__body">
      <Skeleton variant="text" width="65%" height="1.05em" />
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="80%" />
      <Skeleton class="prod-sk__price" variant="text" width="40%" height="1.25em" />
    </div>
  </Card>
</template>

<style scoped>
.prod-sk { display: flex; flex-direction: column; height: 100%; }
.prod-sk__media { aspect-ratio: 4 / 3; width: 100%; }
.prod-sk__body { padding: var(--space-5); display: flex; flex-direction: column; gap: 8px; }
.prod-sk__price { margin-top: 4px; }
</style>
