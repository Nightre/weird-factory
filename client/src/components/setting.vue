<template>
    <VaSwitch v-model="store.snap" label="吸附" size="small" />
</template>
<script setup lang="ts">
import { useGameStore } from '@/stores/game';

const store = useGameStore()
</script>