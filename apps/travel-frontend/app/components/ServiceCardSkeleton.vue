<script setup lang="ts">
import { Skeleton } from '@org/shared-ui';
</script>

<template>
  <div class="svc-sk">
    <Skeleton variant="rect" width="52px" height="52px" radius="15px" />
    <Skeleton variant="text" width="55%" height="1.1em" />
    <Skeleton variant="text" width="100%" />
    <Skeleton variant="text" width="80%" />
  </div>
</template>

<style scoped>
.svc-sk {
  background: var(--surface-card);
  border: 1px solid var(--border-hair);
  border-radius: var(--radius-lg);
  padding: 26px;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.svc-sk > :first-child { margin-bottom: 6px; }
</style>
