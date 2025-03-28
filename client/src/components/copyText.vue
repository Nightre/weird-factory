<template>
  <span @click="copyText" style="color: #8a8a8a;">{{ props.textToCopy }}</span>
</template>
<script setup lang="ts">
import { useToast } from 'vuestic-ui';
const { notify } = useToast()

const props = defineProps<{ textToCopy: string }>();

const copyText = async () => {
  try {
    // 检查是否有剪贴板权限
    if (!navigator.clipboard) {
      // 降级方案 - 使用传统的document.execCommand
      const textArea = document.createElement('textarea');
      textArea.value = props.textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (!success) {
        throw new Error('复制失败');
      }
    } else {
      // 使用现代Clipboard API
      await navigator.clipboard.writeText(props.textToCopy);
    }
    notify({ message: "房间号复制成功！" })
  } catch (err) {
    notify({ message: "复制失败,请手动复制", color: "danger" })
    console.error('复制失败:', err);
  }
};
</script>
<style scoped>
</style>
