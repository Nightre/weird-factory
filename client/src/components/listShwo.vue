<template>
    <div v-if="data.length == 0" class="empty-state">
        <p class="empty">空空如也</p>
    </div>
    <div style="display: flex;flex-direction: column;" :style="{gap: size == 'small' ? '0.5rem' : '1rem'}">
        <slot></slot>
    </div>
</template>
<script setup lang="ts">
defineProps<{
    data: unknown[],
    size?: 'small' | 'large'
}>()
</script>
<style scoped>
.empty {
    text-align: center;
    color: #888;
}
.empty-state {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
}
</style>