<script setup lang="ts">
import { ref } from 'vue';
import { Button, Input, Icon } from '@org/shared-ui';

/**
 * ImageUpload — dashboard photo picker. Uploads the chosen file to the public
 * `content` Storage bucket (via useAdminContent) and binds the resulting public
 * URL through v-model. The URL is also editable as text, so existing static
 * paths like `/trips/moscow.webp` keep working.
 */
const props = defineProps<{
  modelValue: string | null | undefined;
  folder: 'trips' | 'packages';
  /** Row slug/id — used to name the uploaded file. */
  slug: string;
  label?: string;
}>();
const emit = defineEmits<{ 'update:modelValue': [value: string] }>();

const { t } = useI18n();
const { uploadImage } = useAdminContent();
const notify = useNotify();

const fileInput = ref<HTMLInputElement | null>(null);
const uploading = ref(false);

function pick() {
  fileInput.value?.click();
}

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  uploading.value = true;
  try {
    const url = await uploadImage(file, props.folder, props.slug);
    emit('update:modelValue', url);
    notify.success(t('admin.photoUploaded'));
  } catch (err) {
    notify.error((err as Error)?.message || t('admin.photoError'));
  } finally {
    uploading.value = false;
    if (fileInput.value) fileInput.value.value = '';
  }
}
</script>

<template>
  <div class="imgup">
    <label class="imgup__label">{{ label || t('admin.photo') }}</label>
    <div class="imgup__row">
      <div class="imgup__preview" :class="{ 'imgup__preview--empty': !modelValue }">
        <img v-if="modelValue" :src="modelValue" alt="" >
        <Icon v-else name="image" :size="26" />
      </div>
      <div class="imgup__controls">
        <Button type="button" variant="outline" size="sm" :disabled="uploading" @click="pick">
          <template #iconStart><Icon :name="uploading ? 'loader' : 'upload'" :size="16" /></template>
          {{ uploading ? t('admin.uploading') : t('admin.uploadPhoto') }}
        </Button>
        <Input
          :model-value="modelValue ?? ''"
          size="sm"
          :placeholder="t('admin.photoUrlPlaceholder')"
          @update:model-value="emit('update:modelValue', String($event))"
        />
      </div>
    </div>
    <input ref="fileInput" type="file" accept="image/*" class="imgup__file" @change="onFile" >
  </div>
</template>

<style scoped>
.imgup { display: flex; flex-direction: column; gap: 7px; }
.imgup__label { font-size: var(--text-sm); font-weight: var(--weight-bold); color: var(--text-strong); }
.imgup__row { display: flex; gap: 14px; align-items: flex-start; }
.imgup__preview {
  flex: none; width: 96px; height: 72px; border-radius: var(--radius-md);
  overflow: hidden; background: var(--surface-cream); border: 1.5px solid var(--border-default);
  display: inline-flex; align-items: center; justify-content: center; color: var(--text-subtle);
}
.imgup__preview img { width: 100%; height: 100%; object-fit: cover; }
.imgup__preview--empty { border-style: dashed; }
.imgup__controls { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.imgup__file { display: none; }
</style>
