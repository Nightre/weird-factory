<template>
    <div class="progress-container">
        <div class="progress-bar" :style="{ width: `${(nextTickTime / maxTime) * 100}%` }"></div>
    </div>
</template>

<script setup lang="ts">
import { APPLY_TIME, useGameStore, type IRoomState } from '@/stores/game';
import { ref } from 'vue';

const store = useGameStore()
const nextTickTime = ref(0)
const maxTime = Math.round(APPLY_TIME / 1000) - 1

const updateNextTickTime = () => {
    const timerStartTime = (store.roomState as IRoomState).timerStartTime
    nextTickTime.value = Math.floor(((Date.now() - timerStartTime) % APPLY_TIME) / 1000)
    requestAnimationFrame(updateNextTickTime)
}

updateNextTickTime()
</script>
<style scoped>
.progress-container {
    width: 100%;
    height: 5px;
    background-color: #e0e0e0;
    overflow: hidden;
    border-top: 1px solid #dcdcdc;
}

.progress-bar {
    height: 100%;
    background-color: #5162ff;
    transition: width 0.5s ease-in-out;
}
</style>
