<template>
    <div class="bbox">
        <div class="box">
            <button @click="setScale(scale + d)">
                <VaIcon class="material-icons">
                    add
                </VaIcon>
            </button>
            <button @click="setScale(1)">
                <VaIcon class="material-icons">
                    refresh
                </VaIcon>
            </button>
            <button @click="setScale(scale - d)">
                <VaIcon class="material-icons">
                    remove
                </VaIcon>
            </button>
        </div>
    </div>
</template>
<script setup lang="ts">
import { useZoomable } from '@/composables/useZoomable';

const d = 0.3
const { setScale, scale } = useZoomable()

</script>
<style scoped>
.bbox {
    position: relative;
}

.box {
    position: absolute;
    right: 0.4rem;
    bottom: 0.4rem;
    display: flex;
    gap: 2px; /* 按钮之间的间距 */
    background: #f5f5f5; /* 浅灰背景 */
    border-radius: 4px; /* 圆角 */
    padding: 2px; /* 内边距 */
}

.box button {
    flex: 1;
    height: 2rem;
    width: 2rem;
    border: none; /* 移除默认边框 */
    background: white;
    cursor: pointer;
}

.box button:hover {
    background: #e0e0e0; /* hover 效果 */
}

/* 可选：第一个和最后一个按钮的圆角 */
.box button:first-child {
    border-radius: 3px 0 0 3px;
}

.box button:last-child {
    border-radius: 0 3px 3px 0;
}
</style>